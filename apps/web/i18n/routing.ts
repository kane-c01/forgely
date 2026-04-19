import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '简体中文',
}

export const localeOgMap: Record<Locale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
}

export const localeHtmlLang: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
}
