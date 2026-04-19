/**
 * In-process Claude mock — returns canned responses based on a registry of
 * (request → JSON) handlers. Used for unit tests, CI and dev when no
 * `ANTHROPIC_API_KEY` is configured.
 *
 * Add deterministic handlers per agent; unmatched calls throw so tests
 * fail loudly instead of silently returning garbage.
 */
import {
  type LlmProvider,
  type LlmResponse,
  type LlmTextRequest,
  type LlmVisionRequest,
  LlmProviderError,
} from './types'

export type MockHandler = (req: LlmTextRequest | LlmVisionRequest) => unknown

interface MockEntry {
  match: (req: LlmTextRequest | LlmVisionRequest) => boolean
  handler: MockHandler
  /** Bumped each time the handler is invoked — useful for tests. */
  hits: number
}

export class MockLlmProvider implements LlmProvider {
  readonly name = 'anthropic-mock' as const
  private readonly handlers: MockEntry[] = []

  /** Register a handler. The first matching entry wins. */
  on(
    match: (req: LlmTextRequest | LlmVisionRequest) => boolean,
    handler: MockHandler,
  ): this {
    this.handlers.push({ match, handler, hits: 0 })
    return this
  }

  /** Convenience: route by exact `system` substring. */
  onSystemContains(needle: string, handler: MockHandler): this {
    return this.on((req) => req.system.includes(needle), handler)
  }

  /** Reset every registered handler — call between tests. */
  reset(): void {
    this.handlers.length = 0
  }

  hitCounts(): number[] {
    return this.handlers.map((e) => e.hits)
  }

  async text<T = string>(req: LlmTextRequest): Promise<LlmResponse<T>> {
    return this.dispatch(req)
  }

  async vision<T = unknown>(req: LlmVisionRequest): Promise<LlmResponse<T>> {
    return this.dispatch(req)
  }

  private dispatch<T>(req: LlmTextRequest | LlmVisionRequest): LlmResponse<T> {
    for (const entry of this.handlers) {
      if (!entry.match(req)) continue
      entry.hits += 1
      const data = entry.handler(req) as T
      const text = typeof data === 'string' ? data : JSON.stringify(data)
      return {
        data,
        text,
        inputTokens: estimateTokens(JSON.stringify(req.user)),
        outputTokens: estimateTokens(text),
        costUsd: 0,
        traceId: `mock_${Date.now()}_${entry.hits}`,
      }
    }
    throw new LlmProviderError(
      `MockLlmProvider: no handler matched call to model ${req.model} (system="${req.system.slice(
        0,
        80,
      )}…")`,
      'INVALID_RESPONSE',
    )
  }
}

function estimateTokens(s: string): number {
  // Rough heuristic — Claude tokens average ~4 chars / token for English.
  return Math.ceil(s.length / 4)
}
