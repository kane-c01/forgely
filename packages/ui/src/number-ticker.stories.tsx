import type { Meta, StoryObj } from '@storybook/react'

import { NumberTicker } from './number-ticker'

const meta: Meta<typeof NumberTicker> = {
  title: 'Animated/NumberTicker',
  component: NumberTicker,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof NumberTicker>

export const KPI: Story = {
  args: { value: 12483 },
  render: (args) => (
    <div className="border-border-subtle bg-bg-elevated rounded-xl border p-6">
      <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
        Sites forged this month
      </p>
      <NumberTicker {...args} className="text-display text-forge-orange block" />
    </div>
  ),
}
