import type { Locale } from '@/lib/i18n'
import { en } from './en'
import { zhCN } from './zh-CN'

/**
 * Widen the literal `as const` shape of `en` into the per-locale
 * messages contract so other locales can substitute their own
 * strings without TypeScript demanding exact literal matches.
 *
 * - `string`-typed literal → `string`
 * - `readonly` arrays → `readonly` arrays of widened items
 * - nested objects are mapped recursively
 */
type Widen<T> = T extends string
  ? string
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<Widen<U>>
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T

export type Messages = Widen<typeof en>

const REGISTRY: Record<Locale, Messages> = {
  en: en as unknown as Messages,
  'zh-CN': zhCN,
}

export function getMessages(locale: Locale): Messages {
  return REGISTRY[locale]
}

export type { Messages as DefaultMessages }
