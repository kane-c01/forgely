import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { DateRangePicker } from './date-range-picker'

const meta: Meta<typeof DateRangePicker> = {
  title: 'Complex/DateRangePicker',
  component: DateRangePicker,
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof DateRangePicker>

export const Default: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange | undefined>()
    return <DateRangePicker value={range} onChange={setRange} />
  },
}

export const WithConstraints: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange | undefined>()
    return (
      <DateRangePicker
        value={range}
        onChange={setRange}
        minDate={new Date()}
        placeholder="Pick campaign dates"
      />
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled picker' },
}
