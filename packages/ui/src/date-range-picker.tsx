'use client'

import * as React from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from './utils'

export interface DateRangePickerProps {
  /** Currently selected date range. */
  value?: DateRange
  /** Callback fired when the range changes. */
  onChange?: (range: DateRange | undefined) => void
  /** Placeholder text when no range is selected. */
  placeholder?: string
  /** Minimum selectable date. */
  minDate?: Date
  /** Maximum selectable date. */
  maxDate?: Date
  disabled?: boolean
  className?: string
}

/**
 * DateRangePicker — a two-month calendar dropdown built on
 * `react-day-picker`. Themed with the Cinematic Industrial palette.
 */
export const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(
    { value, onChange, placeholder = 'Select date range', minDate, maxDate, disabled, className },
    ref,
  ) {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    React.useImperativeHandle(ref, () => containerRef.current!)

    React.useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const label =
      value?.from && value?.to
        ? `${formatDate(value.from)} – ${formatDate(value.to)}`
        : value?.from
          ? `${formatDate(value.from)} – …`
          : placeholder

    return (
      <div ref={containerRef} className={cn('relative inline-block', className)}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((p) => !p)}
          className={cn(
            'border-border-strong bg-bg-elevated text-text-primary inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors',
            'hover:border-forge-orange focus-visible:ring-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <Calendar className="text-text-secondary h-4 w-4" />
          <span className={cn(!value?.from && 'text-text-secondary')}>{label}</span>
        </button>

        {open && (
          <div className="border-border-strong bg-bg-elevated absolute left-0 z-50 mt-2 rounded-xl border p-3 shadow-lg">
            <DayPicker
              mode="range"
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              classNames={{
                months: 'flex gap-4',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-heading font-medium text-text-primary',
                nav: 'flex items-center',
                nav_button:
                  'h-7 w-7 bg-transparent hover:bg-bg-surface rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-text-secondary rounded-md w-9 font-normal text-[0.8rem]',
                row: 'flex w-full mt-1',
                cell: 'h-9 w-9 text-center text-sm relative focus-within:relative focus-within:z-20',
                day: 'h-9 w-9 rounded-md font-normal text-text-primary hover:bg-bg-surface transition-colors',
                day_range_start: 'bg-forge-orange text-bg-void hover:bg-forge-amber rounded-l-md',
                day_range_end: 'bg-forge-orange text-bg-void hover:bg-forge-amber rounded-r-md',
                day_selected: 'bg-forge-orange text-bg-void hover:bg-forge-amber',
                day_range_middle: 'bg-forge-orange/20 text-text-primary',
                day_today: 'ring-1 ring-forge-orange',
                day_outside: 'text-text-secondary/40',
                day_disabled: 'text-text-secondary/30',
              }}
              components={{
                Chevron: (props: ComponentProps<'svg'>) => {
                  const orient = (props as Record<string, unknown>).orientation
                  return orient === 'left' ? (
                    <ChevronLeft className="h-4 w-4" {...props} />
                  ) : (
                    <ChevronRight className="h-4 w-4" {...props} />
                  )
                },
              }}
            />
          </div>
        )}
      </div>
    )
  },
)
