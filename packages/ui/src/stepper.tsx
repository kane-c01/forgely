'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

import { cn } from './utils'

export interface StepperStep {
  id: string
  title: string
  description?: string
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: StepperStep[]
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Stepper — multi-step progress indicator used in onboarding, the AI
 * generation pipeline (施法动画) and Theme Editor wizards.
 *
 * `currentStep` is 0-based: indices `< currentStep` are complete,
 * `=== currentStep` is active, `>` are upcoming.
 */
export function Stepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
  ...props
}: StepperProps) {
  return (
    <ol
      role="list"
      className={cn(
        'flex w-full',
        orientation === 'horizontal'
          ? 'flex-row items-start gap-4 overflow-x-auto'
          : 'flex-col gap-4',
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const status =
          index < currentStep ? 'complete' : index === currentStep ? 'active' : 'upcoming'
        const isLast = index === steps.length - 1
        return (
          <li
            key={step.id}
            className={cn(
              'flex flex-1 items-start gap-3',
              orientation === 'horizontal' && !isLast && 'min-w-0',
            )}
          >
            <div className="flex flex-col items-center">
              <span
                aria-current={status === 'active' ? 'step' : undefined}
                className={cn(
                  'text-caption duration-short ease-standard flex h-8 w-8 items-center justify-center rounded-full border font-mono uppercase tracking-[0.18em] transition-colors',
                  status === 'complete' && 'border-forge-orange bg-forge-orange text-bg-void',
                  status === 'active' &&
                    'border-forge-orange text-forge-orange shadow-glow-forge-soft',
                  status === 'upcoming' && 'border-border-subtle text-text-muted',
                )}
              >
                {status === 'complete' ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {!isLast && orientation === 'vertical' && (
                <span
                  aria-hidden
                  className={cn(
                    'mt-1 h-8 w-px',
                    status === 'complete' ? 'bg-forge-orange' : 'bg-border-subtle',
                  )}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p
                className={cn(
                  'font-heading text-small font-medium',
                  status === 'upcoming' ? 'text-text-muted' : 'text-text-primary',
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-caption text-text-secondary">{step.description}</p>
              )}
            </div>
            {!isLast && orientation === 'horizontal' && (
              <span
                aria-hidden
                className={cn(
                  'mt-4 h-px flex-1 self-start',
                  status === 'complete' ? 'bg-forge-orange' : 'bg-border-subtle',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
