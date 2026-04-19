import { useTranslations } from 'next-intl'

/**
 * Social Proof – marquee row.
 * MVP 用占位品牌名（mono 字样），T27 升级时换为客户 logo。
 */
const placeholders = [
  'TOYBLOOM',
  'KYOTO·MUJO',
  'NORTH·LINEN',
  'EMBER & ASH',
  'ATELIER 03',
  'LUMA WELLNESS',
  'ROOT & RYE',
  'PRIMA·NOVA',
  'STILL HOURS',
  'CASA VERDE',
]

export function SocialProof() {
  const t = useTranslations('socialProof')
  const items = [...placeholders, ...placeholders]
  return (
    <section
      aria-label={t('ariaLabel')}
      className="border-b border-border-subtle bg-bg-deep py-10"
    >
      <div className="container-page mb-6">
        <p className="text-center font-mono text-caption uppercase tracking-[0.28em] text-text-muted">
          {t('caption')}
        </p>
      </div>
      <div className="relative overflow-hidden">
        <div
          className="flex w-max animate-marquee gap-16 whitespace-nowrap will-change-transform motion-reduce:animate-none"
          aria-hidden="true"
        >
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="font-display text-2xl tracking-[0.18em] text-text-muted/80 sm:text-3xl"
            >
              {name}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-deep to-transparent" />
      </div>
    </section>
  )
}
