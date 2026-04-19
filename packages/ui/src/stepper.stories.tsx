import type { Meta, StoryObj } from '@storybook/react'

import { Stepper } from './stepper'

const meta: Meta<typeof Stepper> = {
  title: 'Patterns/Stepper',
  component: Stepper,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Stepper>

const STEPS = [
  { id: 'scrape', title: 'Scrape', description: 'Fetch products & images' },
  { id: 'analyze', title: 'Analyze', description: 'Brand + visual signals' },
  { id: 'plan', title: 'Plan', description: 'Compose SiteDSL' },
  { id: 'render', title: 'Render', description: 'Hero, value props, story' },
  { id: 'deploy', title: 'Deploy', description: 'Cloudflare Pages live' },
]

export const Active: Story = {
  args: { steps: STEPS, currentStep: 2 },
}

export const Vertical: Story = {
  args: { steps: STEPS, currentStep: 3, orientation: 'vertical' },
}
