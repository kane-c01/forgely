import type { Preview } from '@storybook/react'

import './preview.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'forgely-void',
      values: [
        { name: 'forgely-void', value: '#08080A' },
        { name: 'forgely-deep', value: '#0E0E11' },
        { name: 'forgely-surface', value: '#14141A' },
      ],
    },
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      element: '#storybook-root',
      manual: false,
    },
  },
}

export default preview
