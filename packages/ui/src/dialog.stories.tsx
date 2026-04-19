import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Confirm regeneration</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate hero?</DialogTitle>
          <DialogDescription>
            This will re-render the hero loop and consume 30 credits. Your current hero will stay
            available for 24 hours.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Spend 30 credits</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
