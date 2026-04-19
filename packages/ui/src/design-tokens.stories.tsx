import type { Meta, StoryObj } from '@storybook/react'

import { colors } from '@forgely/design-tokens'

const meta: Meta = {
  title: 'Foundations/Design Tokens',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="border-border-subtle bg-bg-elevated text-text-primary flex flex-col gap-1 rounded-lg border p-3">
      <div
        className="border-border-subtle h-12 w-full rounded-md border"
        style={{ backgroundColor: value }}
      />
      <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
        {name}
      </span>
      <span className="text-caption text-text-secondary font-mono">{value}</span>
    </div>
  )
}

export const Colors: Story = {
  render: () => {
    const groups = Object.entries(colors) as Array<
      [string, Record<string, string | Record<string, string>>]
    >
    return (
      <div className="grid gap-6">
        {groups.map(([groupName, group]) => (
          <section key={groupName}>
            <h3 className="text-caption text-text-muted mb-2 font-mono uppercase tracking-[0.18em]">
              {groupName}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(group).map(([key, value]) =>
                typeof value === 'string' ? (
                  <Swatch key={key} name={`${groupName}.${key}`} value={value} />
                ) : null,
              )}
            </div>
          </section>
        ))}
      </div>
    )
  },
}
