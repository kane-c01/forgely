import { AnthropicProvider } from './anthropic'
import { DeepSeekProvider } from './deepseek'
import { MockLlmProvider } from './mock'
import { QwenProvider } from './qwen'
import { type LlmProvider } from './types'

export * from './types'
export { AnthropicProvider } from './anthropic'
export { DeepSeekProvider } from './deepseek'
export { MockLlmProvider } from './mock'
export { QwenProvider } from './qwen'

export interface ProviderResolveOptions {
  /** Force a specific provider regardless of env. */
  prefer?: 'real' | 'mock' | 'anthropic' | 'deepseek' | 'qwen'
  /** Pre-built mock — useful for tests so you can preload handlers. */
  mock?: MockLlmProvider
  /** Override the env var name (default `ANTHROPIC_API_KEY`). */
  apiKeyVar?: string
}

/**
 * Resolves the right `LlmProvider` for the current environment.
 *
 * Region-aware (docs/PIVOT-CN.md §4):
 *   - `FORGELY_LLM_REGION=cn` (default in 中国 deployment) → DeepSeek > Qwen > Mock
 *   - `FORGELY_LLM_REGION=global` → Anthropic Claude > Mock
 */
export function resolveProvider(opts: ProviderResolveOptions = {}): LlmProvider {
  const region = process.env.FORGELY_LLM_REGION ?? 'cn'
  const force = opts.prefer ?? process.env.FORGELY_AI_PROVIDER ?? null
  const anthropicKey = process.env[opts.apiKeyVar ?? 'ANTHROPIC_API_KEY']
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  const qwenKey = process.env.DASHSCOPE_API_KEY

  if (force === 'mock') return opts.mock ?? new MockLlmProvider()
  if (force === 'real') {
    if (anthropicKey) return new AnthropicProvider({ apiKey: anthropicKey })
    if (deepseekKey) return new DeepSeekProvider({ apiKey: deepseekKey })
    if (qwenKey) return new QwenProvider({ apiKey: qwenKey })
    throw new Error('Real provider requested but no API key is configured.')
  }
  if (force === 'anthropic' && anthropicKey) return new AnthropicProvider({ apiKey: anthropicKey })
  if (force === 'deepseek' && deepseekKey) return new DeepSeekProvider({ apiKey: deepseekKey })
  if (force === 'qwen' && qwenKey) return new QwenProvider({ apiKey: qwenKey })

  if (region === 'cn') {
    if (deepseekKey) return new DeepSeekProvider({ apiKey: deepseekKey })
    if (qwenKey) return new QwenProvider({ apiKey: qwenKey })
    if (anthropicKey) return new AnthropicProvider({ apiKey: anthropicKey })
  } else {
    if (anthropicKey) return new AnthropicProvider({ apiKey: anthropicKey })
    if (deepseekKey) return new DeepSeekProvider({ apiKey: deepseekKey })
    if (qwenKey) return new QwenProvider({ apiKey: qwenKey })
  }

  return opts.mock ?? new MockLlmProvider()
}
