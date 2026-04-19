/**
 * Real Anthropic provider — thin wrapper around `@anthropic-ai/sdk` that
 * speaks the `LlmProvider` contract used by every Forgely agent.
 *
 * Cost estimates follow Anthropic's published pricing for Claude 4 / 3.5
 * (input + output token blended). Update `PRICING` when prices move.
 */
import Anthropic from '@anthropic-ai/sdk'

import {
  type LlmContentBlock,
  type LlmModel,
  type LlmProvider,
  type LlmResponse,
  type LlmTextRequest,
  type LlmVisionRequest,
  LlmProviderError,
} from './types'

const PRICING: Record<LlmModel, { input: number; output: number }> = {
  // USD per 1M tokens
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-haiku-4': { input: 0.8, output: 4 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-5-haiku-latest': { input: 0.8, output: 4 },
}

const MODEL_ALIASES: Record<LlmModel, string> = {
  'claude-opus-4': 'claude-opus-4-20250101',
  'claude-sonnet-4': 'claude-sonnet-4-20250101',
  'claude-haiku-4': 'claude-haiku-4-20250101',
  'claude-3-5-sonnet-latest': 'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-latest': 'claude-3-5-haiku-latest',
}

export interface AnthropicProviderOptions {
  apiKey: string
  /** Override base URL (Bedrock / Vertex / proxy). */
  baseUrl?: string
  /** Default request timeout (ms). */
  timeoutMs?: number
}

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic-real' as const
  private readonly client: Anthropic
  private readonly defaultTimeoutMs: number

  constructor(opts: AnthropicProviderOptions) {
    if (!opts.apiKey) {
      throw new LlmProviderError(
        'ANTHROPIC_API_KEY missing — pass via opts.apiKey or env var.',
        'NO_API_KEY',
      )
    }
    this.client = new Anthropic({
      apiKey: opts.apiKey,
      baseURL: opts.baseUrl,
    })
    this.defaultTimeoutMs = opts.timeoutMs ?? 60_000
  }

  async text<T = string>(req: LlmTextRequest): Promise<LlmResponse<T>> {
    return this.run<T>(req)
  }

  async vision<T = unknown>(req: LlmVisionRequest): Promise<LlmResponse<T>> {
    const blocks: LlmContentBlock[] = []
    if (typeof req.user === 'string') {
      blocks.push({ type: 'text', text: req.user })
    } else {
      blocks.push(...req.user)
    }
    for (const img of req.images) {
      if ('url' in img) {
        blocks.push({ type: 'image', source: { type: 'url', url: img.url } })
      } else {
        blocks.push({
          type: 'image',
          source: { type: 'base64', data: img.base64, mediaType: img.mediaType },
        })
      }
    }
    return this.run<T>({ ...req, user: blocks })
  }

  private async run<T>(req: LlmTextRequest): Promise<LlmResponse<T>> {
    const blocks = normaliseUser(req.user, req.jsonSchema)
    const model = MODEL_ALIASES[req.model]
    let response: Anthropic.Messages.Message
    try {
      response = await this.client.messages.create(
        {
          model,
          system: req.system,
          messages: [{ role: 'user', content: blocks as never }],
          max_tokens: req.maxTokens ?? 1024,
          temperature: req.temperature ?? 0.4,
        },
        { timeout: this.defaultTimeoutMs },
      )
    } catch (err) {
      throw mapAnthropicError(err)
    }

    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('\n')

    const data = req.jsonSchema ? (safeParseJson(text) as T) : (text as T)
    const pricing = PRICING[req.model]
    const costUsd =
      (response.usage.input_tokens / 1_000_000) * pricing.input +
      (response.usage.output_tokens / 1_000_000) * pricing.output

    return {
      data,
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costUsd,
      traceId: response.id,
    }
  }
}

function normaliseUser(
  user: LlmTextRequest['user'],
  jsonSchema: LlmTextRequest['jsonSchema'],
): LlmContentBlock[] {
  const blocks: LlmContentBlock[] = []
  if (typeof user === 'string') {
    blocks.push({ type: 'text', text: user })
  } else {
    blocks.push(...user)
  }
  if (jsonSchema) {
    blocks.push({
      type: 'text',
      text: jsonSchema === 'array'
        ? '\n\nReturn ONLY a JSON array — no prose, no markdown fences.'
        : '\n\nReturn ONLY valid JSON — no prose, no markdown fences.',
    })
  }
  return blocks
}

function safeParseJson(text: string): unknown {
  // Strip ```json fences if Claude defied the instruction.
  const cleaned = text
    .replace(/^[\s`]*json/i, '')
    .replace(/^[\s`]*/, '')
    .replace(/[\s`]*$/, '')
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new LlmProviderError(
      `Provider returned invalid JSON: ${(err as Error).message}\n${cleaned.slice(0, 240)}…`,
      'INVALID_RESPONSE',
      err,
    )
  }
}

function mapAnthropicError(err: unknown): LlmProviderError {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 429) return new LlmProviderError(err.message, 'RATE_LIMIT', err)
    return new LlmProviderError(err.message, 'UPSTREAM', err)
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
    return new LlmProviderError('Anthropic call aborted / timed out.', 'TIMEOUT', err)
  }
  return new LlmProviderError(
    err instanceof Error ? err.message : 'Unknown Anthropic error',
    'UPSTREAM',
    err,
  )
}
