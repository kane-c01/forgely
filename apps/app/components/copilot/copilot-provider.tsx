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

import type { CopilotMessage, CopilotPageContext, ToolCall, ToolName } from './types'
import { fakeAssistant } from './fake-assistant'

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

  setOpen: (open: boolean) => void
  toggle: () => void
  setContext: (context: CopilotPageContext) => void
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
}

let nextId = 1
const id = (prefix: string) => `${prefix}_${nextId++}`

export function CopilotProvider({ children }: ProviderProps) {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState<CopilotPageContext>({ kind: 'global' })
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'm_seed',
      role: 'assistant',
      text: "Hi — I'm your Forgely Copilot. I can analyze sales, rewrite product copy, regenerate hero videos, change theme blocks, and more. Ask me anything, or hit ⌘J anywhere to summon me.",
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
      // Best-effort persist the user's turn.
      void persistMessage(userMsg)

      // TODO(W3): swap this for `await trpc.copilot.chat.mutateAsync({...})`
      // once the chat endpoint lands. The fakeAssistant return shape
      // already mirrors the planned `{ text, toolCalls }` payload.
      await new Promise((r) => setTimeout(r, 650))
      const reply = fakeAssistant(text.trim(), contextRef.current)
      const assistantMsg: CopilotMessage = {
        id: id('m'),
        role: 'assistant',
        text: reply.text,
        toolCalls: reply.toolCalls?.map((c) => ({
          ...c,
          id: id('tc'),
          status: 'pending' as const,
        })),
        createdAt: new Date().toISOString(),
      }
      setMessages((m) => [...m, assistantMsg])
      setPending(false)
      // Best-effort persist the assistant turn (charges 1 credit
      // server-side; clamps to [1,20] there). No-op if persistence
      // failed earlier.
      void persistMessage(assistantMsg)
    },
    [pending, persistMessage],
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
        text: "Cleared. What's next?",
        createdAt: new Date().toISOString(),
      },
    ])
  }, [])

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
      setOpen,
      toggle,
      setContext,
      send,
      confirmTool,
      cancelTool,
      clear,
      registerTool,
    }),
    [open, context, messages, pending, toggle, send, confirmTool, cancelTool, clear, registerTool],
  )

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
}
