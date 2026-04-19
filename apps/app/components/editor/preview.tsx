'use client'

import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { DevicePreset } from '@/lib/types'

import { useEditor } from './editor-store'
import { BlockPreview } from './preview-renderers'

const DEVICE_WIDTH: Record<DevicePreset, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
}

export function EditorPreview() {
  const editor = useEditor()
  const width = DEVICE_WIDTH[editor.device]

  return (
    <div className="flex h-full flex-1 flex-col bg-bg-void">
      {/* Device toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-deep px-4 py-2">
        <div className="flex items-center gap-1.5">
          <DeviceButton current={editor.device} value="desktop" onClick={editor.setDevice} icon="Desktop" label="Desktop" />
          <DeviceButton current={editor.device} value="tablet" onClick={editor.setDevice} icon="Tablet" label="Tablet" />
          <DeviceButton current={editor.device} value="mobile" onClick={editor.setDevice} icon="Mobile" label="Mobile" />
        </div>
        <p className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
          {editor.activePage.name} · {width}px
        </p>
        <div className="flex items-center gap-3 font-mono text-caption text-text-muted">
          <span>autosave</span>
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <span className={cn('h-1.5 w-1.5 rounded-full', editor.unsaved ? 'bg-warning animate-pulse' : 'bg-success')} />
            {editor.unsaved ? 'unsaved' : 'all good'}
          </span>
        </div>
      </div>

      {/* Stage */}
      <div
        className="flex-1 overflow-auto px-8 py-6"
        onClick={() => editor.selectBlock(null)}
      >
        <div className="mx-auto" style={{ maxWidth: width }}>
          <div
            className="overflow-hidden rounded-lg border border-border-subtle shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_48px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Browser chrome */}
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-elevated px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="flex h-6 flex-1 items-center justify-center rounded border border-border-subtle bg-bg-deep px-2">
                <p className="font-mono text-caption text-text-secondary">
                  qiao-coffee.forgely.app{editor.activePage.slug === '/' ? '' : editor.activePage.slug}
                </p>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <Icon.Eye size={12} />
                <span className="font-mono text-caption">PREVIEW</span>
              </div>
            </div>
            {editor.activePage.blocks.map((b) => (
              <BlockPreview
                key={b.id}
                block={b}
                selected={editor.selectedBlockId === b.id}
                onClick={() => editor.selectBlock(b.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeviceButton({
  current,
  value,
  onClick,
  icon,
  label,
}: {
  current: DevicePreset
  value: DevicePreset
  onClick: (d: DevicePreset) => void
  icon: 'Desktop' | 'Tablet' | 'Mobile'
  label: string
}) {
  const I = Icon[icon]
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-caption uppercase tracking-[0.12em] transition-colors',
        active
          ? 'bg-bg-elevated text-forge-amber shadow-[0_0_0_1px_rgba(255,107,26,0.4)_inset]'
          : 'text-text-muted hover:text-text-primary',
      )}
    >
      <I size={14} />
      {label}
    </button>
  )
}
