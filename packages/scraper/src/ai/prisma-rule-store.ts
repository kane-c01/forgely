import type { RuleStore, ScraperRule } from './rule-store.js'
import type { SelectorBundle } from './vision.js'

/**
 * Structural Prisma type — captures *only* the surface we need so the
 * scraper package never imports `@prisma/client` directly. The real client
 * (or any compatible mock in tests) can be supplied by the consumer.
 *
 * Mirrors the `ScraperRule` model from services/api/prisma/schema.prisma.
 */
export interface PrismaScraperRuleDelegate {
  findUnique(args: { where: { hostname: string } }): Promise<PrismaScraperRuleRow | null>
  upsert(args: {
    where: { hostname: string }
    create: PrismaScraperRuleRow
    update: Partial<PrismaScraperRuleRow>
  }): Promise<PrismaScraperRuleRow>
  update(args: {
    where: { hostname: string }
    data: Partial<PrismaScraperRuleRow>
  }): Promise<PrismaScraperRuleRow>
}

export interface PrismaScraperRuleRow {
  id?: string
  hostname: string
  selectors: unknown
  successRate: number
  lastUsedAt: Date
  createdAt: Date
  updatedAt?: Date
}

export interface PrismaLikeClient {
  scraperRule: PrismaScraperRuleDelegate
}

export interface PrismaRuleStoreOptions {
  client: PrismaLikeClient
  /** Default +Δ for `markSuccess`. Default 0.02. */
  successDelta?: number
  /** Default −Δ for `markFailure`. Default 0.05. */
  failureDelta?: number
}

const DEFAULT_SUCCESS_DELTA = 0.02
const DEFAULT_FAILURE_DELTA = 0.05

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/**
 * Postgres-backed `RuleStore` for production. The store is structural over
 * Prisma's generated client, so the scraper package keeps its
 * Worker/Lambda-friendly install footprint.
 */
export class PrismaRuleStore implements RuleStore {
  private readonly client: PrismaLikeClient
  private readonly successDelta: number
  private readonly failureDelta: number

  constructor(options: PrismaRuleStoreOptions) {
    this.client = options.client
    this.successDelta = options.successDelta ?? DEFAULT_SUCCESS_DELTA
    this.failureDelta = options.failureDelta ?? DEFAULT_FAILURE_DELTA
  }

  async findByHostname(hostname: string): Promise<ScraperRule | null> {
    const row = await this.client.scraperRule.findUnique({ where: { hostname } })
    if (!row) return null
    return rowToRule(row)
  }

  async save(rule: ScraperRule): Promise<void> {
    const data: PrismaScraperRuleRow = {
      hostname: rule.hostname,
      selectors: rule.selectors,
      successRate: clamp01(rule.successRate),
      lastUsedAt: rule.lastUsedAt,
      createdAt: rule.createdAt,
    }
    await this.client.scraperRule.upsert({
      where: { hostname: rule.hostname },
      create: data,
      update: {
        selectors: data.selectors,
        successRate: data.successRate,
        lastUsedAt: data.lastUsedAt,
      },
    })
  }

  async markSuccess(hostname: string, delta = this.successDelta): Promise<void> {
    const row = await this.client.scraperRule.findUnique({ where: { hostname } })
    if (!row) return
    await this.client.scraperRule.update({
      where: { hostname },
      data: {
        successRate: clamp01(row.successRate + delta),
        lastUsedAt: new Date(),
      },
    })
  }

  async markFailure(hostname: string, delta = this.failureDelta): Promise<void> {
    const row = await this.client.scraperRule.findUnique({ where: { hostname } })
    if (!row) return
    await this.client.scraperRule.update({
      where: { hostname },
      data: {
        successRate: clamp01(row.successRate - delta),
        lastUsedAt: new Date(),
      },
    })
  }
}

function rowToRule(row: PrismaScraperRuleRow): ScraperRule {
  return {
    hostname: row.hostname,
    selectors: row.selectors as SelectorBundle,
    successRate: row.successRate,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
  }
}
