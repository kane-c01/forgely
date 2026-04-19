import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'

export interface FaqItem {
  question: string
  answer: string
}

/** Stable list of FAQ keys mirrored in messages/{locale}.json -> faq.items.* */
export const faqKeys = [
  'what',
  'skills',
  'import',
  'credits',
  'unique',
  'export',
] as const

export type FaqKey = (typeof faqKeys)[number]

export async function getFaqItems(locale: Locale): Promise<FaqItem[]> {
  const t = await getTranslations({ locale, namespace: 'faq.items' })
  return faqKeys.map((key) => ({
    question: t(`${key}.question`),
    answer: t(`${key}.answer`),
  }))
}
