'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { trpc } from '@/lib/trpc'

import type { TranslationKeys } from './locales/zh-CN'
import zhCN from './locales/zh-CN'
import en from './locales/en'

export type AppLocale = 'zh-CN' | 'en'

const LOCALE_STORAGE_KEY = 'forgely:locale'

const translations: Record<AppLocale, TranslationKeys> = {
  'zh-CN': zhCN,
  en,
}

/**
 * Normalise the DB locale values (zh-CN / zh-HK / zh-TW / en) into the
 * two UI locales the dashboard supports. All Chinese variants collapse
 * to zh-CN for now.
 */
export function normalizeLocale(raw?: string | null): AppLocale {
  if (raw === 'en') return 'en'
  return 'zh-CN'
}

interface LocaleContextValue {
  locale: AppLocale
  t: TranslationKeys
  setLocale: (locale: AppLocale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}

export function useT(): TranslationKeys {
  return useLocale().t
}

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'zh-CN'
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'en' || stored === 'zh-CN') return stored
  } catch {
    /* blocked */
  }
  return 'zh-CN'
}

interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(readStoredLocale)

  const profile = trpc.settings.profile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (profile.data) {
      const dbLocale = normalizeLocale((profile.data as Record<string, unknown>).locale as string)
      setLocaleState(dbLocale)
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, dbLocale)
      } catch {
        /* blocked */
      }
    }
  }, [profile.data])

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* blocked */
    }
  }, [])

  const t = translations[locale]

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
