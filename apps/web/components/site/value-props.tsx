import { Aperture, Cpu, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/ui/section-heading'

interface ValueProp {
  key: 'cinematic' | 'store' | 'copilot'
  icon: React.ReactNode
}

const values: ValueProp[] = [
  { key: 'cinematic', icon: <Aperture className="h-5 w-5" /> },
  { key: 'store', icon: <Cpu className="h-5 w-5" /> },
  { key: 'copilot', icon: <Sparkles className="h-5 w-5" /> },
]

export function ValueProps() {
  const t = useTranslations('valueProps')
  return (
    <section
      id="how-it-works"
      aria-labelledby="value-props-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-16">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={
            <span id="value-props-title">
              {t('titleLeading')}{' '}
              <em className="font-display italic text-forge-orange">
                {t('titleEmphasis')}
              </em>{' '}
              {t('titleTrailing')}
            </span>
          }
          description={t('description')}
        />

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border-strong bg-border-subtle md:grid-cols-3">
          {values.map((v) => (
            <article
              key={v.key}
              className="relative flex flex-col gap-6 bg-bg-deep p-8 lg:p-10"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-md border border-forge-orange/40 bg-forge-orange/10 text-forge-orange"
              >
                {v.icon}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-h2 font-light text-text-primary">
                  {t(`items.${v.key}.title`)}
                </h3>
                <p className="text-body text-text-secondary">
                  {t(`items.${v.key}.body`)}
                </p>
              </div>
              <div className="mt-auto pt-6 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
                {t(`items.${v.key}.meta`)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
