/**
 * Minimal abstraction over the Claude API surface used by Forgely agents.
 *
 * All agent code talks to `LlmProvider` (not the raw Anthropic SDK) so we
 * can swap the real provider for the in-process mock during tests / CI
 * and avoid burning real API credits on every commit.
 */
export type LlmModel =
  | 'claude-opus-4'
  | 'claude-sonnet-4'
  | 'claude-haiku-4'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-haiku-latest'

export interface LlmTextRequest {
  model: LlmModel
  /** System prompt — set once for the call. */
  system: string
  /** User content. Strings are wrapped as `text` blocks; objects pass through. */
  user: string | LlmContentBlock[]
  /** Force JSON-only output. The provider will instruct + parse. */
  jsonSchema?: 'object' | 'array' | 'auto'
  maxTokens?: number
  temperature?: number
}

export interface LlmVisionRequest extends LlmTextRequest {
  /** One or more images to attach to the call. */
  images: Array<{ url: string } | { base64: string; mediaType: string }>
}

export type LlmContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } | { type: 'base64'; data: string; mediaType: string } }

export interface LlmResponse<T = unknown> {
  /** Parsed JSON if `jsonSchema` was set, otherwise raw text under `.text`. */
  data: T
  text: string
  inputTokens: number
  outputTokens: number
  /** Estimated USD cost for this single call. */
  costUsd: number
  /** Provider-internal trace id for debugging. */
  traceId?: string
}

export interface LlmProvider {
  readonly name: 'anthropic-real' | 'anthropic-mock'
  /** Pure text generation. */
  text<T = string>(req: LlmTextRequest): Promise<LlmResponse<T>>
  /** Vision-augmented generation. */
  vision<T = unknown>(req: LlmVisionRequest): Promise<LlmResponse<T>>
}

export class LlmProviderError extends Error {
  override readonly name = 'LlmProviderError'
  readonly code: 'NO_API_KEY' | 'RATE_LIMIT' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'UPSTREAM'
  override readonly cause?: unknown
  constructor(
    message: string,
    code: 'NO_API_KEY' | 'RATE_LIMIT' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'UPSTREAM',
    cause?: unknown,
  ) {
    super(message)
    this.code = code
    this.cause = cause
  }
}
