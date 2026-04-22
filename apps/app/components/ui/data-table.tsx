'use client'

import type { ReactNode } from 'react'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  width?: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  empty?: ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>) {
  const t = useT()
  return (
    <div
      className={cn(
        'border-border-subtle bg-bg-surface overflow-hidden rounded-lg border',
        className,
      )}
    >
      <table className="text-small w-full text-left">
        <thead className="border-border-subtle bg-bg-deep border-b">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cn(
                  'text-caption text-text-muted px-4 py-3 font-mono uppercase tracking-[0.12em]',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                {empty ?? <p className="text-text-muted text-center">{t.dataTable.noData}</p>}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-border-subtle/60 border-b transition-colors last:border-b-0',
                  onRowClick && 'hover:bg-bg-elevated/60 cursor-pointer',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'text-text-primary px-4 py-3 align-middle',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
