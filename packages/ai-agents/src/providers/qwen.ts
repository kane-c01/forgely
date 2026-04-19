/**
 * 通义千问 (Qwen) Provider — 阿里云百炼 / DashScope。
 *
 * 走 OpenAI 兼容接口（DashScope 提供）：
 *   https://dashscope.aliyuncs.com/compatible-mode/v1
 *
 * Models:
 *   - `qwen-max` / `qwen-plus` / `qwen-turbo` 文本
 *   - `qwen-vl-max` / `qwen-vl-plus` 视觉
 *
 * Pricing（2026 价目，CNY → USD ≈ 7.2）:
 *   qwen-max:    $1.40 / 1M input  · $5.60 / 1M output
 *   qwen-plus:   $0.08 / 1M input  · $0.20 / 1M output
 *   qwen-turbo:  $0.04 / 1M input  · $0.10 / 1M output
 *   qwen-vl-max: $2.78 / 1M input  · $8.33 / 1M output
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §4)
 */
import {
  type LlmContentBlock,
  type LlmModel,
  type LlmProvider,
  type LlmResponse,
  type LlmTextRequest,
  type LlmVisionRequest,
  LlmProviderError,
} from './types'

const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

const PRICING: Record<string, { input: number; output: number }> = {
  'qwen-max': { input: 1.4, output: 5.6 },
  'qwen-plus': { input: 0.08, output: 0.2 },
  'qwen-turbo': { input: 0.04, output: 0.1 },
  'qwen-vl-max': { input: 2.78, output: 8.33 },
  'qwen-vl-plus': { input: 0.42, output: 1.4 },
}

const MODEL_ALIAS: Partial<Record<LlmModel, string>> = {
  'claude-opus-4': 'qwen-max',
  'claude-sonnet-4': 'qwen-plus',
  'claude-haiku-4': 'qwen-turbo',
  'claude-3-5-sonnet-latest': 'qwen-plus',
  'claude-3-5-haiku-latest': 'qwen-turbo',
}

export interface QwenProviderOptions {
  apiKey: string
  baseUrl?: string
  timeoutMs?: number
  defaultTextModel?: 'qwen-max' | 'qwen-plus' | 'qwen-turbo'
  defaultVisionModel?: 'qwen-vl-max' | 'qwen-vl-plus'
}

export class QwenProvider implements LlmProvider {
  readonly name = 'anthropic-real' as const
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly defaultTextModel: 'qwen-max' | 'qwen-plus' | 'qwen-turbo'
  private readonly defaultVisionModel: 'qwen-vl-max' | 'qwen-vl-plus'

  constructor(opts: QwenProviderOptions) {
    if (!opts.apiKey) throw new LlmProviderError('DASHSCOPE_API_KEY missing.', 'NO_API_KEY')
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? BASE_URL
    this.timeoutMs = opts.timeoutMs ?? 60_000
    this.defaultTextModel = opts.defaultTextModel ?? 'qwen-plus'
    this.defaultVisionModel = opts.defaultVisionModel ?? 'qwen-vl-plus'
  }

  async text<T = string>(req: LlmTextRequest): Promise<LlmResponse<T>> {
    return this.run<T>({
      model: MODEL_ALIAS[req.model] ?? this.defaultTextModel,
      system: req.system,
      messages: [
        { role: 'system', content: req.system },
        {
          role: 'user',
          content: typeof req.user === 'string' ? req.user : blocksToString(req.user),
        },
      ],
      jsonSchema: req.jsonSchema,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
    })
  }

  async vision<T = unknown>(req: LlmVisionRequest): Promise<LlmResponse<T>> {
    const userParts: Array<
      { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
    > = []
    if (typeof req.user === 'string') userParts.push({ type: 'text', text: req.user })
    else for (const b of req.user) {
      if (b.type === 'text') userParts.push({ type: 'text', text: b.text })
      else if (b.type === 'image' && b.source.type === 'url') {
        userParts.push({ type: 'image_url', image_url: { url: b.source.url } })
      }
    }
    for (const img of req.images) {
      const url = 'url' in img ? img.url : `data:${img.mediaType};base64,${img.base64}`
      userParts.push({ type: 'image_url', image_url: { url } })
    }
    return this.run<T>({
      model: this.defaultVisionModel,
      system: req.system,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: userParts },
      ],
      jsonSchema: req.jsonSchema,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
    })
  }

  private async run<T>(args: {
    model: string
    system: string
    messages: unknown
    jsonSchema?: LlmTextRequest['jsonSchema']
    maxTokens?: number
    temperature?: number
  }): Promise<LlmResponse<T>> {
    const body = {
      model: args.model,
      messages: args.messages,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.4,
      ...(args.jsonSchema ? { response_format: { type: 'json_object' } } : {}),
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (err) {
      throw new LlmProviderError(
        (err as Error).name === 'AbortError' ? 'Qwen timed out.' : (err as Error).message,
        (err as Error).name === 'AbortError' ? 'TIMEOUT' : 'UPSTREAM',
        err,
      )
    } finally {
      clearTimeout(timeout)
    }

    if (response.status === 429) throw new LlmProviderError('Qwen rate-limited.', 'RATE_LIMIT')
    if (!response.ok) {
      const text = await response.text()
      throw new LlmProviderError(`Qwen HTTP ${response.status}: ${text.slice(0, 200)}`, 'UPSTREAM')
    }
    const json = (await response.json()) as {
      id: string
      choices: Array<{ message: { content: string } }>
      usage: { prompt_tokens: number; completion_tokens: number }
    }
    const text = json.choices[0]?.message.content ?? ''
    const data = args.jsonSchema ? (safeParseJson(text) as T) : (text as T)
    const pricing = PRICING[args.model] ?? PRICING['qwen-plus']!
    const costUsd =
      (json.usage.prompt_tokens / 1_000_000) * pricing.input +
      (json.usage.completion_tokens / 1_000_000) * pricing.output
    return {
      data,
      text,
      inputTokens: json.usage.prompt_tokens,
      outputTokens: json.usage.completion_tokens,
      costUsd,
      traceId: json.id,
    }
  }
}

function blocksToString(user: LlmContentBlock[]): string {
  return user
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
}

function safeParseJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?/, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new LlmProviderError(
      `Qwen returned invalid JSON: ${(err as Error).message}\n${cleaned.slice(0, 240)}`,
      'INVALID_RESPONSE',
      err,
    )
  }
}
