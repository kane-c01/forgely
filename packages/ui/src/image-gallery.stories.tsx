import type { Meta, StoryObj } from '@storybook/react'

import { ImageGallery, type GalleryImage } from './image-gallery'

const DEMO_IMAGES: GalleryImage[] = Array.from({ length: 9 }, (_, i) => ({
  src: `https://picsum.photos/seed/forgely${i}/800/600`,
  thumbnail: `https://picsum.photos/seed/forgely${i}/400/300`,
  alt: `Sample image ${i + 1}`,
}))

const meta: Meta<typeof ImageGallery> = {
  title: 'Complex/ImageGallery',
  component: ImageGallery,
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj<typeof ImageGallery>

export const ThreeColumns: Story = {
  args: { images: DEMO_IMAGES, columns: 3, aspect: '4/3' },
}

export const FourColumns: Story = {
  args: { images: DEMO_IMAGES, columns: 4, aspect: 'square' },
}

export const WideAspect: Story = {
  args: { images: DEMO_IMAGES.slice(0, 4), columns: 2, aspect: '16/9' },
}
