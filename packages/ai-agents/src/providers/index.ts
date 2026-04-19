import { AnthropicProvider } from './anthropic'
import { MockLlmProvider } from './mock'
import { type LlmProvider } from './types'

export * from './types'
export { AnthropicProvider } from './anthropic'
export { MockLlmProvider } from './mock'

export interface ProviderResolveOptions {
  /** Force a specific provider regardless of env. */
  prefer?: 'real' | 'mock'
  /** Pre-built mock — useful for tests so you can preload handlers. */
  mock?: MockLlmProvider
  /** Override the env var name (default `ANTHROPIC_API_KEY`). */
  apiKeyVar?: string
}

/**
 * Resolves the right `LlmProvider` for the current environment.
 *
 * Order:
 *   1. `opts.prefer === 'mock'` → always use the mock.
 *   2. `opts.prefer === 'real'` + no API key → throw.
 *   3. `FORGELY_AI_PROVIDER=mock` env var → mock.
 *   4. `ANTHROPIC_API_KEY` set → real provider.
 *   5. Fallback → mock (so CI / dev without key still runs).
 */
export function resolveProvider(opts: ProviderResolveOptions = {}): LlmProvider {
  const apiKeyVar = opts.apiKeyVar ?? 'ANTHROPIC_API_KEY'
  const apiKey = process.env[apiKeyVar]
  const envForce = process.env.FORGELY_AI_PROVIDER

  if (opts.prefer === 'mock') return opts.mock ?? new MockLlmProvider()
  if (opts.prefer === 'real') {
    if (!apiKey) throw new Error(`Real provider requested but ${apiKeyVar} is not set.`)
    return new AnthropicProvider({ apiKey })
  }
  if (envForce === 'mock') return opts.mock ?? new MockLlmProvider()
  if (apiKey) return new AnthropicProvider({ apiKey })
  return opts.mock ?? new MockLlmProvider()
}
