import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Aurora ceramic mug</CardTitle>
        <CardDescription>Hand-thrown stoneware. 12oz. Made in Kyoto.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-small text-text-secondary">
          Slow-poured matte glaze with a hint of cobalt. Each piece carries the maker's thumb-print
          on the base.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
          $48
        </span>
        <Button>Add to brand kit</Button>
      </CardFooter>
    </Card>
  ),
}
