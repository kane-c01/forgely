/**
 * Minimal locale system for `apps/web`.
 *
 * Why minimal (not next-intl): the marketing site only needs static
 * per-route translation today. We mirror this same pattern in
 * `apps/app` (W6) and `apps/storefront` so all three apps share a
 * single mental model. When localisation grows beyond this, lift
 * `lib/messages/*.ts` into a `packages/i18n` workspace package and
 * swap `getMessages()` for next-intl / formatjs.
 */

export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

export const LOCALE_HREF: Record<Locale, string> = {
  en: '/',
  'zh-CN': '/zh',
}

/** ISO language tag used in `<html lang>` and `hreflang`. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: 'en',
  'zh-CN': 'zh-CN',
}

export function isLocale(input: string | undefined | null): input is Locale {
  return !!input && (SUPPORTED_LOCALES as readonly string[]).includes(input)
}
