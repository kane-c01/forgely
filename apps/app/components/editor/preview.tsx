'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import type { DevicePreset } from '@/lib/types'

import { useEditor } from './editor-store'
import { BlockPreview } from './preview-renderers'

const DEVICE_WIDTH: Record<DevicePreset, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
}

type RenderMode = 'inline' | 'iframe'

export function EditorPreview() {
  const editor = useEditor()
  const t = useT()
  const width = DEVICE_WIDTH[editor.device]
  const [mode, setMode] = useState<RenderMode>('inline')

  return (
    <div className="bg-bg-void flex h-full flex-1 flex-col">
      {/* Device toolbar */}
      <div className="border-border-subtle bg-bg-deep flex items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex items-center gap-1.5">
          <DeviceButton
            current={editor.device}
            value="desktop"
            onClick={editor.setDevice}
            icon="Desktop"
            label={t.editor.desktop}
          />
          <DeviceButton
            current={editor.device}
            value="tablet"
            onClick={editor.setDevice}
            icon="Tablet"
            label={t.editor.tablet}
          />
          <DeviceButton
            current={editor.device}
            value="mobile"
            onClick={editor.setDevice}
            icon="Mobile"
            label={t.editor.mobile}
          />
          <span className="bg-border-subtle mx-1 h-4 w-px" aria-hidden />
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
          {editor.activePage.name} · {width}px
        </p>
        <div className="text-caption text-text-muted flex items-center gap-3 font-mono">
          <span>{t.editor.autosave}</span>
          <span className="text-text-secondary inline-flex items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                editor.unsaved ? 'bg-warning animate-pulse' : 'bg-success',
              )}
            />
            {editor.unsaved ? t.editor.unsaved : t.editor.allGood}
          </span>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 overflow-auto px-8 py-6" onClick={() => editor.selectBlock(null)}>
        <div className="mx-auto" style={{ maxWidth: width }}>
          <div
            className="border-border-subtle overflow-hidden rounded-lg border shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_48px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Browser chrome */}
            <div className="border-border-subtle bg-bg-elevated flex items-center justify-between gap-3 border-b px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-error/60 h-2.5 w-2.5 rounded-full" />
                <span className="bg-warning/60 h-2.5 w-2.5 rounded-full" />
                <span className="bg-success/60 h-2.5 w-2.5 rounded-full" />
              </div>
              <div className="border-border-subtle bg-bg-deep flex h-6 flex-1 items-center justify-center rounded border px-2">
                <p className="text-caption text-text-secondary font-mono">
                  qiao-coffee.forgely.app
                  {editor.activePage.slug === '/' ? '' : editor.activePage.slug}
                </p>
              </div>
              <div className="text-text-muted flex items-center gap-1">
                <Icon.Eye size={12} />
                <span className="text-caption font-mono">{t.editor.preview}</span>
              </div>
            </div>

            {mode === 'iframe' ? (
              <IframePreview width={width} />
            ) : (
              editor.activePage.blocks.map((b) => {
                const hideOn = (b.props.hideOn as string[] | undefined) ?? []
                if (hideOn.includes(editor.device)) return null
                return (
                  <BlockPreview
                    key={b.id}
                    block={b}
                    selected={editor.selectedBlockId === b.id}
                    onClick={() => editor.selectBlock(b.id)}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────── Iframe live-preview ──────────────────────── */

function IframePreview({ width }: { width: number }) {
  const t = useT()
  const editor = useEditor()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [ready, setReady] = useState(false)

  // Build the DSL the iframe will render. Filter out blocks hidden on
  // the current device so toggling tablet / mobile actually reflects.
  const dsl = useMemo(() => {
    const visible = editor.activePage.blocks.filter((b) => {
      const hideOn = (b.props.hideOn as string[] | undefined) ?? []
      return b.visible !== false && !hideOn.includes(editor.device)
    })
    return {
      device: editor.device,
      blocks: visible.map((b) => ({
        id: b.id,
        type: b.type,
        visible: true,
        props: b.props,
      })),
    }
  }, [editor.activePage.blocks, editor.device])

  // Listen for the iframe's `ready` ping so we know we can postMessage.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'forgely:ready') setReady(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // Push a fresh DSL whenever it changes (and the iframe is up).
  useEffect(() => {
    if (!ready) return
    iframeRef.current?.contentWindow?.postMessage({ type: 'forgely:dsl', dsl }, '*')
  }, [dsl, ready])

  // Initial src — passes the first DSL via base64 so the SSR HTML
  // already paints the right content (avoids a flash of defaults).
  const initialSrc = useMemo(() => {
    if (typeof window === 'undefined') return '/api/preview'
    const json = JSON.stringify(dsl)
    const base64 =
      typeof btoa === 'function'
        ? btoa(unescape(encodeURIComponent(json)))
        : Buffer.from(json, 'utf-8').toString('base64')
    return `/api/preview?siteId=qiao-coffee&dsl=${encodeURIComponent(base64)}`
    // Only compute the initial URL once — after that we update via postMessage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative" style={{ height: 'min(78vh, 1100px)' }}>
      <iframe
        ref={iframeRef}
        src={initialSrc}
        title={t.editor.storefrontPreview}
        className="block h-full w-full border-0 bg-white"
        style={{ width: width + 'px', maxWidth: '100%' }}
        sandbox="allow-scripts allow-same-origin"
      />
      {!ready ? (
        <div className="bg-bg-void/60 pointer-events-none absolute inset-0 grid place-items-center backdrop-blur-sm">
          <Badge tone="forge" dot>
            {t.editor.connectingPreview}
          </Badge>
        </div>
      ) : null}
    </div>
  )
}

/* ───────────────────── Toolbar pieces ──────────────────────────── */

function ModeToggle({ mode, onChange }: { mode: RenderMode; onChange: (m: RenderMode) => void }) {
  const t = useT()
  const modeLabels: Record<RenderMode, string> = {
    inline: t.editor.inline,
    iframe: t.editor.iframe,
  }
  return (
    <div className="border-border-subtle bg-bg-elevated inline-flex items-center rounded-md border p-0.5">
      {(['inline', 'iframe'] as RenderMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={cn(
            'text-caption rounded px-2 py-1 font-mono uppercase tracking-[0.12em] transition-colors',
            mode === m ? 'bg-bg-deep text-forge-amber' : 'text-text-muted hover:text-text-primary',
          )}
        >
          {modeLabels[m]}
        </button>
      ))}
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
        'text-caption inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono uppercase tracking-[0.12em] transition-colors',
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
