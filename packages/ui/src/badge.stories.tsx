import type { Meta, StoryObj } from '@storybook/react'

import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'Badge' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'forge', 'success', 'warning', 'error', 'info'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="forge">Forge</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
}
