'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { createElement } from 'react'

import { themePages, themeVersions } from '@/lib/mocks'
import type { BlockType, DevicePreset, ThemeBlock, ThemePage, ThemeVersion } from '@/lib/types'

/**
 * Theme Editor — single-source-of-truth state.
 *
 * The editor mutates `pages[].blocks[].props` and the structural list of
 * blocks. The preview renders directly from this state, so visual edits,
 * AI conversations and version restore all converge to the same tree.
 *
 * History model:
 *   • `past`    — snapshots of `present` BEFORE a mutating action
 *   • `present` — current document
 *   • `future`  — snapshots popped from `past` by undo, awaiting redo
 *
 * Actions tagged `MUTATING` push the previous `present` onto `past` and
 * clear `future`. Selection / device changes are non-undoable to keep
 * history meaningful.
 */

interface DocumentSnapshot {
  pages: ThemePage[]
}

interface EditorState {
  past: DocumentSnapshot[]
  present: DocumentSnapshot
  future: DocumentSnapshot[]
  activePageId: string
  selectedBlockId: string | null
  device: DevicePreset
  versions: ThemeVersion[]
  unsaved: boolean
}

type EditorAction =
  | { type: 'select-page'; pageId: string }
  | { type: 'select-block'; blockId: string | null }
  | { type: 'set-device'; device: DevicePreset }
  | {
      type: 'update-block-prop'
      pageId: string
      blockId: string
      key: string
      value: unknown
    }
  | { type: 'toggle-block-visible'; pageId: string; blockId: string }
  | { type: 'reorder-block'; pageId: string; blockId: string; direction: 'up' | 'down' }
  | { type: 'remove-block'; pageId: string; blockId: string }
  | { type: 'add-block'; pageId: string; blockType: BlockType; afterId?: string }
  | { type: 'duplicate-block'; pageId: string; blockId: string }
  | { type: 'restore-version'; versionId: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'mark-saved' }

const MUTATING: ReadonlySet<EditorAction['type']> = new Set([
  'update-block-prop',
  'toggle-block-visible',
  'reorder-block',
  'remove-block',
  'add-block',
  'duplicate-block',
])

let blockSeq = 100
const HISTORY_LIMIT = 50

function defaultPropsFor(t: BlockType): Record<string, unknown> {
  switch (t) {
    case 'hero':
      return {
        headline: 'New section',
        subhead: 'Tell your story.',
        ctaPrimary: 'Shop now',
        alignment: 'left',
        intensity: 'cinematic',
      }
    case 'product-grid':
      return { headline: 'Featured', collection: 'bestsellers', columns: 3, limit: 6 }
    case 'value-props':
      return {
        headline: 'Why us',
        items: [
          { icon: '⚡', title: 'Fast', body: 'Same-day shipping.' },
          { icon: '🌱', title: 'Sustainable', body: 'Carbon-neutral packaging.' },
          { icon: '🤝', title: 'Trusted', body: 'Loved by 1,000+ brands.' },
        ],
      }
    case 'testimonials':
      return { headline: 'From the community', layout: 'cards' }
    case 'rich-text':
      return { body: 'Write your story here…' }
    case 'newsletter':
      return { headline: 'Stay in the loop', subhead: 'New drops, monthly.' }
    case 'footer':
      return { columns: 4 }
  }
}

function applyDocAction(doc: DocumentSnapshot, action: EditorAction): DocumentSnapshot {
  switch (action.type) {
    case 'update-block-prop':
      return {
        pages: doc.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                blocks: p.blocks.map((b) =>
                  b.id === action.blockId
                    ? { ...b, props: { ...b.props, [action.key]: action.value } }
                    : b,
                ),
              }
            : p,
        ),
      }
    case 'toggle-block-visible':
      return {
        pages: doc.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                blocks: p.blocks.map((b) =>
                  b.id === action.blockId ? { ...b, visible: !b.visible } : b,
                ),
              }
            : p,
        ),
      }
    case 'reorder-block':
      return {
        pages: doc.pages.map((p) => {
          if (p.id !== action.pageId) return p
          const idx = p.blocks.findIndex((b) => b.id === action.blockId)
          if (idx < 0) return p
          const swap = action.direction === 'up' ? idx - 1 : idx + 1
          if (swap < 0 || swap >= p.blocks.length) return p
          const next = p.blocks.slice()
          ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
          return { ...p, blocks: next }
        }),
      }
    case 'remove-block':
      return {
        pages: doc.pages.map((p) =>
          p.id === action.pageId
            ? { ...p, blocks: p.blocks.filter((b) => b.id !== action.blockId) }
            : p,
        ),
      }
    case 'add-block': {
      const newBlock: ThemeBlock = {
        id: `b_${++blockSeq}`,
        type: action.blockType,
        visible: true,
        props: defaultPropsFor(action.blockType),
      }
      return {
        pages: doc.pages.map((p) => {
          if (p.id !== action.pageId) return p
          if (!action.afterId) return { ...p, blocks: [...p.blocks, newBlock] }
          const idx = p.blocks.findIndex((b) => b.id === action.afterId)
          const next = p.blocks.slice()
          next.splice(idx + 1, 0, newBlock)
          return { ...p, blocks: next }
        }),
      }
    }
    case 'duplicate-block':
      return {
        pages: doc.pages.map((p) => {
          if (p.id !== action.pageId) return p
          const idx = p.blocks.findIndex((b) => b.id === action.blockId)
          if (idx < 0) return p
          const src = p.blocks[idx]!
          const copy: ThemeBlock = {
            ...src,
            id: `b_${++blockSeq}`,
            props: { ...src.props },
          }
          const next = p.blocks.slice()
          next.splice(idx + 1, 0, copy)
          return { ...p, blocks: next }
        }),
      }
    default:
      return doc
  }
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'select-page':
      return { ...state, activePageId: action.pageId, selectedBlockId: null }
    case 'select-block':
      return { ...state, selectedBlockId: action.blockId }
    case 'set-device':
      return { ...state, device: action.device }
    case 'restore-version':
      return state // mock — no-op
    case 'mark-saved':
      return { ...state, unsaved: false }
    case 'undo': {
      if (state.past.length === 0) return state
      const past = state.past.slice(0, -1)
      const present = state.past[state.past.length - 1]!
      const future = [state.present, ...state.future]
      return { ...state, past, present, future, unsaved: true }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const present = state.future[0]!
      const future = state.future.slice(1)
      const past = [...state.past, state.present]
      return { ...state, past, present, future, unsaved: true }
    }
    default: {
      if (!MUTATING.has(action.type)) return state
      const nextPresent = applyDocAction(state.present, action)
      const past = [...state.past, state.present].slice(-HISTORY_LIMIT)
      let selected = state.selectedBlockId
      if (action.type === 'add-block') {
        const page = nextPresent.pages.find((p) => p.id === action.pageId)
        selected = page?.blocks[page.blocks.length - 1]?.id ?? selected
      } else if (action.type === 'duplicate-block') {
        const page = nextPresent.pages.find((p) => p.id === action.pageId)
        const after = page?.blocks.findIndex((b) => b.id === action.blockId)
        if (page && typeof after === 'number' && after >= 0) {
          selected = page.blocks[after + 1]?.id ?? selected
        }
      } else if (action.type === 'remove-block' && state.selectedBlockId === action.blockId) {
        selected = null
      }
      return {
        ...state,
        past,
        present: nextPresent,
        future: [],
        selectedBlockId: selected,
        unsaved: true,
      }
    }
  }
}

interface EditorContextValue {
  pages: ThemePage[]
  activePageId: string
  selectedBlockId: string | null
  device: DevicePreset
  versions: ThemeVersion[]
  unsaved: boolean
  canUndo: boolean
  canRedo: boolean
  activePage: ThemePage
  selectedBlock: ThemeBlock | null

  selectPage: (pageId: string) => void
  selectBlock: (blockId: string | null) => void
  setDevice: (d: DevicePreset) => void
  updateBlockProp: (blockId: string, key: string, value: unknown) => void
  toggleBlockVisible: (blockId: string) => void
  reorderBlock: (blockId: string, direction: 'up' | 'down') => void
  removeBlock: (blockId: string) => void
  addBlock: (blockType: BlockType, afterId?: string) => void
  duplicateBlock: (blockId: string) => void
  restoreVersion: (versionId: string) => void
  undo: () => void
  redo: () => void
  markSaved: () => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>')
  return ctx
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: { pages: themePages },
    future: [],
    activePageId: themePages[0]!.id,
    selectedBlockId: null,
    device: 'desktop',
    versions: themeVersions,
    unsaved: false,
  })

  const activePage = useMemo(
    () => state.present.pages.find((p) => p.id === state.activePageId) ?? state.present.pages[0]!,
    [state.present.pages, state.activePageId],
  )
  const selectedBlock = useMemo(
    () => activePage.blocks.find((b) => b.id === state.selectedBlockId) ?? null,
    [activePage, state.selectedBlockId],
  )

  const value = useMemo<EditorContextValue>(
    () => ({
      pages: state.present.pages,
      activePageId: state.activePageId,
      selectedBlockId: state.selectedBlockId,
      device: state.device,
      versions: state.versions,
      unsaved: state.unsaved,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      activePage,
      selectedBlock,
      selectPage: (pageId) => dispatch({ type: 'select-page', pageId }),
      selectBlock: (blockId) => dispatch({ type: 'select-block', blockId }),
      setDevice: (device) => dispatch({ type: 'set-device', device }),
      updateBlockProp: (blockId, key, val) =>
        dispatch({ type: 'update-block-prop', pageId: activePage.id, blockId, key, value: val }),
      toggleBlockVisible: (blockId) =>
        dispatch({ type: 'toggle-block-visible', pageId: activePage.id, blockId }),
      reorderBlock: (blockId, direction) =>
        dispatch({ type: 'reorder-block', pageId: activePage.id, blockId, direction }),
      removeBlock: (blockId) => dispatch({ type: 'remove-block', pageId: activePage.id, blockId }),
      addBlock: (blockType, afterId) =>
        dispatch({ type: 'add-block', pageId: activePage.id, blockType, afterId }),
      duplicateBlock: (blockId) =>
        dispatch({ type: 'duplicate-block', pageId: activePage.id, blockId }),
      restoreVersion: (versionId) => dispatch({ type: 'restore-version', versionId }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      markSaved: () => dispatch({ type: 'mark-saved' }),
    }),
    [state, activePage, selectedBlock],
  )

  return createElement(EditorContext.Provider, { value }, children)
}

/**
 * Bind editor keyboard shortcuts. Mount inside an `<EditorProvider>`.
 *
 *   ⌘Z / ⌃Z         — undo
 *   ⌘⇧Z / ⌃⇧Z       — redo (also ⌘Y on Windows)
 *   Backspace / Del — remove selected block
 *   D               — duplicate selected block
 *   ↑ / ↓           — move selected block up/down
 *   E               — toggle visibility of selected block
 *   Esc             — deselect block
 *
 * Listener is no-op when focus is in an input / textarea / contenteditable.
 */
export function useEditorShortcuts() {
  const editor = useEditor()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable
      if (isEditable) return

      const meta = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()

      if (meta && k === 'z' && !e.shiftKey) {
        e.preventDefault()
        editor.undo()
        return
      }
      if (meta && (k === 'y' || (k === 'z' && e.shiftKey))) {
        e.preventDefault()
        editor.redo()
        return
      }
      if (!editor.selectedBlockId) return
      if (k === 'backspace' || k === 'delete') {
        e.preventDefault()
        editor.removeBlock(editor.selectedBlockId)
      } else if (k === 'd' && !meta) {
        e.preventDefault()
        editor.duplicateBlock(editor.selectedBlockId)
      } else if (k === 'arrowup') {
        e.preventDefault()
        editor.reorderBlock(editor.selectedBlockId, 'up')
      } else if (k === 'arrowdown') {
        e.preventDefault()
        editor.reorderBlock(editor.selectedBlockId, 'down')
      } else if (k === 'e' && !meta) {
        e.preventDefault()
        editor.toggleBlockVisible(editor.selectedBlockId)
      } else if (k === 'escape') {
        e.preventDefault()
        editor.selectBlock(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor])
}

export const BLOCK_LIBRARY: Array<{ type: BlockType; label: string; icon: string }> = [
  { type: 'hero', label: 'Hero', icon: '🎬' },
  { type: 'product-grid', label: 'Product grid', icon: '📦' },
  { type: 'value-props', label: 'Value props', icon: '✨' },
  { type: 'testimonials', label: 'Testimonials', icon: '💬' },
  { type: 'rich-text', label: 'Rich text', icon: '✍️' },
  { type: 'newsletter', label: 'Newsletter', icon: '📨' },
  { type: 'footer', label: 'Footer', icon: '📐' },
]
