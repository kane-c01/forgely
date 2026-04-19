import type { Meta, StoryObj } from '@storybook/react'

import { CardContainer, CardBody, CardItem } from './three-d-card'

const meta: Meta<typeof CardContainer> = {
  title: 'Aceternity/3DCard',
  component: CardContainer,
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof CardContainer>

export const Default: Story = {
  render: () => (
    <CardContainer>
      <CardBody className="w-80">
        <CardItem translateZ={50} as="h2" className="text-text-primary text-xl font-bold">
          Hover me
        </CardItem>
        <CardItem translateZ={30} as="p" className="text-text-secondary mt-2 text-sm">
          This card tilts in 3D based on your cursor position, creating a cinematic depth effect.
        </CardItem>
        <CardItem translateZ={80} className="mt-4">
          <img
            src="https://picsum.photos/seed/3dcard/400/200"
            alt="Demo"
            className="h-40 w-full rounded-lg object-cover"
          />
        </CardItem>
      </CardBody>
    </CardContainer>
  ),
}

export const ProductCard: Story = {
  render: () => (
    <CardContainer>
      <CardBody className="w-72">
        <CardItem translateZ={60} className="w-full">
          <img
            src="https://picsum.photos/seed/product3d/360/360"
            alt="Product"
            className="aspect-square w-full rounded-lg object-cover"
          />
        </CardItem>
        <CardItem
          translateZ={40}
          as="h3"
          className="text-text-primary font-heading mt-3 text-lg font-semibold"
        >
          Artisan Ceramic
        </CardItem>
        <CardItem translateZ={20} as="p" className="text-text-secondary text-sm">
          ¥2,480
        </CardItem>
      </CardBody>
    </CardContainer>
  ),
}
