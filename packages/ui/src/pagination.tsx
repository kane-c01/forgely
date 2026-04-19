'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button, buttonVariants } from './button'
import { cn } from './utils'

/**
 * Pagination — accessible nav for paginated tables and lists.
 * Pure markup primitives (no state); drive `currentPage` from outside.
 */
export function Pagination({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

export function PaginationContent({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />
}

export function PaginationItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('', className)} {...props} />
}

export interface PaginationLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  size?: 'sm' | 'md' | 'icon'
}

export function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? 'secondary' : 'ghost',
          size,
        }),
        isActive && 'border-forge-orange text-forge-orange',
        className,
      )}
      {...props}
    />
  )
}

export function PaginationPrevious(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <PaginationLink aria-label="Go to previous page" size="sm" className="gap-1 pl-2.5" {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>Prev</span>
    </PaginationLink>
  )
}

export function PaginationNext(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <PaginationLink aria-label="Go to next page" size="sm" className="gap-1 pr-2.5" {...props}>
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}

export function PaginationEllipsis({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn('text-text-muted flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

/**
 * Convenience uncontrolled pager that renders a sane default page list with
 * ellipses around the current page. Uses {@link Button}'s ghost variant to
 * stay subtle in dense surfaces.
 */
export interface SimplePaginationProps {
  page: number
  pageCount: number
  onPageChange: (next: number) => void
  className?: string
}

export function SimplePagination({
  page,
  pageCount,
  onPageChange,
  className,
}: SimplePaginationProps) {
  const pages = computeRange(page, pageCount)
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
        </PaginationItem>
        {pages.map((p, i) =>
          p === '…' ? (
            <PaginationItem key={`dots-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink isActive={p === page} onClick={() => onPageChange(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function computeRange(page: number, total: number): Array<number | '…'> {
  const window = 1
  const range: Array<number | '…'> = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= page - window && i <= page + window)) {
      range.push(i)
    } else if (range[range.length - 1] !== '…') {
      range.push('…')
    }
  }
  return range
}
