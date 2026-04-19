import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { FileUpload, type UploadedFile } from './file-upload'

const meta: Meta<typeof FileUpload> = {
  title: 'Complex/FileUpload',
  component: FileUpload,
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof FileUpload>

export const Empty: Story = {
  args: { accept: 'image/*,.pdf', maxSize: 10 * 1024 * 1024 },
}

export const WithFiles: Story = {
  render: function Render() {
    const [files, setFiles] = useState<UploadedFile[]>([
      {
        id: '1',
        name: 'hero-shot.jpg',
        size: 2_400_000,
        type: 'image/jpeg',
        progress: 100,
        status: 'success',
        url: '#',
      },
      {
        id: '2',
        name: 'logo-draft.png',
        size: 840_000,
        type: 'image/png',
        progress: 65,
        status: 'uploading',
      },
      {
        id: '3',
        name: 'too-large.psd',
        size: 50_000_000,
        type: 'image/vnd.adobe.photoshop',
        progress: 0,
        status: 'error',
        error: 'File too large',
      },
    ])
    return (
      <div className="w-96">
        <FileUpload
          files={files}
          accept="image/*"
          maxSize={10 * 1024 * 1024}
          onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
        />
      </div>
    )
  },
}
