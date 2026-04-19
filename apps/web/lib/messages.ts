/**
 * Lightweight messages loader — re-exports the per-locale JS modules
 * stored in `apps/web/lib/messages/{en,zh-CN}.ts`.
 *
 * Pre-T27f the project used direct `import en from '@/lib/messages/en'`
 * but several W5 components fall back to `getMessages('zh-CN')` shorthand.
 */
import { en } from './messages/en'
import { zhCN } from './messages/zh-CN'

export type Locale = 'en' | 'zh-CN'
export type Messages = typeof en

const REGISTRY: Record<Locale, Messages> = { en, 'zh-CN': zhCN as Messages }

export function getMessages(locale: Locale = 'en'): Messages {
  return REGISTRY[locale] ?? en
}

export { en, zhCN }
