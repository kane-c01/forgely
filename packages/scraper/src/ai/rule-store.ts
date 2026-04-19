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
}

export class InMemoryRuleStore implements RuleStore {
  private readonly map = new Map<string, ScraperRule>()

  async findByHostname(hostname: string): Promise<ScraperRule | null> {
    return this.map.get(hostname) ?? null
  }

  async save(rule: ScraperRule): Promise<void> {
    this.map.set(rule.hostname, rule)
  }

  size(): number {
    return this.map.size
  }
}
