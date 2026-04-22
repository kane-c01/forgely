'use client'

import { requireConfirmed, useRegisterCopilotTool } from '@/components/copilot/copilot-provider'

import { useEditor } from './editor-store'

/**
 * Bridges Copilot tool calls to real `editor-store` mutations while the
 * Theme Editor is mounted.
 *
 * Mounting this once inside `<EditorProvider>` is enough — when a tool
 * call like `change_colors` or `modify_theme_block` is confirmed in the
 * Copilot drawer, the editor preview reflects the change live.
 *
 * The runners are intentionally permissive about input shape so the
 * fake-assistant can stay loose; we just inspect the arg names we know.
 */
export function EditorCopilotBridge() {
  const editor = useEditor()

  // change_colors → batch-update the active page's primary `hero` block.
  useRegisterCopilotTool('change_colors', (args) => {
    const gate = requireConfirmed(args, 'change_colors')
    if (gate) return gate
    const block = editor.activePage.blocks.find((b) => b.type === 'hero')
    if (!block) return 'No hero block to recolor on this page.'
    if (typeof args.primary === 'string') {
      editor.updateBlockProp(block.id, 'colorPrimary', args.primary)
    }
    if (typeof args.accent === 'string') {
      editor.updateBlockProp(block.id, 'colorAccent', args.accent)
    }
    return `Shifted hero palette → primary ${String(args.primary ?? '—')}, accent ${String(args.accent ?? '—')}.`
  })

  // change_fonts → stamp heading/body font families on every block on
  // the active page. The preview picks these up through the shared DSL.
  useRegisterCopilotTool('change_fonts', (args) => {
    const gate = requireConfirmed(args, 'change_fonts')
    if (gate) return gate
    const heading = args.heading as string | undefined
    const body = args.body as string | undefined
    if (!heading && !body) return 'No font families supplied.'
    let count = 0
    for (const block of editor.activePage.blocks) {
      if (heading) {
        editor.updateBlockProp(block.id, 'fontHeading', heading)
        count += 1
      }
      if (body) {
        editor.updateBlockProp(block.id, 'fontBody', body)
        count += 1
      }
    }
    const summary = [heading && `heading → ${heading}`, body && `body → ${body}`]
      .filter(Boolean)
      .join(', ')
    return `Updated fonts across ${count} block prop${count === 1 ? '' : 's'} (${summary}).`
  })

  // rewrite_copy → if the args carry an `options` array, take the first
  // and apply it to the selected block (or the active hero) headline.
  useRegisterCopilotTool('rewrite_copy', (args) => {
    const gate = requireConfirmed(args, 'rewrite_copy')
    if (gate) return gate
    const target = editor.selectedBlock ?? editor.activePage.blocks.find((b) => b.type === 'hero')
    if (!target) return 'No block selected to rewrite.'
    const options = (args.options as string[] | undefined) ?? []
    const next = options[0]
    if (!next) return 'No options provided.'
    editor.updateBlockProp(target.id, 'headline', next)
    return `Updated headline → "${next}".`
  })

  // modify_theme_block → patch arbitrary props on the selected block.
  useRegisterCopilotTool('modify_theme_block', (args) => {
    const gate = requireConfirmed(args, 'modify_theme_block')
    if (gate) return gate
    const id = (args.blockId as string | undefined) ?? editor.selectedBlockId
    if (!id) return 'No block selected.'
    // Accept both the documented `{ patch: { … } }` shape and the
    // fake-assistant's legacy `{ props: { … } }` shape.
    const patch =
      (args.patch as Record<string, unknown> | undefined) ??
      (args.props as Record<string, unknown> | undefined) ??
      {}
    let count = 0
    for (const [k, v] of Object.entries(patch)) {
      editor.updateBlockProp(id, k, v)
      count += 1
    }
    return `Updated ${count} prop${count === 1 ? '' : 's'} on block ${id}.`
  })

  // add_theme_block → append by type.
  useRegisterCopilotTool('add_theme_block', (args) => {
    const gate = requireConfirmed(args, 'add_theme_block')
    if (gate) return gate
    const type = args.type as string | undefined
    if (!type) return 'No block type provided.'
    const valid = [
      'hero',
      'product-grid',
      'value-props',
      'testimonials',
      'rich-text',
      'newsletter',
      'footer',
    ] as const
    if (!valid.includes(type as (typeof valid)[number])) {
      return `Unknown block type "${type}".`
    }
    editor.addBlock(type as (typeof valid)[number], args.afterId as string | undefined)
    return `Added a new ${type} block.`
  })

  // remove_theme_block → remove by id (or current selection).
  useRegisterCopilotTool('remove_theme_block', (args) => {
    const gate = requireConfirmed(args, 'remove_theme_block')
    if (gate) return gate
    const id = (args.blockId as string | undefined) ?? editor.selectedBlockId
    if (!id) return 'No block selected.'
    editor.removeBlock(id)
    return `Removed block ${id}.`
  })

  return null
}
