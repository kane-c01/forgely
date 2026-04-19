import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'

/**
 * Shared MSW server for tests that prefer simulating end-to-end HTTP rather
 * than injecting a mock fetch.
 *
 * Tests can also pass `fetchImpl` directly into adapters; both styles are
 * supported and exercised in the test suite.
 */
export const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
