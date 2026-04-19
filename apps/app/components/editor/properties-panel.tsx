'use client'

import { useEditor } from './editor-store'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { Field, Input, Textarea } from '@/components/ui/input'
import { useCopilot } from '@/components/copilot/copilot-provider'
import type { ThemeBlock } from '@/lib/types'

import { EditorAIChat } from './editor-ai-chat'
import { VersionHistory } from './version-history'

export function PropertiesPanel() {
  const editor = useEditor()
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-border-subtle bg-bg-deep">
      <div className="border-b border-border-subtle px-4 py-3">
        <p className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
          {editor.selectedBlock ? 'Selected block' : 'No selection'}
        </p>
        <p className="mt-1 font-heading text-h3 text-text-primary">
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
            className="h-9 w-full rounded-md border border-border-strong bg-bg-deep px-3 text-small text-text-primary focus:border-forge-orange/60 focus:outline-none"
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
            className="h-9 w-full rounded-md border border-border-strong bg-bg-deep px-3 text-small text-text-primary focus:border-forge-orange/60 focus:outline-none"
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

  const renderFields = fieldsByType[block.type] ?? (() => (
    <p className="text-small text-text-muted">No properties available.</p>
  ))

  return (
    <div className="flex flex-col gap-3">
      {renderFields()}
      <div className="rounded-md border border-forge-orange/20 bg-bg-surface p-3">
        <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-caption uppercase tracking-[0.12em] text-forge-amber">
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
