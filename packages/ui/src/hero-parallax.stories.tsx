import type { Meta, StoryObj } from '@storybook/react'

import { HeroParallax, type HeroParallaxItem } from './hero-parallax'

const DEMO_ITEMS: HeroParallaxItem[] = Array.from({ length: 15 }, (_, i) => ({
  title: `Showcase ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/hero${i}/640/360`,
  link: '#',
}))

const meta: Meta<typeof HeroParallax> = {
  title: 'Aceternity/HeroParallax',
  component: HeroParallax,
  parameters: { layout: 'fullscreen' },
}

export default meta

type Story = StoryObj<typeof HeroParallax>

export const Default: Story = {
  args: { items: DEMO_ITEMS },
}

export const CustomHeadline: Story = {
  args: {
    items: DEMO_ITEMS,
    headline: (
      <h2 className="font-display text-hero-mega text-text-primary leading-none">
        Showcase your <br /> best work.
      </h2>
    ),
    subline: 'A curated gallery of cinematic brand sites powered by Forgely.',
  },
}
