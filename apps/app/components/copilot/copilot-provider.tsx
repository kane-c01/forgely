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

import type {
  CopilotMessage,
  CopilotPageContext,
  ToolCall,
} from './types'
import { fakeAssistant } from './fake-assistant'

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
      text:
        "Hi — I'm your Forgely Copilot. I can analyze sales, rewrite product copy, regenerate hero videos, change theme blocks, and more. Ask me anything, or hit ⌘J anywhere to summon me.",
      createdAt: new Date().toISOString(),
    },
  ])
  const [pending, setPending] = useState(false)
  const contextRef = useRef(context)
  contextRef.current = context

  const send = useCallback(async (text: string) => {
    if (!text.trim() || pending) return
    const userMsg: CopilotMessage = {
      id: id('m'),
      role: 'user',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setPending(true)

    // Simulate roundtrip latency
    await new Promise((r) => setTimeout(r, 650))
    const reply = fakeAssistant(text.trim(), contextRef.current)
    const assistantMsg: CopilotMessage = {
      id: id('m'),
      role: 'assistant',
      text: reply.text,
      toolCalls: reply.toolCalls?.map((c) => ({ ...c, id: id('tc'), status: 'pending' as const })),
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, assistantMsg])
    setPending(false)
  }, [pending])

  const updateTool = useCallback(
    (messageId: string, toolId: string, patch: Partial<ToolCall>) => {
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
    },
    [],
  )

  const confirmTool = useCallback(
    (messageId: string, toolId: string) => {
      updateTool(messageId, toolId, { status: 'confirmed' })
      // Simulate execution
      setTimeout(() => {
        updateTool(messageId, toolId, {
          status: 'done',
          result: 'Done. I applied the change to your draft.',
        })
      }, 800)
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
    }),
    [open, context, messages, pending, toggle, send, confirmTool, cancelTool, clear],
  )

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
}
