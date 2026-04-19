'use client'

import { useEffect } from 'react'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { BlocksList } from '@/components/editor/blocks-list'
import { EditorCopilotBridge } from '@/components/editor/copilot-bridge'
import { EditorProvider, useEditor, useEditorShortcuts } from '@/components/editor/editor-store'
import { EditorPreview } from '@/components/editor/preview'
import { PropertiesPanel } from '@/components/editor/properties-panel'
import { ShortcutsLegend } from '@/components/editor/shortcuts-legend'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'

export default function EditorPage({ params }: { params: { siteId: string } }) {
  return (
    <EditorProvider>
      <EditorScaffold siteId={params.siteId} />
    </EditorProvider>
  )
}

function EditorScaffold({ siteId }: { siteId: string }) {
  const editor = useEditor()
  useCopilotContext({
    kind: 'editor',
    siteId,
    selectedBlockId: editor.selectedBlockId ?? undefined,
    selectedBlockType: editor.selectedBlock?.type,
  })
  useEditorShortcuts()

  // The editor wants edge-to-edge layout, but the (app) layout adds
  // `px-8 py-6`. We compensate with negative margins so users get the
  // full canvas while keeping the parent layout consistent.
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const prev = main.className
    main.className = prev.replace('px-8 py-6', 'p-0')
    return () => {
      main.className = prev
    }
  }, [])

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <header className="border-border-subtle bg-bg-deep flex items-center justify-between gap-4 border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button size="xs" variant="ghost">
            <Icon.ChevronLeft size={12} /> Exit
          </Button>
          <div className="flex flex-col">
            <p className="font-heading text-body text-text-primary">Theme Editor</p>
            <p className="text-caption text-text-muted font-mono">
              {siteId} · {editor.activePage.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!editor.canUndo}
            onClick={() => editor.undo()}
            aria-label="Undo (⌘Z)"
            className="border-border-subtle bg-bg-elevated text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber grid h-8 w-8 place-items-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon.History size={14} />
          </button>
          <button
            type="button"
            disabled={!editor.canRedo}
            onClick={() => editor.redo()}
            aria-label="Redo (⌘⇧Z)"
            className="border-border-subtle bg-bg-elevated text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber grid h-8 w-8 place-items-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon.History size={14} className="-scale-x-100" />
          </button>
          <ShortcutsLegend />
          <span className="bg-border-subtle mx-1 h-5 w-px" aria-hidden />
          {editor.unsaved ? (
            <Badge tone="warning" dot>
              unsaved changes
            </Badge>
          ) : (
            <Badge tone="success" dot>
              saved
            </Badge>
          )}
          <Button size="sm" variant="secondary" onClick={() => editor.markSaved()}>
            <Icon.Check size={14} /> Save draft
          </Button>
          <Button size="sm">
            <Icon.Sparkle size={14} /> Publish
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <BlocksList />
        <EditorPreview />
        <PropertiesPanel />
      </div>
      <EditorCopilotBridge />
    </div>
  )
}
