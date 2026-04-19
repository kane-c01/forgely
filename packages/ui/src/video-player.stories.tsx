import type { Meta, StoryObj } from '@storybook/react'

import { VideoPlayer, type VideoSource } from './video-player'

const DEMO_SOURCES: VideoSource[] = [
  { src: 'https://www.w3schools.com/html/mov_bbb.mp4', label: '720p', width: 1280 },
  { src: 'https://www.w3schools.com/html/mov_bbb.mp4', label: '480p', width: 854 },
  { src: 'https://www.w3schools.com/html/mov_bbb.mp4', label: '360p', width: 640 },
]

const meta: Meta<typeof VideoPlayer> = {
  title: 'Complex/VideoPlayer',
  component: VideoPlayer,
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj<typeof VideoPlayer>

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl">
      <VideoPlayer sources={DEMO_SOURCES} />
    </div>
  ),
}

export const AutoPlayMuted: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl">
      <VideoPlayer sources={DEMO_SOURCES} autoPlay muted loop />
    </div>
  ),
}

export const SingleSource: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <VideoPlayer sources={[DEMO_SOURCES[0]!]} loop />
    </div>
  ),
}
