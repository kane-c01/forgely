'use client'

import { useEditor } from './editor-store'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { Field, Input, Textarea } from '@/components/ui/input'
import { useCopilot } from '@/components/copilot/copilot-provider'
import { cn } from '@/lib/cn'
import type { DevicePreset, ThemeBlock } from '@/lib/types'

import { EditorAIChat } from './editor-ai-chat'
import { VersionHistory } from './version-history'

export function PropertiesPanel() {
  const editor = useEditor()
  return (
    <aside className="border-border-subtle bg-bg-deep flex h-full w-[360px] shrink-0 flex-col border-l">
      <div className="border-border-subtle border-b px-4 py-3">
        <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
          {editor.selectedBlock ? 'Selected block' : 'No selection'}
        </p>
        <p className="font-heading text-h3 text-text-primary mt-1">
          {editor.selectedBlock
            ? prettyBlockName(editor.selectedBlock)
            : 'Click a block to edit it'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {editor.selectedBlock ? (
          <BlockInspector block={editor.selectedBlock} />
        ) : (
          <VersionHistory />
        )}
      </div>

      <EditorAIChat />
    </aside>
  )
}

function prettyBlockName(b: ThemeBlock): string {
  const cap = b.type.replace(/(^|-)(\w)/g, (_, _2, c: string) => c.toUpperCase()).replace(/-/g, ' ')
  return cap
}

function BlockInspector({ block }: { block: ThemeBlock }) {
  const editor = useEditor()
  const copilot = useCopilot()
  const set = (k: string, v: unknown) => editor.updateBlockProp(block.id, k, v)
  const hideOn = (block.props.hideOn as DevicePreset[] | undefined) ?? []

  const fieldsByType: Record<string, () => React.ReactNode> = {
    hero: () => (
      <>
        <Field label="Eyebrow">
          <Input
            value={(block.props.eyebrow as string) ?? ''}
            onChange={(e) => set('eyebrow', e.target.value)}
          />
        </Field>
        <Field label="Headline">
          <Textarea
            value={(block.props.headline as string) ?? ''}
            onChange={(e) => set('headline', e.target.value)}
          />
        </Field>
        <Field label="Subhead">
          <Textarea
            value={(block.props.subhead as string) ?? ''}
            onChange={(e) => set('subhead', e.target.value)}
          />
        </Field>
        <Field label="Primary CTA">
          <Input
            value={(block.props.ctaPrimary as string) ?? ''}
            onChange={(e) => set('ctaPrimary', e.target.value)}
          />
        </Field>
        <Field label="Secondary CTA">
          <Input
            value={(block.props.ctaSecondary as string) ?? ''}
            onChange={(e) => set('ctaSecondary', e.target.value)}
          />
        </Field>
        <Field label="Alignment">
          <select
            className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none"
            value={(block.props.alignment as string) ?? 'left'}
            onChange={(e) => set('alignment', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
        <Field label="Intensity">
          <select
            className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none"
            value={(block.props.intensity as string) ?? 'cinematic'}
            onChange={(e) => set('intensity', e.target.value)}
          >
            <option value="editorial">Editorial</option>
            <option value="cinematic">Cinematic</option>
            <option value="bold">Bold</option>
          </select>
        </Field>
      </>
    ),
    'product-grid': () => (
      <>
        <Field label="Headline">
          <Input
            value={(block.props.headline as string) ?? ''}
            onChange={(e) => set('headline', e.target.value)}
          />
        </Field>
        <Field label="Collection">
          <Input
            value={(block.props.collection as string) ?? ''}
            onChange={(e) => set('collection', e.target.value)}
          />
        </Field>
        <Field label="Columns">
          <Input
            type="number"
            min={2}
            max={4}
            value={String(block.props.columns ?? 3)}
            onChange={(e) => set('columns', Number(e.target.value))}
          />
        </Field>
        <Field label="Limit">
          <Input
            type="number"
            min={1}
            max={12}
            value={String(block.props.limit ?? 6)}
            onChange={(e) => set('limit', Number(e.target.value))}
          />
        </Field>
      </>
    ),
    'value-props': () => (
      <Field label="Headline">
        <Input
          value={(block.props.headline as string) ?? ''}
          onChange={(e) => set('headline', e.target.value)}
        />
      </Field>
    ),
    testimonials: () => (
      <Field label="Headline">
        <Input
          value={(block.props.headline as string) ?? ''}
          onChange={(e) => set('headline', e.target.value)}
        />
      </Field>
    ),
    'rich-text': () => (
      <Field label="Body" hint="Markdown supported.">
        <Textarea
          value={(block.props.body as string) ?? ''}
          onChange={(e) => set('body', e.target.value)}
          className="min-h-40"
        />
      </Field>
    ),
    newsletter: () => (
      <>
        <Field label="Headline">
          <Input
            value={(block.props.headline as string) ?? ''}
            onChange={(e) => set('headline', e.target.value)}
          />
        </Field>
        <Field label="Subhead">
          <Input
            value={(block.props.subhead as string) ?? ''}
            onChange={(e) => set('subhead', e.target.value)}
          />
        </Field>
      </>
    ),
    footer: () => (
      <Field label="Columns">
        <Input
          type="number"
          min={2}
          max={5}
          value={String(block.props.columns ?? 4)}
          onChange={(e) => set('columns', Number(e.target.value))}
        />
      </Field>
    ),
  }

  const renderFields =
    fieldsByType[block.type] ??
    (() => <p className="text-small text-text-muted">No properties available.</p>)

  return (
    <div className="flex flex-col gap-3">
      {/* Per-device visibility */}
      <div className="border-border-subtle bg-bg-surface rounded-md border p-3">
        <p className="text-caption text-text-muted mb-2 inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.12em]">
          <Icon.Eye size={12} /> Show on
        </p>
        <div className="flex items-center gap-1.5">
          {(['desktop', 'tablet', 'mobile'] as DevicePreset[]).map((d) => {
            const I = d === 'desktop' ? Icon.Desktop : d === 'tablet' ? Icon.Tablet : Icon.Mobile
            const visible = !hideOn.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => editor.toggleDeviceHide(block.id, d)}
                aria-pressed={visible}
                className={cn(
                  'text-caption inline-flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 font-mono uppercase tracking-[0.12em] transition-colors',
                  visible
                    ? 'border-forge-orange/40 bg-bg-elevated text-forge-amber'
                    : 'border-border-subtle bg-bg-deep text-text-muted hover:text-text-secondary',
                )}
              >
                <I size={12} />
                {d[0]}
              </button>
            )
          })}
        </div>
      </div>

      {renderFields()}
      <div className="border-forge-orange/20 bg-bg-surface rounded-md border p-3">
        <p className="text-caption text-forge-amber mb-2 inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.12em]">
          <Icon.Sparkle size={12} /> Ask Copilot to edit this block
        </p>
        <Button
          size="xs"
          variant="secondary"
          className="w-full"
          onClick={() => {
            copilot.setOpen(true)
            void copilot.send(`Make the ${block.type} block more bold and rewrite the headline.`)
          }}
        >
          Open Copilot →
        </Button>
      </div>
    </div>
  )
}
