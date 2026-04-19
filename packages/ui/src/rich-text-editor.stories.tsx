import type { Meta, StoryObj } from '@storybook/react'

import { RichTextEditor } from './rich-text-editor'

const meta: Meta<typeof RichTextEditor> = {
  title: 'Complex/RichTextEditor',
  component: RichTextEditor,
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj<typeof RichTextEditor>

export const Empty: Story = {
  args: { placeholder: 'Write your product description…' },
}

export const WithContent: Story = {
  args: {
    content:
      '<h2>Welcome to Forgely</h2><p>Create <strong>cinematic</strong> brand sites in minutes. Our AI-powered platform turns your product into a <em>visual experience</em>.</p><ul><li>Visual DNA system</li><li>Product Moments</li><li>One-click deploy</li></ul>',
  },
}

export const ReadOnly: Story = {
  args: {
    editable: false,
    content: '<p>This editor is <strong>read-only</strong>. Content cannot be changed.</p>',
  },
}
