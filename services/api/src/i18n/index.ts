/**
 * Public surface of `@forgely/api/i18n`.
 *
 * @owner W3 (Sprint 3 — S3-7)
 */

export {
  ERROR_MESSAGES,
  FALLBACK_LOCALIZATION,
  localizeError,
  localizeAllLocales,
} from './error-messages.js'
export type { LocalizedMessage, SupportedLocale } from './error-messages.js'
