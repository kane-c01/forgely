import type { Meta, StoryObj } from '@storybook/react'
import { Sparkles } from 'lucide-react'

import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'Start Forging',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary' },
}

export const Secondary: Story = {
  args: { variant: 'secondary' },
}

export const Ghost: Story = {
  args: { variant: 'ghost' },
}

export const Destructive: Story = {
  args: { variant: 'destructive' },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Sparkles className="h-4 w-4" />
        Generate site
      </>
    ),
  },
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Generating…',
  },
}
