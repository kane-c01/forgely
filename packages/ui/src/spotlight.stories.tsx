import type { Meta, StoryObj } from '@storybook/react'

import { Spotlight } from './spotlight'

const meta: Meta<typeof Spotlight> = {
  title: 'Animated/Spotlight',
  component: Spotlight,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'forgely-void' } },
}

export default meta
type Story = StoryObj<typeof Spotlight>

export const HeroBackdrop: Story = {
  render: () => (
    <Spotlight className="bg-bg-void flex h-[420px] w-full items-center justify-center">
      <div className="max-w-xl text-center">
        <h1 className="font-display text-display text-text-primary leading-tight">
          Brand operating system <br /> for the AI era.
        </h1>
        <p className="text-body text-text-secondary mt-4">
          Forge cinematic brand sites from a single link.
        </p>
      </div>
    </Spotlight>
  ),
}
