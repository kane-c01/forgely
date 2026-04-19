'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { cn } from './cn'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  width?: string
  align?: 'left' | 'right' | 'center'
  sortAccessor?: (row: T) => string | number
}

export interface DataTableProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  initialSort?: { key: string; direction: 'asc' | 'desc' }
  className?: string
  /** Selected row id — highlights the row and persists active state. */
  selectedRowId?: string
  density?: 'comfortable' | 'compact'
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

/**
 * Headless-ish table tuned for the /super console — sticky header, mono
 * tabular numbers, click-to-select rows. Sorting is in-memory only; for
 * thousands of rows we'll swap to TanStack Table once T03 lands.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  emptyState,
  initialSort,
  className,
  selectedRowId,
  density = 'comfortable',
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort)
  const cellPad = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3'

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortAccessor) return rows
    const out = [...rows]
    out.sort((a, b) => {
      const av = col.sortAccessor!(a)
      const bv = col.sortAccessor!(b)
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return sort.direction === 'asc' ? cmp : -cmp
    })
    return out
  }, [rows, columns, sort])

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return undefined
    })
  }

  return (
    <div
      className={cn(
        'overflow-hidden border border-border-subtle bg-bg-deep',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-border-subtle bg-bg-surface">
            <tr>
              {columns.map((col) => {
                const sortable = !!col.sortAccessor
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      cellPad,
                      'font-mono text-caption uppercase tracking-[0.16em] text-text-muted',
                      ALIGN[col.align ?? 'left'],
                      sortable && 'cursor-pointer select-none hover:text-text-secondary',
                    )}
                    onClick={sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {active && (
                        <span className="text-forge-amber">
                          {sort?.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(cellPad, 'text-center text-small text-text-muted')}
                >
                  {emptyState ?? 'No records.'}
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const id = rowKey(row)
                const selected = selectedRowId === id
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-border-subtle transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-bg-surface',
                      selected && 'bg-forge-orange/5',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          cellPad,
                          'text-small text-text-primary',
                          ALIGN[col.align ?? 'left'],
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
