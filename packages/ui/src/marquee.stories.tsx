import type { Meta, StoryObj } from '@storybook/react'

import { Marquee } from './marquee'

const meta: Meta<typeof Marquee> = {
  title: 'Animated/Marquee',
  component: Marquee,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof Marquee>

const LOGOS = ['Recess', 'AG1', 'Aesop', 'Liquid Death', 'Glossier', 'Olipop', 'Vuori', 'Rhode']

export const TrustBar: Story = {
  render: () => (
    <Marquee pauseOnHover className="py-4 [--duration:40s]" duration={40}>
      {LOGOS.map((name) => (
        <span
          key={name}
          className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]"
        >
          {name}
        </span>
      ))}
    </Marquee>
  ),
}
