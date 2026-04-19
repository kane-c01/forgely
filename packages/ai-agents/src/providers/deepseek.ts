/**
 * DeepSeek Provider — 国内主力 LLM。
 *
 * 走 OpenAI-compatible REST，复用 fetch（不依赖 OpenAI SDK），
 * 与 `LlmProvider` 接口对齐。
 *
 * Models:
 *   - `deepseek-chat` — 文本推理
 *   - `deepseek-coder` — 代码任务
 *   - `deepseek-vl` — 视觉（多模态）
 *
 * Pricing（2026 价目）:
 *   chat:  $0.14 / 1M input  · $0.28 / 1M output
 *   coder: $0.27 / 1M input  · $1.10 / 1M output
 *   vl:    $0.42 / 1M input  · $1.40 / 1M output
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §4)
 */
import {
  type LlmContentBlock,
  type LlmModel,
  type LlmProvider,
  type LlmResponse,
  type LlmTextRequest,
  type LlmVisionRequest,
  LlmProviderError,
} from './types'

const BASE_URL = 'https://api.deepseek.com/v1'

const PRICING: Record<string, { input: number; output: number }> = {
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.27, output: 1.1 },
  'deepseek-vl': { input: 0.42, output: 1.4 },
}

const MODEL_ALIAS: Partial<Record<LlmModel, string>> = {
  // 把 Forgely 的 model alias 映到 DeepSeek 的真实 ID
  'claude-opus-4': 'deepseek-chat',
  'claude-sonnet-4': 'deepseek-chat',
  'claude-haiku-4': 'deepseek-chat',
  'claude-3-5-sonnet-latest': 'deepseek-chat',
  'claude-3-5-haiku-latest': 'deepseek-chat',
}

export interface DeepSeekProviderOptions {
  apiKey: string
  baseUrl?: string
  timeoutMs?: number
  /** 默认走 chat 模型；视觉自动切换到 deepseek-vl */
  defaultModel?: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-vl'
}

export class DeepSeekProvider implements LlmProvider {
  readonly name = 'anthropic-real' as const // 共用 LlmProvider name 集合
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly defaultModel: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-vl'

  constructor(opts: DeepSeekProviderOptions) {
    if (!opts.apiKey) {
      throw new LlmProviderError('DEEPSEEK_API_KEY missing.', 'NO_API_KEY')
    }
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? BASE_URL
    this.timeoutMs = opts.timeoutMs ?? 60_000
    this.defaultModel = opts.defaultModel ?? 'deepseek-chat'
  }

  async text<T = string>(req: LlmTextRequest): Promise<LlmResponse<T>> {
    const messages = [{ role: 'system', content: req.system }, { role: 'user', content: typeof req.user === 'string' ? req.user : blocksToString(req.user) }]
    return this.run<T>({ ...req, messages, requireVision: false })
  }

  async vision<T = unknown>(req: LlmVisionRequest): Promise<LlmResponse<T>> {
    const userBlocks: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = []
    if (typeof req.user === 'string') {
      userBlocks.push({ type: 'text', text: req.user })
    } else {
      for (const b of req.user) {
        if (b.type === 'text') userBlocks.push({ type: 'text', text: b.text })
        else if (b.type === 'image' && b.source.type === 'url') {
          userBlocks.push({ type: 'image_url', image_url: { url: b.source.url } })
        }
      }
    }
    for (const img of req.images) {
      if ('url' in img) userBlocks.push({ type: 'image_url', image_url: { url: img.url } })
      else userBlocks.push({ type: 'image_url', image_url: { url: `data:${img.mediaType};base64,${img.base64}` } })
    }
    const messages = [
      { role: 'system', content: req.system },
      { role: 'user', content: userBlocks },
    ]
    return this.run<T>({ ...req, messages, requireVision: true })
  }

  private async run<T>(args: {
    model: LlmModel
    system: string
    user: LlmTextRequest['user']
    jsonSchema?: LlmTextRequest['jsonSchema']
    maxTokens?: number
    temperature?: number
    messages: unknown
    requireVision: boolean
  }): Promise<LlmResponse<T>> {
    const targetModel = args.requireVision
      ? 'deepseek-vl'
      : MODEL_ALIAS[args.model] ?? this.defaultModel
    const body = {
      model: targetModel,
      messages: args.messages,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.4,
      ...(args.jsonSchema ? { response_format: { type: 'json_object' } } : {}),
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (err) {
      throw new LlmProviderError(
        (err as Error).name === 'AbortError' ? 'DeepSeek timed out.' : (err as Error).message,
        (err as Error).name === 'AbortError' ? 'TIMEOUT' : 'UPSTREAM',
        err,
      )
    } finally {
      clearTimeout(timeout)
    }

    if (response.status === 429) {
      throw new LlmProviderError('DeepSeek rate-limited.', 'RATE_LIMIT')
    }
    if (!response.ok) {
      const text = await response.text()
      throw new LlmProviderError(`DeepSeek HTTP ${response.status}: ${text.slice(0, 200)}`, 'UPSTREAM')
    }

    const json = (await response.json()) as {
      id: string
      choices: Array<{ message: { content: string } }>
      usage: { prompt_tokens: number; completion_tokens: number }
    }
    const text = json.choices[0]?.message.content ?? ''
    const data = args.jsonSchema ? (safeParseJson(text) as T) : (text as T)

    const pricing = PRICING[targetModel] ?? PRICING['deepseek-chat']!
    const costUsd =
      (json.usage.prompt_tokens / 1_000_000) * pricing.input +
      (json.usage.completion_tokens / 1_000_000) * pricing.output

    return {
      data,
      text,
      inputTokens: json.usage.prompt_tokens,
      outputTokens: json.usage.completion_tokens,
      costUsd,
      traceId: json.id,
    }
  }
}

function blocksToString(user: LlmContentBlock[]): string {
  return user
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
}

function safeParseJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?/, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new LlmProviderError(
      `DeepSeek returned invalid JSON: ${(err as Error).message}\n${cleaned.slice(0, 240)}`,
      'INVALID_RESPONSE',
      err,
    )
  }
}
