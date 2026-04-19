/**
 * tRPC router — multi-turn conversation orchestration for site generation.
 *
 * Flow:
 *   1. `start({ siteId? })` — creates a fresh conversation; if siteId omitted
 *      we mint a new draft Site row and return its id.
 *   2. `nextTurn({ conversationId })` — produces the next assistant turn.
 *   3. `submitAnswer({ conversationId, answer })` — ingests user's structured
 *      reply and returns the updated context (and the next turn auto-fired).
 *   4. `commit({ conversationId })` — when isReadyToGenerate, dispatches a
 *      BullMQ generation job (services/worker.runPipeline) and flips the
 *      site status to `generating`.
 *
 * Stream alternative (`subscribeStream`) — exposes assistant token-by-token
 * stream via SSE for the typewriter UX.
 *
 * @owner W1 — docs/MASTER.md §12 + conversational pivot follow-up
 */
import { z } from 'zod'

import {
  type AssistantTurn,
  type ConversationContext,
  type UserAnswer,
  ingestUser,
  isReadyToGenerate,
  nextAssistantTurn,
  startConversation,
  toPipelineInput,
} from '@forgely/ai-agents'
import { resolveProvider } from '@forgely/ai-agents'

import { prisma } from '../db.js'
import { ForgelyError, errors } from '../errors.js'
import { router, publicProcedure } from './trpc.js'

const AnswerSchema = z.union([
  z.object({ kind: z.literal('choice'), choice: z.string() }),
  z.object({ kind: z.literal('url'), url: z.string().url() }),
  z.object({ kind: z.literal('text'), text: z.string().min(1).max(2000) }),
  z.object({ kind: z.literal('tags'), tags: z.array(z.string().min(1).max(40)).min(1).max(10) }),
  z.object({ kind: z.literal('product'), productId: z.string() }),
  z.object({ kind: z.literal('confirm'), confirmed: z.boolean() }),
])

/** Persist conversation state in `AiConversation` table. */
async function loadCtx(conversationId: string): Promise<{ ctx: ConversationContext; userId: string; siteId: string | null }> {
  const row = await prisma.aiConversation.findUnique({ where: { id: conversationId } })
  if (!row) throw errors.notFound('conversation')
  return {
    ctx: row.context as unknown as ConversationContext,
    userId: row.userId,
    siteId: row.siteId,
  }
}

async function saveCtx(conversationId: string, ctx: ConversationContext): Promise<void> {
  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: { context: ctx as unknown as object, messages: ctx.messages as unknown as object },
  })
}

export const conversationRouter = router({
  /** Start a new generation conversation. */
  start: publicProcedure
    .input(z.object({ siteId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw errors.unauthorized()
      const userId = ctx.user.id
      const conv = await prisma.aiConversation.create({
        data: {
          userId,
          siteId: input.siteId ?? null,
          context: startConversation() as unknown as object,
          messages: [] as unknown as object,
        },
      })
      // 自动生成首轮（"choose path"）
      const turn = await nextAssistantTurn(startConversation(), {
        provider: resolveProvider(),
        scripted: !process.env.DEEPSEEK_API_KEY && !process.env.DASHSCOPE_API_KEY && !process.env.ANTHROPIC_API_KEY,
      })
      const updated: ConversationContext = {
        ...startConversation(),
        stage: turn.stage,
        messages: [
          {
            role: 'assistant',
            content: turn.message,
            reasoning: turn.reasoning,
            createdAt: new Date().toISOString(),
          },
        ],
      }
      await saveCtx(conv.id, updated)
      return { conversationId: conv.id, turn, context: updated }
    }),

  /** Replay the next assistant question (for resuming a paused conversation). */
  nextTurn: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      const { ctx } = await loadCtx(input.conversationId)
      const turn = await nextAssistantTurn(ctx, {
        provider: resolveProvider(),
        scripted: !process.env.DEEPSEEK_API_KEY && !process.env.DASHSCOPE_API_KEY && !process.env.ANTHROPIC_API_KEY,
      })
      return turn
    }),

  /** Submit a user reply and get the next assistant turn back. */
  submitAnswer: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        answer: AnswerSchema,
        rawText: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }): Promise<{ context: ConversationContext; nextTurn: AssistantTurn }> => {
      const { ctx } = await loadCtx(input.conversationId)
      // We need the *previous* assistant turn to know what stage to apply to.
      const lastAssistant = [...ctx.messages].reverse().find((m) => m.role === 'assistant')
      if (!lastAssistant) throw new ForgelyError('VALIDATION_ERROR', '会话还没开始。', 400, { field: 'lastAssistant' })
      const inferredTurn: AssistantTurn = {
        stage: ctx.stage,
        message: lastAssistant.content,
        reasoning: lastAssistant.reasoning ?? '',
        expects: { kind: 'text' },
      }
      const updated = ingestUser(ctx, inferredTurn, input.answer as UserAnswer, input.rawText)
      const nextTurn = await nextAssistantTurn(updated, {
        provider: resolveProvider(),
        scripted: !process.env.DEEPSEEK_API_KEY && !process.env.DASHSCOPE_API_KEY && !process.env.ANTHROPIC_API_KEY,
      })
      const updatedWithAssistant: ConversationContext = {
        ...updated,
        stage: nextTurn.stage,
        messages: [
          ...updated.messages,
          {
            role: 'assistant',
            content: nextTurn.message,
            reasoning: nextTurn.reasoning,
            createdAt: new Date().toISOString(),
          },
        ],
      }
      await saveCtx(input.conversationId, updatedWithAssistant)
      return { context: updatedWithAssistant, nextTurn }
    }),

  /** Commit the conversation — kicks the runPipeline job. */
  commit: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        siteId: z.string(),
        subdomain: z
          .string()
          .min(3)
          .max(40)
          .regex(/^[a-z][a-z0-9-]{2,39}$/, 'subdomain must be lowercase alphanum + dashes'),
        brandName: z.string().min(1).max(80),
      }),
    )
    .mutation(async ({ input }) => {
      const { ctx } = await loadCtx(input.conversationId)
      if (!isReadyToGenerate(ctx)) {
        throw new ForgelyError('VALIDATION_ERROR', '请先完成所有步骤再生成。', 400, { field: 'conversation' })
      }
      const pipelineInput = toPipelineInput(ctx, {
        siteId: input.siteId,
        subdomain: input.subdomain,
        brandName: input.brandName,
      })
      // Flip the site to generating + persist the input — the BullMQ worker
      // (services/worker) reads `Generation.inputData` and calls runPipeline.
      const generation = await prisma.generation.create({
        data: {
          siteId: input.siteId,
          userId: ctx.collectedInfo.heroProductId ?? input.siteId,
          status: 'pending',
          steps: [],
          inputData: pipelineInput as unknown as object,
          creditsCost: 1200, // see docs/MASTER.md §3.6 — full first-page (video)
        },
      })
      await prisma.site.update({
        where: { id: input.siteId },
        data: { status: 'generating' },
      })
      return { generationId: generation.id, pipelineInput }
    }),

  /** Read the full conversation transcript (for replay / sharing). */
  get: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      const { ctx, userId, siteId } = await loadCtx(input.conversationId)
      return { context: ctx, userId, siteId }
    }),
})

export type ConversationRouter = typeof conversationRouter
