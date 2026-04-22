/**
 * Conversation Agent — multi-turn orchestrator.
 *
 * Drives the user through three input paths (docs/MASTER.md §12):
 *
 *   A) HAS_STORE       — 已有 Shopify / WooCommerce / 独立站  → 粘贴 URL
 *   B) HAS_SOURCE_LINK — 国内 1688 / Taobao / Tmall 工厂源 SKU → 粘贴源链接
 *   C) DESCRIBE_ONLY   — 没有任何参考                      → 多轮文字 + 参考图描述
 *
 * Each turn the agent:
 *   1. Looks at the current `ConversationContext.collectedInfo`
 *   2. Decides what the next single question should be (or that we're ready)
 *   3. Returns an `AssistantTurn` with reasoning + question + UI hints
 *   4. After the user answers, `ingestUser()` extracts new fields into `collectedInfo`
 *
 * When `isReadyToGenerate(context)` returns true, the calling tRPC layer
 * fires `services/worker.runPipeline()`.
 *
 * @owner W1 — docs/MASTER.md §12 + conversational pivot follow-up
 */
import { z } from 'zod'

import type { LlmModel, LlmProvider } from '../providers/types'
import type { VisualDnaId } from '../types/dna'

// ──────────────────────────────────────────────────────────────────────────
//  Types — match the Prisma `AiConversation.context` JSON column.
// ──────────────────────────────────────────────────────────────────────────

export type InputPath = 'HAS_STORE' | 'HAS_SOURCE_LINK' | 'DESCRIBE_ONLY'

export type ConversationStage =
  | 'choosing_path'
  | 'gathering_url'
  | 'gathering_source_link'
  | 'gathering_description'
  | 'gathering_audience'
  | 'gathering_references'
  | 'gathering_aesthetic'
  | 'choosing_dna'
  | 'choosing_format'
  | 'choosing_hero'
  | 'review_plan'
  | 'ready'

export const CollectedInfoSchema = z.object({
  inputPath: z.enum(['HAS_STORE', 'HAS_SOURCE_LINK', 'DESCRIBE_ONLY']).optional(),
  /** Path A/B 共用 — 用户提供的源 URL。*/
  sourceUrl: z.string().url().optional(),
  /** Path C 必填 — 用户文字描述（多轮可累加）。*/
  brandDescription: z.string().max(2000).optional(),
  brandName: z.string().max(80).optional(),
  productCategory: z.string().max(60).optional(),
  /** 海外消费者画像（最终独立站的客群）。 */
  targetAudience: z.string().max(280).optional(),
  /** 用户上传 / 列举的参考品牌（最多 5）。*/
  referenceBrands: z.array(z.string()).max(5).optional(),
  /** 用户描述的调性关键词。*/
  moodKeywords: z.array(z.string()).max(8).optional(),
  /** 用户对独立站要不要 3D 的偏好。 */
  format: z.enum(['video', '3d']).optional(),
  /** 用户最终选定的 Visual DNA 之一（10 个预设之一）。*/
  selectedDnaId: z.string().optional(),
  /** 用户最终选定的 Hero Moment id（M01..M10）。 */
  selectedMomentId: z.string().optional(),
  /** 用户最终选定的 hero 主角产品 id（来自 scrape 结果或用户上传）。*/
  heroProductId: z.string().optional(),
  /** 站点目标 locale。默认 en（海外消费者）。*/
  storeLocale: z.enum(['en', 'zh-CN', 'zh-HK', 'zh-TW']).optional(),
  /** 站点 region — `global` 是默认（卖给海外）；`cn` 是国内自营版。*/
  storeRegion: z.enum(['global', 'cn']).optional(),
})
export type CollectedInfo = z.infer<typeof CollectedInfoSchema>

export interface ConversationMessage {
  role: 'user' | 'assistant'
  /** Shown in the chat. */
  content: string
  /** Optional internal reasoning shown in a "AI thinking" disclosure. */
  reasoning?: string
  /** ISO8601 timestamp. */
  createdAt: string
}

export interface ConversationContext {
  stage: ConversationStage
  inputPath?: InputPath
  collectedInfo: CollectedInfo
  messages: ConversationMessage[]
  /** Credits spent on this conversation so far. */
  creditsUsed: number
}

export interface AssistantTurn {
  stage: ConversationStage
  /** What to render in the chat bubble. */
  message: string
  /** Internal reasoning the user can expand. */
  reasoning: string
  /** UI hint — how to render the user's reply input. */
  expects:
    | { kind: 'choice'; options: Array<{ id: string; label: string }> }
    | { kind: 'url' }
    | { kind: 'text'; multiline?: boolean; placeholder?: string }
    | { kind: 'tags'; suggestions?: string[] }
    | {
        kind: 'product'
        products: Array<{ id: string; title: string; imageUrl: string; priceCents: number }>
      }
    | { kind: 'confirm' }
}

const ASSISTANT_SYSTEM = `You are Forgely's onboarding consultant.

Your job: in the *fewest* turns possible, collect the structured fields
needed to generate a beautiful overseas brand site for a Chinese seller.

Strict rules:
- Always reply in the user's locale. If the user wrote zh-CN, you write zh-CN.
- Ask ONE question per turn. Be concrete and short.
- Surface your reasoning briefly (1 sentence) before the question.
- When enough info is collected for the current stage, transition to the next.

Stages (in order):
  choosing_path → gathering_url | gathering_source_link | gathering_description
  → gathering_audience → gathering_references → gathering_aesthetic
  → choosing_dna → choosing_format → choosing_hero → review_plan → ready

Return ONLY JSON:
{
  "stage": "<stage id>",
  "message": "<chat bubble shown to user>",
  "reasoning": "<one sentence why>",
  "expects": <see schema below>
}

expects is one of:
  { "kind": "choice", "options": [{ "id": "A", "label": "..." }, ...] }
  { "kind": "url" }
  { "kind": "text", "multiline": true|false, "placeholder": "..." }
  { "kind": "tags", "suggestions": ["..."] }
  { "kind": "product", "products": [{ "id": "...", "title": "...", "imageUrl": "...", "priceCents": 0 }] }
  { "kind": "confirm" }`

const AssistantTurnSchema = z.object({
  stage: z.enum([
    'choosing_path',
    'gathering_url',
    'gathering_source_link',
    'gathering_description',
    'gathering_audience',
    'gathering_references',
    'gathering_aesthetic',
    'choosing_dna',
    'choosing_format',
    'choosing_hero',
    'review_plan',
    'ready',
  ]),
  message: z.string().min(1).max(800),
  reasoning: z.string().min(1).max(280),
  expects: z.union([
    z.object({
      kind: z.literal('choice'),
      options: z
        .array(z.object({ id: z.string().min(1).max(40), label: z.string().min(1).max(120) }))
        .min(2)
        .max(8),
    }),
    z.object({ kind: z.literal('url') }),
    z.object({
      kind: z.literal('text'),
      multiline: z.boolean().optional(),
      placeholder: z.string().max(200).optional(),
    }),
    z.object({
      kind: z.literal('tags'),
      suggestions: z.array(z.string().min(2).max(30)).max(12).optional(),
    }),
    z.object({
      kind: z.literal('product'),
      products: z
        .array(
          z.object({
            id: z.string().min(1).max(80),
            title: z.string().min(1).max(120),
            imageUrl: z.string().url(),
            priceCents: z.number().int().nonnegative(),
          }),
        )
        .min(1)
        .max(8),
    }),
    z.object({ kind: z.literal('confirm') }),
  ]),
})

// ──────────────────────────────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────────────────────────────

export const CONVERSATION_OPENING_CREDITS = 2
export const CONVERSATION_PER_TURN_CREDITS = 3

/** Make a fresh empty conversation (call once per `siteId`). */
export function startConversation(initial?: Partial<CollectedInfo>): ConversationContext {
  return {
    stage: 'choosing_path',
    collectedInfo: { storeLocale: 'en', storeRegion: 'global', ...initial },
    messages: [],
    creditsUsed: 0,
  }
}

/** Quick rule: do we have enough info to call runPipeline? */
export function isReadyToGenerate(ctx: ConversationContext): boolean {
  const info = ctx.collectedInfo
  if (!info.inputPath) return false
  if (info.inputPath === 'HAS_STORE' && !info.sourceUrl) return false
  if (info.inputPath === 'HAS_SOURCE_LINK' && !info.sourceUrl) return false
  if (info.inputPath === 'DESCRIBE_ONLY' && !info.brandDescription) return false
  if (!info.targetAudience) return false
  if (!info.selectedDnaId) return false
  if (!info.selectedMomentId) return false
  if (!info.format) return false
  return true
}

export interface NextTurnOptions {
  provider: LlmProvider
  model?: LlmModel
  /** Set true to skip the LLM entirely (deterministic flow used by tests + fast dev). */
  scripted?: boolean
  /** Dashboard locale — drives scripted flow language and LLM language hint. */
  locale?: 'zh-CN' | 'en'
}

/** Drive one assistant turn — given context, ask the next question. */
export async function nextAssistantTurn(
  ctx: ConversationContext,
  options: NextTurnOptions,
): Promise<AssistantTurn> {
  const locale = options.locale ?? 'zh-CN'
  if (options.scripted || isReadyToGenerate(ctx)) {
    return scriptedTurn(ctx, locale)
  }

  const localeHint =
    locale === 'en'
      ? '\n\nIMPORTANT: The user prefers English. Reply entirely in English.'
      : '\n\nIMPORTANT: 用户偏好中文。所有回复必须使用简体中文。'

  const userPayload = buildLlmPayload(ctx)
  const res = await options.provider.text<unknown>({
    model: options.model ?? 'claude-sonnet-4',
    system: ASSISTANT_SYSTEM + localeHint,
    user: userPayload,
    jsonSchema: 'object',
    maxTokens: 800,
    temperature: 0.4,
  })
  return AssistantTurnSchema.parse(res.data)
}

/**
 * Apply a user reply to the conversation. Extracts fields into
 * `collectedInfo`, appends both messages, and bumps credits.
 *
 * The `parsedAnswer` argument is the structured payload the UI builds
 * from the assistant's `expects` hint (e.g. `{ choice: 'HAS_STORE' }`).
 */
export function ingestUser(
  ctx: ConversationContext,
  assistantTurn: AssistantTurn,
  parsedAnswer: UserAnswer,
  rawText: string,
): ConversationContext {
  const next: ConversationContext = {
    ...ctx,
    stage: assistantTurn.stage,
    creditsUsed: ctx.creditsUsed + CONVERSATION_PER_TURN_CREDITS,
    messages: [
      ...ctx.messages,
      {
        role: 'assistant',
        content: assistantTurn.message,
        reasoning: assistantTurn.reasoning,
        createdAt: new Date().toISOString(),
      },
      { role: 'user', content: rawText, createdAt: new Date().toISOString() },
    ],
  }
  next.collectedInfo = applyAnswer(next.collectedInfo, assistantTurn, parsedAnswer)
  return next
}

export type UserAnswer =
  | { kind: 'choice'; choice: string }
  | { kind: 'url'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'tags'; tags: string[] }
  | { kind: 'product'; productId: string }
  | { kind: 'confirm'; confirmed: boolean }

function applyAnswer(info: CollectedInfo, turn: AssistantTurn, answer: UserAnswer): CollectedInfo {
  const out: CollectedInfo = { ...info }
  switch (turn.stage) {
    case 'choosing_path':
      if (
        answer.kind === 'choice' &&
        (answer.choice === 'HAS_STORE' ||
          answer.choice === 'HAS_SOURCE_LINK' ||
          answer.choice === 'DESCRIBE_ONLY')
      ) {
        out.inputPath = answer.choice
      }
      break
    case 'gathering_url':
    case 'gathering_source_link':
      if (answer.kind === 'url') out.sourceUrl = answer.url
      break
    case 'gathering_description':
      if (answer.kind === 'text') out.brandDescription = answer.text
      break
    case 'gathering_audience':
      if (answer.kind === 'text') out.targetAudience = answer.text
      break
    case 'gathering_references':
      if (answer.kind === 'tags') out.referenceBrands = answer.tags
      break
    case 'gathering_aesthetic':
      if (answer.kind === 'tags') out.moodKeywords = answer.tags
      break
    case 'choosing_dna':
      if (answer.kind === 'choice') out.selectedDnaId = answer.choice
      break
    case 'choosing_format':
      if (answer.kind === 'choice' && (answer.choice === 'video' || answer.choice === '3d')) {
        out.format = answer.choice
      }
      break
    case 'choosing_hero':
      if (answer.kind === 'product') out.heroProductId = answer.productId
      break
    case 'review_plan':
    case 'ready':
      break
    default:
      break
  }
  return out
}

function buildLlmPayload(ctx: ConversationContext): string {
  const lines: string[] = []
  lines.push(`Current stage: ${ctx.stage}`)
  lines.push(`Collected so far: ${JSON.stringify(ctx.collectedInfo, null, 2)}`)
  lines.push('Recent dialog (last 6 turns):')
  for (const m of ctx.messages.slice(-6)) {
    lines.push(`  ${m.role}: ${m.content}`)
  }
  lines.push('')
  lines.push('Decide the next single question and return the JSON described in the system prompt.')
  return lines.join('\n')
}

// ──────────────────────────────────────────────────────────────────────────
//  Scripted (deterministic) flow — used when LLM is unavailable.
// ──────────────────────────────────────────────────────────────────────────

function scriptedTurn(ctx: ConversationContext, locale: 'zh-CN' | 'en' = 'zh-CN'): AssistantTurn {
  const info = ctx.collectedInfo
  const zh = locale !== 'en'
  if (!info.inputPath) {
    return {
      stage: 'choosing_path',
      message: zh
        ? '欢迎来到 Forgely。我们先确认输入：你属于下面哪种情况？'
        : "Welcome to Forgely. Let's start — which best describes your situation?",
      reasoning: zh
        ? '把用户分流到三条路径，决定后续问题策略。'
        : 'Route the user into one of three input paths.',
      expects: {
        kind: 'choice',
        options: zh
          ? [
              { id: 'HAS_STORE', label: '我已经有 Shopify / 独立站，想换一个更好的' },
              { id: 'HAS_SOURCE_LINK', label: '我有 1688 / Tmall / Taobao 源货链接，想做海外站' },
              { id: 'DESCRIBE_ONLY', label: '我没有现成的，想从描述开始' },
            ]
          : [
              {
                id: 'HAS_STORE',
                label: 'I already have a Shopify / independent site and want a better one',
              },
              {
                id: 'HAS_SOURCE_LINK',
                label: 'I have a 1688 / Tmall / Taobao source link and want to go overseas',
              },
              {
                id: 'DESCRIBE_ONLY',
                label: "I don't have anything yet — let me describe from scratch",
              },
            ],
      },
    }
  }
  if ((info.inputPath === 'HAS_STORE' || info.inputPath === 'HAS_SOURCE_LINK') && !info.sourceUrl) {
    const isCn = info.inputPath === 'HAS_SOURCE_LINK'
    return {
      stage: isCn ? 'gathering_source_link' : 'gathering_url',
      message: zh
        ? isCn
          ? '请粘贴你 1688 / Taobao / Tmall 的源货链接，我们会抓取产品作为海外独立站的素材。'
          : '请粘贴你现有 Shopify / 独立站的 URL，我会读取你的现有商品。'
        : isCn
          ? "Paste your 1688 / Taobao / Tmall source link. We'll scrape the products for your overseas store."
          : "Paste your existing Shopify / store URL and I'll import your products.",
      reasoning: zh
        ? '路径已确定，下一步取数据源。'
        : 'Path confirmed — next step is the data source.',
      expects: { kind: 'url' },
    }
  }
  if (info.inputPath === 'DESCRIBE_ONLY' && !info.brandDescription) {
    return {
      stage: 'gathering_description',
      message: zh
        ? '一句话告诉我你的品牌：你卖什么、给谁、想传达什么感觉？'
        : "In one sentence, tell me about your brand: what you sell, who it's for, and the vibe you want.",
      reasoning: zh
        ? '没有源数据，用文字提取品牌主意。'
        : 'No source data — extract brand idea from text.',
      expects: {
        kind: 'text',
        multiline: true,
        placeholder: zh
          ? '例如：手工木玩具，给追求慢生活的欧美父母…'
          : 'e.g. Handcrafted wooden toys for design-conscious Western parents…',
      },
    }
  }
  if (!info.targetAudience) {
    return {
      stage: 'gathering_audience',
      message: zh
        ? '一句话描述你最想触达的海外消费者画像。'
        : 'Describe your ideal overseas customer in one sentence.',
      reasoning: zh
        ? '客群是 Visual DNA 推荐和文案 tone 的关键。'
        : 'Audience is key for Visual DNA and copy tone.',
      expects: {
        kind: 'text',
        placeholder: zh
          ? '例如：30-45 岁北美中产新手父母，注重设计与可持续'
          : 'e.g. 30-45 year old North American parents who value design and sustainability',
      },
    }
  }
  if (!info.referenceBrands || info.referenceBrands.length === 0) {
    return {
      stage: 'gathering_references',
      message: zh
        ? '列出 3 个你欣赏的海外品牌或参考站点（直接打名字即可）。'
        : 'Name 3 overseas brands or sites you admire (just type the names).',
      reasoning: zh
        ? 'Reference brands 是 archetype 匹配的捷径。'
        : 'Reference brands shortcut the archetype match.',
      expects: {
        kind: 'tags',
        suggestions: [
          'Aesop',
          'Grimm’s',
          'Recess',
          'BIOLOGICA',
          'Liquid Death',
          'HAY',
          'Jacquemus',
          'Apple',
        ],
      },
    }
  }
  if (!info.moodKeywords || info.moodKeywords.length === 0) {
    return {
      stage: 'gathering_aesthetic',
      message: zh
        ? '选 3-5 个最贴近你想要的视觉调性的关键词。'
        : 'Pick 3-5 keywords that best match the visual vibe you want.',
      reasoning: zh
        ? '调性关键词决定 Visual DNA 推荐排序。'
        : 'Mood keywords drive Visual DNA ranking.',
      expects: {
        kind: 'tags',
        suggestions: [
          'warm',
          'minimal',
          'cinematic',
          'bold',
          'playful',
          'organic',
          'editorial',
          'futuristic',
        ],
      },
    }
  }
  if (!info.selectedDnaId) {
    return {
      stage: 'choosing_dna',
      message: zh
        ? '基于你提供的信息，我推荐这 3 个 Visual DNA — 选一个最贴你想象的。'
        : 'Based on your input, here are 3 recommended Visual DNAs — pick the one closest to your vision.',
      reasoning: zh
        ? '把推荐落地为具体可视决策。'
        : 'Turn the recommendation into a concrete visual choice.',
      expects: {
        kind: 'choice',
        options: zh
          ? [
              { id: 'nordic_minimal', label: 'Nordic Minimal — 暖白 + 极简 + 自然' },
              { id: 'editorial_fashion', label: 'Editorial Fashion — 胶片感 + 暗红 + 慢' },
              { id: 'kyoto_ceramic', label: 'Kyoto Ceramic — 暖黄 + 静默 + 工艺感' },
            ]
          : [
              { id: 'nordic_minimal', label: 'Nordic Minimal — warm white + clean + natural' },
              {
                id: 'editorial_fashion',
                label: 'Editorial Fashion — film-grain + dark red + slow',
              },
              { id: 'kyoto_ceramic', label: 'Kyoto Ceramic — warm yellow + quiet + craft' },
            ],
      },
    }
  }
  if (!info.format) {
    return {
      stage: 'choosing_format',
      message: zh
        ? '首屏 Hero 你想要视频还是 3D 互动？'
        : 'Do you want a video or 3D interactive hero section?',
      reasoning: zh ? '3D 仅 Pro+ 可解锁；视频默认。' : '3D is Pro+ only; video is the default.',
      expects: {
        kind: 'choice',
        options: zh
          ? [
              { id: 'video', label: '视频（推荐 — Vidu / Kling 6-8s loop）' },
              { id: '3d', label: '3D 互动（Pro+，Meshy + R3F）' },
            ]
          : [
              { id: 'video', label: 'Video (recommended — Vidu / Kling 6-8s loop)' },
              { id: '3d', label: '3D Interactive (Pro+, Meshy + R3F)' },
            ],
      },
    }
  }
  if (!info.selectedMomentId) {
    return {
      stage: 'choosing_hero',
      message: zh
        ? '请选一个 Hero Moment（默认推 M04 Breathing Still — 最稳）。'
        : 'Pick a Hero Moment (M04 Breathing Still is the safest default).',
      reasoning: zh
        ? '让用户对叙事节奏有掌控感。'
        : 'Give the user control over the narrative rhythm.',
      expects: {
        kind: 'choice',
        options: zh
          ? [
              { id: 'M04', label: 'M04 Breathing Still — 静默呼吸（最稳）' },
              { id: 'M01', label: 'M01 Liquid Bath — 液体悬浮' },
              { id: 'M03', label: 'M03 Light Sweep — 光扫过表面' },
              { id: 'M10', label: 'M10 Environmental Embed — 在环境中呼吸' },
            ]
          : [
              { id: 'M04', label: 'M04 Breathing Still — quiet breath (safest)' },
              { id: 'M01', label: 'M01 Liquid Bath — suspended in liquid' },
              { id: 'M03', label: 'M03 Light Sweep — light sweeps across surface' },
              { id: 'M10', label: 'M10 Environmental Embed — breathing in the environment' },
            ],
      },
    }
  }
  return {
    stage: 'review_plan',
    message: zh
      ? '已经收集足够的信息。下面是我准备生成的方案概要 — 一旦确认我会启动整套生成流程（约 4 分钟）。'
      : "I have enough information. Here's the generation plan summary — once confirmed, I'll kick off the full pipeline (~4 minutes).",
    reasoning: zh
      ? '所有必填字段齐了，进入最终确认。'
      : 'All required fields collected — entering final confirmation.',
    expects: { kind: 'confirm' },
  }
}

/** Helper for the worker layer — turn a finished context into the runPipeline input. */
export function toPipelineInput(
  ctx: ConversationContext,
  opts: { siteId: string; subdomain: string; brandName: string },
): {
  brandDescription?: string
  sourceUrl?: string
  inputPath: InputPath
  selectedDnaId: VisualDnaId
  selectedHeroMomentId: string
  storeLocale: 'en' | 'zh-CN' | 'zh-HK' | 'zh-TW'
  storeRegion: 'cn' | 'global'
  siteId: string
  subdomain: string
  brandName: string
} {
  if (!isReadyToGenerate(ctx)) {
    throw new Error('Conversation is not ready — missing required fields.')
  }
  return {
    brandDescription: ctx.collectedInfo.brandDescription,
    sourceUrl: ctx.collectedInfo.sourceUrl,
    inputPath: ctx.collectedInfo.inputPath!,
    selectedDnaId: ctx.collectedInfo.selectedDnaId as VisualDnaId,
    selectedHeroMomentId: ctx.collectedInfo.selectedMomentId!,
    storeLocale: ctx.collectedInfo.storeLocale ?? 'en',
    storeRegion: ctx.collectedInfo.storeRegion ?? 'global',
    siteId: opts.siteId,
    subdomain: opts.subdomain,
    brandName: opts.brandName,
  }
}
