'use client'

import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { waitlistSchema, type WaitlistInput } from '@/lib/waitlist'
import { getMessages } from '@/lib/messages'
import { cn } from '@/lib/cn'

interface ZhWaitlistFormProps {
  defaultPlan?: WaitlistInput['plan']
  className?: string
}

export function ZhWaitlistForm({ defaultPlan = 'free', className }: ZhWaitlistFormProps) {
  const t = getMessages('zh-CN').hero
  const formId = useId()
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { plan: defaultPlan, email: '', storeUrl: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, locale: 'zh-CN' }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string; created?: boolean }
      if (!res.ok || !data.ok) {
        const message = data.error ?? '加入候补名单失败，请重试。'
        setError('email', { message })
        toast.error(message)
        return
      }
      setSubmitted(true)
      reset({ email: '', storeUrl: '', plan: defaultPlan })
      toast.success(
        data.created
          ? '已加入候补名单。我们将在锻炉开放时第一时间通知你。'
          : '你已经在候补名单中。我们会尽快与你联系。',
      )
    } catch {
      const message = '网络异常，请稍后重试。'
      setError('email', { message })
      toast.error(message)
    }
  })

  if (submitted) {
    return (
      <div
        className={cn(
          'border-border-strong bg-bg-elevated/70 flex flex-col items-start gap-3 rounded-xl border p-6 text-left',
          className,
        )}
      >
        <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
          {t.submittedEyebrow}
        </span>
        <h3 className="font-display text-h2 font-light">{t.submittedTitle}</h3>
        <p className="text-body text-text-secondary">{t.submittedBody}</p>
      </div>
    )
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate
      className={cn('flex w-full max-w-2xl flex-col gap-3', className)}
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${formId}-store`} className="sr-only">
          店铺链接（可选）
        </label>
        <input
          id={`${formId}-store`}
          inputMode="url"
          placeholder={t.storePlaceholder}
          className={cn(
            'border-border-strong bg-bg-deep/80 text-body text-text-primary h-14 flex-1 rounded-md border px-5',
            'placeholder:text-text-muted backdrop-blur-sm',
            'focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 focus-visible:outline-none focus-visible:ring-2',
          )}
          {...register('storeUrl')}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${formId}-email`} className="sr-only">
          邮箱
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          required
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          className={cn(
            'border-border-strong bg-bg-deep/80 text-body text-text-primary h-14 flex-1 rounded-md border px-5',
            'placeholder:text-text-muted backdrop-blur-sm',
            'focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 focus-visible:outline-none focus-visible:ring-2',
            errors.email ? 'border-semantic-error focus-visible:ring-semantic-error/40' : '',
          )}
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
        <Button
          type="submit"
          size="lg"
          variant="forge"
          disabled={isSubmitting}
          leadingIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          trailingIcon={
            isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )
          }
        >
          {isSubmitting ? t.submitting : t.submit}
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
        {t.helper}
      </p>
    </form>
  )
}
