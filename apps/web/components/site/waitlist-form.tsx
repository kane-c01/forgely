'use client'

import { useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  createWaitlistSchema,
  type WaitlistInput,
} from '@/lib/waitlist'
import { cn } from '@/lib/cn'

interface WaitlistFormProps {
  variant?: 'hero' | 'inline'
  defaultPlan?: WaitlistInput['plan']
  className?: string
}

export function WaitlistForm({
  variant = 'hero',
  defaultPlan = 'free',
  className,
}: WaitlistFormProps) {
  const t = useTranslations('waitlist')
  const tErrors = useTranslations('waitlist.errors')
  const tToasts = useTranslations('waitlist.toasts')

  const formId = useId()
  const [submitted, setSubmitted] = useState(false)

  const schema = useMemo(
    () =>
      createWaitlistSchema({
        emailRequired: tErrors('emailRequired'),
        emailInvalid: tErrors('emailInvalid'),
        storeUrlInvalid: tErrors('storeUrlInvalid'),
      }),
    [tErrors],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<WaitlistInput>({
    resolver: zodResolver(schema),
    defaultValues: { plan: defaultPlan, email: '', storeUrl: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = (await res.json()) as {
        ok: boolean
        error?: string
        created?: boolean
      }
      if (!res.ok || !data.ok) {
        const message = tErrors('generic')
        setError('email', { message })
        toast.error(message)
        return
      }
      setSubmitted(true)
      reset({ email: '', storeUrl: '', plan: defaultPlan })
      toast.success(data.created ? tToasts('created') : tToasts('existing'))
    } catch {
      const message = tErrors('network')
      setError('email', { message })
      toast.error(message)
    }
  })

  const isHero = variant === 'hero'

  if (submitted && isHero) {
    return (
      <div
        className={cn(
          'flex flex-col items-start gap-3 rounded-xl border border-border-strong bg-bg-elevated/70 p-6 text-left',
          className,
        )}
      >
        <span className="font-mono text-caption uppercase tracking-[0.22em] text-forge-orange">
          {t('welcome')}
        </span>
        <h3 className="font-display text-h2 font-light">{t('onTheList')}</h3>
        <p className="text-body text-text-secondary">{t('onTheListBody')}</p>
      </div>
    )
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate
      className={cn(
        isHero
          ? 'flex w-full max-w-2xl flex-col gap-3'
          : 'flex w-full flex-col gap-3 sm:flex-row',
        className,
      )}
      aria-describedby={`${formId}-help`}
    >
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0"
        {...register('website')}
      />
      <input type="hidden" {...register('plan')} />

      {isHero ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor={`${formId}-store`} className="sr-only">
            {t('storeUrlLabel')}
          </label>
          <input
            id={`${formId}-store`}
            inputMode="url"
            placeholder={t('storeUrlPlaceholder')}
            className={cn(
              'h-14 flex-1 rounded-md border border-border-strong bg-bg-deep/80 px-5 text-body text-text-primary',
              'placeholder:text-text-muted backdrop-blur-sm',
              'focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40',
            )}
            {...register('storeUrl')}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-col gap-3',
          isHero ? 'sm:flex-row' : 'sm:flex-row sm:items-center',
        )}
      >
        <label htmlFor={`${formId}-email`} className="sr-only">
          {t('emailLabel')}
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          required
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          className={cn(
            'h-14 flex-1 rounded-md border border-border-strong bg-bg-deep/80 px-5 text-body text-text-primary',
            'placeholder:text-text-muted backdrop-blur-sm',
            'focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40',
            errors.email
              ? 'border-semantic-error focus-visible:ring-semantic-error/40'
              : '',
          )}
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
        <Button
          type="submit"
          size="lg"
          variant="forge"
          disabled={isSubmitting}
          trailingIcon={
            isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )
          }
          leadingIcon={
            isHero ? (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            ) : null
          }
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </div>

      {errors.email ? (
        <p className="text-small text-semantic-error" role="alert">
          {errors.email.message}
        </p>
      ) : null}
      {errors.storeUrl ? (
        <p className="text-small text-semantic-error" role="alert">
          {errors.storeUrl.message}
        </p>
      ) : null}

      <p id={`${formId}-help`} className="text-small text-text-muted">
        {t('help')}
      </p>
    </form>
  )
}
