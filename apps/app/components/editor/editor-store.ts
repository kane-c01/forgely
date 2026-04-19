'use client'

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { createElement } from 'react'

import { themePages, themeVersions } from '@/lib/mocks'
import type {
  BlockType,
  DevicePreset,
  ThemeBlock,
  ThemePage,
  ThemeVersion,
} from '@/lib/types'

/**
 * Theme Editor — single-source-of-truth state.
 *
 * The editor mutates `pages[].blocks[].props` and the structural list of
 * blocks. The preview renders directly from this state, so visual edits,
 * AI conversations and version restore all converge to the same tree.
 *
 * NOTE: We deliberately **do not** persist to a real backend in this
 * demo. The point is to prove the UX of the editor; once T17 (Compiler)
 * lands we wrap reducer actions in tRPC `theme.update*` mutations.
 */

interface EditorState {
  pages: ThemePage[]
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
  | { type: 'restore-version'; versionId: string }
  | { type: 'mark-saved' }

let blockSeq = 100

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

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'select-page':
      return { ...state, activePageId: action.pageId, selectedBlockId: null }
    case 'select-block':
      return { ...state, selectedBlockId: action.blockId }
    case 'set-device':
      return { ...state, device: action.device }
    case 'update-block-prop':
      return {
        ...state,
        pages: state.pages.map((p) =>
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
        unsaved: true,
      }
    case 'toggle-block-visible':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                blocks: p.blocks.map((b) =>
                  b.id === action.blockId ? { ...b, visible: !b.visible } : b,
                ),
              }
            : p,
        ),
        unsaved: true,
      }
    case 'reorder-block':
      return {
        ...state,
        pages: state.pages.map((p) => {
          if (p.id !== action.pageId) return p
          const idx = p.blocks.findIndex((b) => b.id === action.blockId)
          if (idx < 0) return p
          const swap = action.direction === 'up' ? idx - 1 : idx + 1
          if (swap < 0 || swap >= p.blocks.length) return p
          const next = p.blocks.slice()
          ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
          return { ...p, blocks: next }
        }),
        unsaved: true,
      }
    case 'remove-block':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? { ...p, blocks: p.blocks.filter((b) => b.id !== action.blockId) }
            : p,
        ),
        selectedBlockId: state.selectedBlockId === action.blockId ? null : state.selectedBlockId,
        unsaved: true,
      }
    case 'add-block': {
      const newBlock: ThemeBlock = {
        id: `b_${++blockSeq}`,
        type: action.blockType,
        visible: true,
        props: defaultPropsFor(action.blockType),
      }
      return {
        ...state,
        pages: state.pages.map((p) => {
          if (p.id !== action.pageId) return p
          if (!action.afterId) return { ...p, blocks: [...p.blocks, newBlock] }
          const idx = p.blocks.findIndex((b) => b.id === action.afterId)
          const next = p.blocks.slice()
          next.splice(idx + 1, 0, newBlock)
          return { ...p, blocks: next }
        }),
        selectedBlockId: newBlock.id,
        unsaved: true,
      }
    }
    case 'restore-version':
      return state // mock — no-op
    case 'mark-saved':
      return { ...state, unsaved: false }
  }
}

interface EditorContextValue extends EditorState {
  selectPage: (pageId: string) => void
  selectBlock: (blockId: string | null) => void
  setDevice: (d: DevicePreset) => void
  updateBlockProp: (blockId: string, key: string, value: unknown) => void
  toggleBlockVisible: (blockId: string) => void
  reorderBlock: (blockId: string, direction: 'up' | 'down') => void
  removeBlock: (blockId: string) => void
  addBlock: (blockType: BlockType, afterId?: string) => void
  restoreVersion: (versionId: string) => void
  markSaved: () => void
  activePage: ThemePage
  selectedBlock: ThemeBlock | null
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>')
  return ctx
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    pages: themePages,
    activePageId: themePages[0]!.id,
    selectedBlockId: null,
    device: 'desktop',
    versions: themeVersions,
    unsaved: false,
  })

  const activePage = useMemo(
    () => state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0]!,
    [state.pages, state.activePageId],
  )
  const selectedBlock = useMemo(
    () => activePage.blocks.find((b) => b.id === state.selectedBlockId) ?? null,
    [activePage, state.selectedBlockId],
  )

  const value = useMemo<EditorContextValue>(() => ({
    ...state,
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
    removeBlock: (blockId) =>
      dispatch({ type: 'remove-block', pageId: activePage.id, blockId }),
    addBlock: (blockType, afterId) =>
      dispatch({ type: 'add-block', pageId: activePage.id, blockType, afterId }),
    restoreVersion: (versionId) => dispatch({ type: 'restore-version', versionId }),
    markSaved: () => dispatch({ type: 'mark-saved' }),
  }), [state, activePage, selectedBlock])

  return createElement(EditorContext.Provider, { value }, children)
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
