import { describe, expect, it, vi } from 'vitest'
import type { Browser, BrowserContext, Page, Response } from 'playwright'

import { PlaywrightBrowserAdapter, type BrowserLauncher } from './playwright-browser.js'

type FakePage = Pick<Page, 'goto' | 'screenshot' | 'content' | 'waitForTimeout' | 'evaluate'>

function makeFakeStack(
  overrides: {
    htmlContent?: string
    finalUrl?: string
    screenshotBytes?: Uint8Array
    gotoThrows?: Error
  } = {},
): {
  launcher: BrowserLauncher
  launchCount: () => number
  closedCount: () => number
} {
  let launchCount = 0
  let closedCount = 0

  const launcher: BrowserLauncher = {
    async launch() {
      launchCount++
      const page: FakePage = {
        goto: vi.fn(async (_url: string) => {
          if (overrides.gotoThrows) throw overrides.gotoThrows
          return {
            url: () => overrides.finalUrl ?? 'https://final.example.com/',
          } as unknown as Response
        }),
        screenshot: vi.fn(async () =>
          Buffer.from(overrides.screenshotBytes ?? new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
        ),
        content: vi.fn(async () => overrides.htmlContent ?? '<html><body>ok</body></html>'),
        waitForTimeout: vi.fn(async (_ms: number) => {}),
        evaluate: vi.fn(async () => undefined),
      }
      const context = {
        newPage: vi.fn(async () => page),
        close: vi.fn(async () => {}),
      } as unknown as BrowserContext
      const browser = {
        newContext: vi.fn(async () => context),
        close: vi.fn(async () => {
          closedCount++
        }),
      } as unknown as Browser
      return browser
    },
  }
  return {
    launcher,
    launchCount: () => launchCount,
    closedCount: () => closedCount,
  }
}

describe('PlaywrightBrowserAdapter.screenshot', () => {
  it('captures bytes + image/png mime type', async () => {
    const { launcher } = makeFakeStack({ screenshotBytes: new Uint8Array([1, 2, 3]) })
    const adapter = new PlaywrightBrowserAdapter({ launcher })
    const result = await adapter.screenshot('https://x.com')
    expect(result.contentType).toBe('image/png')
    expect(result.bytes).toEqual(new Uint8Array([1, 2, 3]))
    await adapter.close()
  })
})

describe('PlaywrightBrowserAdapter.renderHtml', () => {
  it('returns rendered html and finalUrl', async () => {
    const { launcher } = makeFakeStack({
      htmlContent: '<html><body>rendered</body></html>',
      finalUrl: 'https://x.com/redirected',
    })
    const adapter = new PlaywrightBrowserAdapter({ launcher })
    const result = await adapter.renderHtml('https://x.com')
    expect(result.html).toBe('<html><body>rendered</body></html>')
    expect(result.finalUrl).toBe('https://x.com/redirected')
    await adapter.close()
  })

  it('falls back to the input url when response is missing', async () => {
    const launcher: BrowserLauncher = {
      async launch() {
        const page = {
          goto: vi.fn(async () => null),
          screenshot: vi.fn(),
          content: vi.fn(async () => '<html></html>'),
          waitForTimeout: vi.fn(async () => {}),
          evaluate: vi.fn(async () => undefined),
        } as unknown as Page
        const context = {
          newPage: vi.fn(async () => page),
          close: vi.fn(async () => {}),
        } as unknown as BrowserContext
        return {
          newContext: vi.fn(async () => context),
          close: vi.fn(async () => {}),
        } as unknown as Browser
      },
    }
    const adapter = new PlaywrightBrowserAdapter({ launcher, persistent: false })
    const result = await adapter.renderHtml('https://x.com/origin', { scrollToBottom: false })
    expect(result.finalUrl).toBe('https://x.com/origin')
  })
})

describe('PlaywrightBrowserAdapter persistence', () => {
  it('reuses the browser across calls when persistent (default)', async () => {
    const stack = makeFakeStack()
    const adapter = new PlaywrightBrowserAdapter({ launcher: stack.launcher })
    await adapter.screenshot('https://x.com')
    await adapter.renderHtml('https://x.com')
    expect(stack.launchCount()).toBe(1)
    await adapter.close()
    expect(stack.closedCount()).toBe(1)
  })

  it('launches a fresh browser per call when persistent=false', async () => {
    const stack = makeFakeStack()
    const adapter = new PlaywrightBrowserAdapter({ launcher: stack.launcher, persistent: false })
    await adapter.screenshot('https://x.com')
    await adapter.renderHtml('https://x.com')
    expect(stack.launchCount()).toBe(2)
    expect(stack.closedCount()).toBe(2)
  })
})
