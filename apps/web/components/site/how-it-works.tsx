import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/ui/section-heading'

const stepIndices = ['01', '02', '03', '04', '05'] as const

export function HowItWorks() {
  const t = useTranslations('howItWorks')
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-14">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={<span id="how-title">{t('title')}</span>}
          description={t('description')}
        />

        <ol className="grid gap-px overflow-hidden rounded-2xl border border-border-strong bg-border-subtle md:grid-cols-2 lg:grid-cols-5">
          {stepIndices.map((index) => (
            <li
              key={index}
              className="flex flex-col gap-4 bg-bg-deep p-6 lg:p-7"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-caption uppercase tracking-[0.22em] text-forge-orange">
                  {t('stepLabel')} {index}
                </span>
                <span className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
                  {t(`steps.${index}.duration`)}
                </span>
              </div>
              <h3 className="font-display text-h3 font-light text-text-primary">
                {t(`steps.${index}.title`)}
              </h3>
              <p className="text-small text-text-secondary">
                {t(`steps.${index}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
