import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { ColorPicker } from './color-picker'

const meta: Meta<typeof ColorPicker> = {
  title: 'Complex/ColorPicker',
  component: ColorPicker,
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof ColorPicker>

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#FF6B2B')
    return <ColorPicker value={color} onChange={setColor} />
  },
}

export const CustomPresets: Story = {
  render: function Render() {
    const [color, setColor] = useState('#2D2A26')
    return (
      <ColorPicker
        value={color}
        onChange={setColor}
        presets={[
          '#2D2A26',
          '#8B5A3C',
          '#C4A179',
          '#FEFDFB',
          '#7A8B5C',
          '#B98B3A',
          '#A0463F',
          '#E8E2D9',
        ]}
      />
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, value: '#3B82F6' },
}
