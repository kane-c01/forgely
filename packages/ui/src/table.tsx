import * as React from 'react'

import { cn } from './utils'

/**
 * Table primitives styled for dense data surfaces (Dashboard, Super Admin).
 * Drop-in compatible with `@tanstack/react-table` headless rendering.
 */
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  function Table({ className, ...props }, ref) {
    return (
      <div className="border-border-subtle relative w-full overflow-auto rounded-lg border">
        <table
          ref={ref}
          className={cn(
            'text-small text-text-primary w-full caption-bottom border-collapse font-mono',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      ref={ref}
      className={cn('bg-bg-elevated [&_tr]:border-border-subtle [&_tr]:border-b', className)}
      {...props}
    />
  )
})

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
})

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        'border-border-subtle bg-bg-elevated text-text-primary border-t font-medium',
        className,
      )}
      {...props}
    />
  )
})

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-border-subtle duration-short ease-standard border-b transition-colors',
        'hover:bg-bg-elevated/60 data-[state=selected]:bg-bg-elevated',
        className,
      )}
      {...props}
    />
  )
})

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cn(
        'text-caption text-text-muted h-10 px-3 text-left align-middle font-mono uppercase tracking-[0.18em]',
        className,
      )}
      {...props}
    />
  )
})

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn('px-3 py-2 align-middle', className)} {...props} />
})

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      className={cn('text-small text-text-secondary mt-3', className)}
      {...props}
    />
  )
})
