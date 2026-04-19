/**
 * `copilot.*` router stub for the AI Copilot drawer (T23, W6).
 *
 * The actual LLM call lives in `packages/ai-agents` (W1). W3's job is to
 * provide:
 *   - the conversation persistence (AiConversation),
 *   - the credit charge (each turn costs 1-20 credits per docs/MASTER.md
 *     §3.6, charged synchronously),
 *   - the tool execution surface (forwards to internal services),
 *   - and the audit trail.
 *
 * apps/app's UI:
 *   1. `copilot.startConversation({ siteId })` → conversationId
 *   2. `copilot.appendMessage({ conversationId, role: 'user', content })`
 *   3. UI streams reply from the AI agents service (separate endpoint)
 *   4. `copilot.appendMessage({ role: 'assistant', content, toolCalls })`
 *
 * @owner W3 (backend stub for T23, W6)
 */

import type { Prisma } from '@prisma/client'
import { z } from 'zod'

import { recordAudit } from '../auth/audit.js'
import { consumeCreditsSafe } from '../credits/consume.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { IdSchema, PaginationInput } from './_shared.js'

const RoleSchema = z.enum(['user', 'assistant', 'system', 'tool'])

const ToolCallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(64),
  arguments: z.record(z.unknown()),
})

const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string().min(0).max(8000),
  toolCalls: z.array(ToolCallSchema).optional(),
  toolCallId: z.string().min(1).optional(),
  /** UI-side correlation id; passes through unchanged. */
  clientId: z.string().min(1).max(64).optional(),
})

const StartConversationInput = z.object({
  siteId: IdSchema.optional(),
  context: z.record(z.unknown()).optional(),
})

const AppendMessageInput = z.object({
  conversationId: IdSchema,
  message: MessageSchema,
  /** Per-turn credit cost the UI computed; server clamps to [1,20]. */
  creditsCost: z.number().int().min(1).max(20).default(1),
})

interface ConversationRow {
  id: string
  userId: string
  siteId: string | null
  context: Prisma.JsonValue
  messages: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

const messagesArray = (raw: ConversationRow['messages']): Prisma.JsonValue[] =>
  Array.isArray(raw) ? (raw as Prisma.JsonValue[]) : []

export const copilotRouter = router({
  startConversation: protectedProcedure
    .input(StartConversationInput)
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.aiConversation.create({
        data: {
          userId: ctx.user.id,
          siteId: input.siteId ?? null,
          context: (input.context ?? {}) as Prisma.InputJsonValue,
          messages: [] as Prisma.InputJsonValue,
        },
      })
      return { conversationId: conversation.id }
    }),

  list: protectedProcedure.input(PaginationInput.optional()).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 25
    return ctx.prisma.aiConversation.findMany({
      where: { userId: ctx.user.id },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        siteId: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }),

  get: protectedProcedure.input(z.object({ id: IdSchema })).query(async ({ ctx, input }) => {
    const row = await ctx.prisma.aiConversation.findUnique({ where: { id: input.id } })
    if (!row || row.userId !== ctx.user.id) throw errors.notFound('Conversation')
    return row
  }),

  appendMessage: protectedProcedure.input(AppendMessageInput).mutation(async ({ ctx, input }) => {
    const conversation = await ctx.prisma.aiConversation.findUnique({
      where: { id: input.conversationId },
    })
    if (!conversation || conversation.userId !== ctx.user.id) {
      throw errors.notFound('Conversation')
    }

    // Charge per-turn for assistant + tool turns (user/system are free).
    if (input.message.role === 'assistant' || input.message.role === 'tool') {
      await consumeCreditsSafe({
        userId: ctx.user.id,
        amount: input.creditsCost,
        description: `AI Copilot turn — ${input.message.role}`,
        metadata: {
          conversationId: input.conversationId,
          role: input.message.role,
          toolCallCount: input.message.toolCalls?.length ?? 0,
        },
      })
    }

    const next = [...messagesArray(conversation.messages), input.message] as Prisma.InputJsonValue
    const updated = await ctx.prisma.aiConversation.update({
      where: { id: input.conversationId },
      data: { messages: next },
    })

    return {
      conversationId: updated.id,
      messageCount: messagesArray(updated.messages).length,
    }
  }),

  delete: protectedProcedure.input(z.object({ id: IdSchema })).mutation(async ({ ctx, input }) => {
    const row = await ctx.prisma.aiConversation.findUnique({ where: { id: input.id } })
    if (!row || row.userId !== ctx.user.id) throw errors.notFound('Conversation')
    await ctx.prisma.aiConversation.delete({ where: { id: input.id } })
    await recordAudit({
      actorId: ctx.user.id,
      action: 'sites.update', // re-using existing action; copilot.delete will be added later
      targetType: 'conversation',
      targetId: input.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return { ok: true as const }
  }),
})
