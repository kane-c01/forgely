import type { SelectorBundle } from './vision.js'

export interface ScraperRule {
  hostname: string
  selectors: SelectorBundle
  successRate: number
  lastUsedAt: Date
  createdAt: Date
}

export interface RuleStore {
  findByHostname(hostname: string): Promise<ScraperRule | null>
  save(rule: ScraperRule): Promise<void>
  /**
   * Bump the rule's success rate after a healthy scrape. Implementations
   * SHOULD cap at 1.0 and refresh `lastUsedAt`. Optional — when missing,
   * GenericAIAdapter falls back to an inline `save()` with a +0.02 bump.
   */
  markSuccess?(hostname: string, delta?: number): Promise<void>
  /**
   * Penalise a rule after an extraction failure. Implementations SHOULD
   * floor at 0.0. Rules that drop below the consumer's confidence
   * threshold will simply stop being reused.
   */
  markFailure?(hostname: string, delta?: number): Promise<void>
}

const DEFAULT_SUCCESS_DELTA = 0.02
const DEFAULT_FAILURE_DELTA = 0.05

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export class InMemoryRuleStore implements RuleStore {
  private readonly map = new Map<string, ScraperRule>()

  async findByHostname(hostname: string): Promise<ScraperRule | null> {
    return this.map.get(hostname) ?? null
  }

  async save(rule: ScraperRule): Promise<void> {
    this.map.set(rule.hostname, rule)
  }

  async markSuccess(hostname: string, delta = DEFAULT_SUCCESS_DELTA): Promise<void> {
    const rule = this.map.get(hostname)
    if (!rule) return
    rule.successRate = clamp01(rule.successRate + delta)
    rule.lastUsedAt = new Date()
  }

  async markFailure(hostname: string, delta = DEFAULT_FAILURE_DELTA): Promise<void> {
    const rule = this.map.get(hostname)
    if (!rule) return
    rule.successRate = clamp01(rule.successRate - delta)
    rule.lastUsedAt = new Date()
  }

  size(): number {
    return this.map.size
  }
}
