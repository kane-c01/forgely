/**
 * DataForSEO 关键词研究客户端
 *
 * 仅做关键词数据获取（搜索量 / CPC / 难度 / SERP 竞品）。
 *
 * 设计要点:
 * - 通过 fetch 实现，无需 SDK
 * - 通过 DI 注入 fetcher，便于测试
 * - 内置 in-memory cache（同一 keyword 重复查直接返回）
 * - 错误以 typed error 抛出，便于上层 fallback
 */

export interface KeywordIdea {
  keyword: string
  searchVolume: number
  cpc?: number
  competition?: number
  difficulty?: number
}

export interface SerpCompetitor {
  rank: number
  url: string
  title: string
  description: string
  domain: string
}

export interface KeywordResearchResult {
  keyword: string
  location: string
  language: string
  ideas: KeywordIdea[]
  serp?: SerpCompetitor[]
}

export interface DataForSeoConfig {
  /** Basic-auth login (DataForSEO 提供) */
  login: string
  password: string
  /** 默认 location_name (US) */
  location?: string
  /** 默认 language_code (en) */
  language?: string
  /** override fetch (test) */
  fetcher?: typeof fetch
  /** override base URL (test) */
  baseUrl?: string
  /** 本地缓存（默认 24h，0 关闭） */
  cacheTtlMs?: number
}

export class DataForSeoError extends Error {
  override readonly name = 'DataForSeoError'
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export class DataForSeoClient {
  private readonly cache = new Map<string, { at: number; data: KeywordResearchResult }>()

  constructor(private readonly config: DataForSeoConfig) {}

  static create(config: DataForSeoConfig): DataForSeoClient {
    return new DataForSeoClient(config)
  }

  async research(keyword: string, opts: { location?: string; language?: string; includeSerp?: boolean } = {}): Promise<KeywordResearchResult> {
    const location = opts.location ?? this.config.location ?? 'United States'
    const language = opts.language ?? this.config.language ?? 'en'
    const cacheKey = `${keyword}::${location}::${language}::${opts.includeSerp ? '1' : '0'}`

    const ttl = this.config.cacheTtlMs ?? 24 * 60 * 60 * 1000
    const hit = this.cache.get(cacheKey)
    if (hit && ttl > 0 && Date.now() - hit.at < ttl) return hit.data

    const ideas = await this.fetchIdeas(keyword, location, language)
    let serp: SerpCompetitor[] | undefined
    if (opts.includeSerp) serp = await this.fetchSerp(keyword, location, language)

    const result: KeywordResearchResult = { keyword, location, language, ideas, serp }
    if (ttl > 0) this.cache.set(cacheKey, { at: Date.now(), data: result })
    return result
  }

  private async fetchIdeas(keyword: string, location: string, language: string): Promise<KeywordIdea[]> {
    const data = await this.post('/keywords_data/google_ads/keywords_for_keywords/live', [
      { keywords: [keyword], location_name: location, language_code: language },
    ])
    const tasks = data?.tasks?.[0]?.result ?? []
    return (tasks as RawIdea[]).map((row) => ({
      keyword: row.keyword,
      searchVolume: row.search_volume ?? 0,
      cpc: row.cpc,
      competition: row.competition,
    }))
  }

  private async fetchSerp(keyword: string, location: string, language: string): Promise<SerpCompetitor[]> {
    const data = await this.post('/serp/google/organic/live/regular', [
      { keyword, location_name: location, language_code: language },
    ])
    const result = data?.tasks?.[0]?.result as Array<{ items?: RawSerpItem[] }> | undefined
    const items = result?.[0]?.items ?? []
    return items.slice(0, 10).map((item) => ({
      rank: item.rank_absolute,
      url: item.url,
      title: item.title,
      description: item.description ?? '',
      domain: item.domain,
    }))
  }

  private async post(path: string, body: unknown): Promise<DataForSeoResponse> {
    const url = `${this.config.baseUrl ?? 'https://api.dataforseo.com/v3'}${path}`
    const fetcher = this.config.fetcher ?? fetch
    const auth = btoa(`${this.config.login}:${this.config.password}`)
    let res: Response
    try {
      res = await fetcher(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (e) {
      throw new DataForSeoError(`Network error: ${(e as Error).message}`, 'NETWORK_ERROR')
    }
    if (!res.ok) {
      throw new DataForSeoError(`HTTP ${res.status}`, 'HTTP_ERROR', res.status)
    }
    const data = (await res.json()) as DataForSeoResponse
    if (data.status_code && data.status_code >= 40000) {
      throw new DataForSeoError(data.status_message ?? 'API error', 'API_ERROR', data.status_code)
    }
    return data
  }
}

interface DataForSeoResponse {
  status_code?: number
  status_message?: string
  tasks?: Array<{ result?: unknown }>
}

interface RawIdea {
  keyword: string
  search_volume?: number
  cpc?: number
  competition?: number
}

interface RawSerpItem {
  rank_absolute: number
  url: string
  title: string
  description?: string
  domain: string
}
