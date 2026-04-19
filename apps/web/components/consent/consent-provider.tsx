'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  DEFAULT_CONSENT,
  readConsent,
  writeConsent,
  type ConsentChoice,
  type ConsentRecord,
} from '@/lib/analytics'

interface ConsentContextValue {
  consent: ConsentRecord
  /** When `true`, the consent prompt is being shown. */
  prompting: boolean
  accept: () => void
  decline: () => void
  /** Force the prompt to appear again (e.g. footer link "Cookie settings"). */
  reopen: () => void
  /** Hide the prompt without recording a choice. */
  dismiss: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord>(DEFAULT_CONSENT)
  const [prompting, setPrompting] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const initial = readConsent()
    setConsent(initial)
    setPrompting(initial.choice === 'pending')
    setHydrated(true)

    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<ConsentRecord>).detail
      if (detail) setConsent(detail)
    }
    window.addEventListener('forgely:consent', onUpdate)
    return () => window.removeEventListener('forgely:consent', onUpdate)
  }, [])

  const decide = useCallback((choice: Exclude<ConsentChoice, 'pending'>) => {
    const record = writeConsent(choice)
    setConsent(record)
    setPrompting(false)
  }, [])

  const value: ConsentContextValue = {
    consent,
    prompting: hydrated ? prompting : false,
    accept: () => decide('accepted'),
    decline: () => decide('denied'),
    reopen: () => setPrompting(true),
    dismiss: () => setPrompting(false),
  }

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    throw new Error('useConsent must be used inside <ConsentProvider>')
  }
  return ctx
}
