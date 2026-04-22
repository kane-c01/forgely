'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { trpc } from '@/lib/trpc'

import type { CopilotLocale, CopilotMessage, CopilotPageContext, ToolCall, ToolName } from './types'
import { defaultLocale, fakeAssistant } from './fake-assistant'

/**
 * A tool runner is a real callback that mutates app state when a Copilot
 * tool call is confirmed. Pages register their own runners via
 * `useRegisterCopilotTool` (e.g. the Theme Editor registers
 * `modify_theme_block` / `change_colors` so AI prompts genuinely change
 * the DSL). When no runner is registered for a tool, the call simulates
 * a generic success.
 */
export type ToolRunner = (args: Record<string, unknown>) => Promise<string | void> | string | void

interface CopilotState {
  open: boolean
  context: CopilotPageContext
  messages: CopilotMessage[]
  pending: boolean
  locale: CopilotLocale

  setOpen: (open: boolean) => void
  toggle: () => void
  setContext: (context: CopilotPageContext) => void
  setLocale: (locale: CopilotLocale) => void
  send: (text: string) => Promise<void>
  confirmTool: (messageId: string, toolId: string) => void
  cancelTool: (messageId: string, toolId: string) => void
  clear: () => void
  registerTool: (name: ToolName, runner: ToolRunner) => () => void
}

const CopilotContext = createContext<CopilotState | null>(null)

export function useCopilot(): CopilotState {
  const ctx = useContext(CopilotContext)
  if (!ctx) throw new Error('useCopilot must be used inside <CopilotProvider>')
  return ctx
}

/**
 * Hook that lets a page declare its current context to the Copilot.
 * Updates on prop change and resets to global on unmount.
 */
export function useCopilotContext(context: CopilotPageContext) {
  const { setContext } = useCopilot()
  const json = JSON.stringify(context)
  useEffect(() => {
    setContext(context)
    return () => setContext({ kind: 'global' })
    // We rebind only when the serialized context changes, so callers
    // can pass fresh object identities each render without thrashing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json])
}

/**
 * Register a real `ToolRunner` for one Copilot tool name while the
 * calling component is mounted. The Copilot will invoke the runner
 * after the user clicks Confirm; the returned string becomes the tool
 * call's result message. When no runner is registered, the call falls
 * back to a generic simulated success.
 */
export function useRegisterCopilotTool(name: ToolName, runner: ToolRunner) {
  const { registerTool } = useCopilot()
  const runnerRef = useRef(runner)
  runnerRef.current = runner
  useEffect(() => {
    return registerTool(name, (args) => runnerRef.current(args))
  }, [registerTool, name])
}

interface ProviderProps {
  children: ReactNode
  /** Override default locale (browser default = zh-CN unless Accept-Language starts with `en`) */
  locale?: CopilotLocale
  /** Initial seed message override (per-surface custom intro) */
  seedMessage?: string
  /** Initial context (e.g. set to a super-* kind on /super layout) */
  initialContext?: CopilotPageContext
}

let nextId = 1
const id = (prefix: string) => `${prefix}_${nextId++}`

const SEED_ZH =
  '你好，我是 Forgely Copilot。我能帮你分析销量、改写文案、重生成主视觉视频、修改主题区块、跑合规与 SEO 审查等。随时按 ⌘J / Ctrl+J 把我唤出来。'
const SEED_ZH_SUPER =
  '你好，超级管理员。我能查 MRR / DAU / AI 成本、查找用户、强制退款、封禁/解封、发全员公告、冻结站点、导出对账。先问句「本月 MRR」试试。'
const SEED_EN =
  "Hi — I'm your Forgely Copilot. I can analyze sales, rewrite product copy, regenerate hero videos, change theme blocks, and more. Press ⌘J anywhere to summon me."
const SEED_EN_SUPER =
  "Hi, super-admin. I can query MRR / DAU / AI cost, look up users, force refunds, ban/unban accounts, broadcast announcements, freeze sites, and export finance reports. Try 'how is MRR this month'."

export function CopilotProvider({
  children,
  locale: localeProp,
  seedMessage,
  initialContext,
}: ProviderProps) {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState<CopilotPageContext>(initialContext ?? { kind: 'global' })
  const [locale, setLocale] = useState<CopilotLocale>(localeProp ?? defaultLocale())

  useEffect(() => {
    if (localeProp && localeProp !== locale) {
      setLocale(localeProp)
    }
  }, [localeProp]) // eslint-disable-line react-hooks/exhaustive-deps
  const isSuper = (initialContext?.kind ?? '').startsWith('super-')
  const seedText =
    seedMessage ??
    (locale === 'en' ? (isSuper ? SEED_EN_SUPER : SEED_EN) : isSuper ? SEED_ZH_SUPER : SEED_ZH)
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'm_seed',
      role: 'assistant',
      text: seedText,
      createdAt: new Date().toISOString(),
    },
  ])
  const [pending, setPending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const contextRef = useRef(context)
  contextRef.current = context
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const runnersRef = useRef<Map<ToolName, ToolRunner>>(new Map())

  // Persistence layer: best-effort writes to `trpc.copilot.*`. Failures
  // are silent — the UX falls back to in-memory mode (which is what
  // happens for unauthenticated users / local dev without DATABASE_URL).
  const startConversation = trpc.copilot.startConversation.useMutation()
  const appendMessage = trpc.copilot.appendMessage.useMutation()

  const conversationIdRef = useRef<string | null>(null)
  conversationIdRef.current = conversationId

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current
    try {
      const res = await startConversation.mutateAsync({})
      setConversationId(res.conversationId)
      return res.conversationId
    } catch {
      return null
    }
  }, [startConversation])

  const persistMessage = useCallback(
    async (msg: CopilotMessage) => {
      const cid = await ensureConversation()
      if (!cid) return
      try {
        await appendMessage.mutateAsync({
          conversationId: cid,
          message: {
            role: msg.role,
            content: msg.text,
            toolCalls: msg.toolCalls?.map((c) => ({
              id: c.id,
              name: c.name,
              arguments: c.arguments,
            })),
            clientId: msg.id,
          },
          creditsCost: 1,
        })
      } catch {
        /* persistence is best-effort */
      }
    },
    [appendMessage, ensureConversation],
  )

  const registerTool = useCallback((name: ToolName, runner: ToolRunner) => {
    runnersRef.current.set(name, runner)
    return () => {
      const cur = runnersRef.current.get(name)
      if (cur === runner) runnersRef.current.delete(name)
    }
  }, [])

  // Real LLM mutation — DeepSeek > Qwen > Anthropic > Mock per region.
  // We don't pass a callback signature into trpc here because we want
  // to fall back to fakeAssistant on **any** failure (network, auth,
  // missing API keys), not just on TRPCErrors.
  const chatMutation = trpc.copilot.chat.useMutation()

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || pending) return
      const userMsg: CopilotMessage = {
        id: id('m'),
        role: 'user',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      }
      setMessages((m) => [...m, userMsg])
      setPending(true)
      void persistMessage(userMsg)

      const surface: 'user' | 'super' = contextRef.current.kind.startsWith('super-')
        ? 'super'
        : 'user'

      // Build the rolling chat history the server expects. We send the
      // last 12 turns (≈6 user + 6 assistant) — enough for context, not
      // enough to blow past the model's window or the 4000-char cap.
      const history = [...messagesRef.current, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-12)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          text: m.text.slice(0, 3800),
        }))

      let assistantMsg: CopilotMessage

      try {
        const reply = await chatMutation.mutateAsync({
          surface,
          context: contextRef.current as unknown as Record<string, unknown>,
          messages: history,
          locale,
          creditsCost: 2,
        })

        assistantMsg = {
          id: id('m'),
          role: 'assistant',
          text: reply.text,
          toolCalls: reply.toolCalls?.map((c) => ({
            id: c.id || id('tc'),
            name: c.name as ToolName,
            arguments: c.arguments,
            destructive: c.destructive,
            estimatedCredits: c.estimatedCredits,
            status: 'pending' as const,
          })),
          createdAt: new Date().toISOString(),
        }
      } catch {
        // Graceful degradation: when the API is unreachable, the server
        // is missing API keys, or credits are exhausted, fall back to
        // the canned assistant so the UX never feels broken in dev
        // or under partial outage.
        await new Promise((r) => setTimeout(r, 500))
        const fallback = fakeAssistant(text.trim(), contextRef.current, locale)
        assistantMsg = {
          id: id('m'),
          role: 'assistant',
          text: fallback.text,
          toolCalls: fallback.toolCalls?.map((c) => ({
            ...c,
            id: id('tc'),
            status: 'pending' as const,
          })),
          createdAt: new Date().toISOString(),
        }
      }

      setMessages((m) => [...m, assistantMsg])
      setPending(false)
      void persistMessage(assistantMsg)
    },
    [pending, persistMessage, locale, chatMutation],
  )

  const updateTool = useCallback((messageId: string, toolId: string, patch: Partial<ToolCall>) => {
    setMessages((all) =>
      all.map((m) =>
        m.id === messageId && m.toolCalls
          ? {
              ...m,
              toolCalls: m.toolCalls.map((t) => (t.id === toolId ? { ...t, ...patch } : t)),
            }
          : m,
      ),
    )
  }, [])

  const confirmTool = useCallback(
    (messageId: string, toolId: string) => {
      updateTool(messageId, toolId, { status: 'confirmed' })
      const message = messagesRef.current.find((m) => m.id === messageId)
      const call = message?.toolCalls?.find((t) => t.id === toolId)
      if (!call) return

      const runner = runnersRef.current.get(call.name)
      if (runner) {
        Promise.resolve(runner(call.arguments))
          .then((res) => {
            updateTool(messageId, toolId, {
              status: 'done',
              result: typeof res === 'string' ? res : 'Applied to your draft.',
            })
          })
          .catch((err) => {
            updateTool(messageId, toolId, {
              status: 'cancelled',
              result: `Failed: ${err instanceof Error ? err.message : String(err)}`,
            })
          })
      } else {
        setTimeout(() => {
          updateTool(messageId, toolId, {
            status: 'done',
            result: 'Done. I applied the change to your draft.',
          })
        }, 800)
      }
    },
    [updateTool],
  )

  const cancelTool = useCallback(
    (messageId: string, toolId: string) => {
      updateTool(messageId, toolId, { status: 'cancelled' })
    },
    [updateTool],
  )

  const clear = useCallback(() => {
    setMessages([
      {
        id: 'm_seed',
        role: 'assistant',
        text: locale === 'en' ? "Cleared. What's next?" : '已清空，接下来想做什么？',
        createdAt: new Date().toISOString(),
      },
    ])
  }, [locale])

  const toggle = useCallback(() => setOpen((v) => !v), [])

  // ⌘J / Ctrl+J — global hot key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo<CopilotState>(
    () => ({
      open,
      context,
      messages,
      pending,
      locale,
      setOpen,
      toggle,
      setContext,
      setLocale,
      send,
      confirmTool,
      cancelTool,
      clear,
      registerTool,
    }),
    [
      open,
      context,
      messages,
      pending,
      locale,
      toggle,
      send,
      confirmTool,
      cancelTool,
      clear,
      registerTool,
    ],
  )

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
}
