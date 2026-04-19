import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'zh'],
  // CN pivot: B 端用户来自中国 → / 默认显示中文站。
  // 海外访客通过 nav locale-switcher 切到 /en，或浏览器 Accept-Language 探测。
  defaultLocale: 'zh',
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
