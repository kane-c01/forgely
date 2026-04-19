import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { FontPicker, type FontPickerFont } from './font-picker'

const SAMPLE_FONTS: FontPickerFont[] = [
  { family: 'Inter', source: 'google' },
  { family: 'Fraunces', source: 'google' },
  { family: 'JetBrains Mono', source: 'google' },
  { family: 'Space Grotesk', source: 'google' },
  { family: 'DM Sans', source: 'google' },
  { family: 'Playfair Display', source: 'google' },
  { family: 'IBM Plex Sans', source: 'google' },
  { family: 'Outfit', source: 'google' },
  { family: 'Sora', source: 'google' },
  { family: 'Manrope', source: 'google' },
]

const meta: Meta<typeof FontPicker> = {
  title: 'Complex/FontPicker',
  component: FontPicker,
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof FontPicker>

export const Default: Story = {
  render: function Render() {
    const [val, setVal] = useState<string>('Inter')
    return <FontPicker value={val} fonts={SAMPLE_FONTS} onChange={(f) => setVal(f.family)} />
  },
}

export const WithoutUpload: Story = {
  render: function Render() {
    const [val, setVal] = useState<string>('Inter')
    return (
      <FontPicker
        value={val}
        fonts={SAMPLE_FONTS}
        allowCustomUpload={false}
        onChange={(f) => setVal(f.family)}
      />
    )
  },
}
