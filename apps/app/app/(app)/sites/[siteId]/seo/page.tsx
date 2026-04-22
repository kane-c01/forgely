'use client'

/**
 * SEO + GEO Center — site-level page (T30 UI)
 *
 * 三大区:
 *   1. Site-wide health    — sitemap / robots / llms.txt 状态
 *   2. Per-page scores     — DataTable 含 SEO 分数 + 等级 + 关键缺口
 *   3. Recommendations     — 取分数最低 / critical 数最多的页面
 *
 * 数据当前由 client-side `scorePage()` 直接计算 mock pages。
 * Sprint 2 切到 tRPC `seo.scorePages({ siteId })` 后只换数据来源即可。
 */

import { useMemo, useState } from 'react'

import {
  buildLlmsTxt,
  buildRobots,
  buildSitemap,
  scorePage,
  type PageMeta,
  type SeoCheck,
  type SeoScore,
  type SiteMeta,
} from '@forgely/seo'

import { SeoCopilotBridge } from '@/components/copilot/bridges'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'

const GRADE_TONE: Record<SeoScore['grade'], 'success' | 'forge' | 'warning' | 'error'> = {
  A: 'success',
  B: 'success',
  C: 'forge',
  D: 'warning',
  F: 'error',
}

const LEVEL_TONE: Record<SeoCheck['level'], 'success' | 'info' | 'warning' | 'error'> = {
  pass: 'success',
  info: 'info',
  warning: 'warning',
  critical: 'error',
}

interface ScoredPage {
  page: PageMeta
  score: SeoScore
}

function buildDemoSite(siteId: string): { site: SiteMeta; pages: PageMeta[] } {
  const site: SiteMeta = {
    siteId,
    baseUrl: 'https://qiao-coffee.forgely.app',
    brandName: 'Qiao Coffee',
    brandDescription: 'Single-origin pour-overs, AI-roasted in San Francisco.',
    brandLogo: '/logo.svg',
    defaultLocale: 'en',
    siteType: 'storefront',
    social: { instagram: '@qiao.coffee', twitter: '@qiao_coffee' },
  }

  const pages: PageMeta[] = [
    {
      path: '/',
      title: 'Qiao Coffee — Single-origin pour-overs, AI-roasted',
      description:
        'Hand-picked beans, slow-roasted by an AI-tuned profile. Shipped fresh every Friday from San Francisco.',
      h1: 'Qiao Coffee',
      bodyText: 'Q'.repeat(900),
      ogImage: '/og/home.jpg',
      keywords: ['single origin coffee', 'specialty coffee'],
      internalLinks: 8,
      schema: [
        { '@context': 'https://schema.org', '@type': 'Organization' },
        { '@context': 'https://schema.org', '@type': 'WebSite' },
      ],
    },
    {
      path: '/products/ethiopia-yirgacheffe',
      title: 'Ethiopia Yirgacheffe — Floral, citrus',
      description:
        'Bright Ethiopian Yirgacheffe with notes of jasmine, lemon, and bergamot. Roasted yesterday.',
      h1: 'Ethiopia Yirgacheffe',
      bodyText: 'A'.repeat(640),
      ogImage: '/og/yirg.jpg',
      keywords: ['ethiopia yirgacheffe', 'single origin'],
      internalLinks: 5,
      schema: [{ '@context': 'https://schema.org', '@type': 'Product' }],
    },
    {
      path: '/products/colombia-pink-bourbon',
      title: 'Colombia Pink Bourbon',
      description: 'Pink bourbon from Huila.',
      h1: 'Pink Bourbon',
      bodyText: 'short content',
      keywords: ['pink bourbon coffee'],
    },
    {
      path: '/about',
      title: 'About',
      description: 'Our story',
      h1: 'About',
      bodyText: 'B'.repeat(420),
      internalLinks: 3,
    },
    {
      path: '/blog/why-single-origin',
      title: 'Why we only ship single-origin',
      description:
        'Three reasons single-origin coffee captures place, season and process — and why blends erase all of that.',
      h1: 'Why single-origin matters',
      bodyText: 'C'.repeat(1200),
      ogImage: '/og/blog-1.jpg',
      keywords: ['single origin coffee', 'pour over guide'],
      internalLinks: 6,
      schema: [{ '@context': 'https://schema.org', '@type': 'Article' }],
    },
  ]
  return { site, pages }
}

export default function SeoPage({ params }: { params: { siteId: string } }) {
  const t = useT()
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'pass'>('all')

  const { site, pages } = useMemo(() => buildDemoSite(params.siteId), [params.siteId])

  const scored: ScoredPage[] = useMemo(
    () => pages.map((page) => ({ page, score: scorePage(site, page) })),
    [pages, site],
  )

  const aggregate = useMemo(() => {
    const total = scored.reduce((s, p) => s + p.score.score, 0)
    const avg = scored.length === 0 ? 0 : Math.round(total / scored.length)
    const issues = scored.flatMap((p) => p.score.recommendations).length
    const a = scored.filter((p) => p.score.grade === 'A').length
    return { avg, issues, a, total: scored.length }
  }, [scored])

  const filtered = useMemo(() => {
    if (filter === 'all') return scored
    if (filter === 'pass')
      return scored.filter((p) => p.score.grade === 'A' || p.score.grade === 'B')
    return scored.filter((p) => p.score.recommendations.some((c) => c.level === filter))
  }, [scored, filter])

  const sitemapFiles = useMemo(() => buildSitemap(site, pages), [site, pages])
  const robotsTxt = useMemo(() => buildRobots(site, { aiPolicy: 'allow-all' }), [site])
  const llmsTxt = useMemo(
    () => buildLlmsTxt(site, pages, { positioning: site.brandDescription }),
    [site, pages],
  )

  const columns: DataTableColumn<ScoredPage>[] = [
    {
      key: 'page',
      header: t.seo.colPage,
      render: ({ page }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-small text-text-primary">{page.title}</span>
          <code className="text-caption text-text-muted font-mono">{page.path}</code>
        </div>
      ),
    },
    {
      key: 'score',
      header: t.seo.colScore,
      width: '100px',
      align: 'center',
      render: ({ score }) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-h4 text-text-primary">{score.score}</span>
          <Badge tone={GRADE_TONE[score.grade]}>{score.grade}</Badge>
        </div>
      ),
    },
    {
      key: 'wins',
      header: t.seo.colPassing,
      width: '110px',
      align: 'center',
      render: ({ score }) => {
        const passes = score.checks.filter((c) => c.level === 'pass').length
        return (
          <span className="text-small text-text-secondary font-mono">
            {passes} / {score.checks.length}
          </span>
        )
      },
    },
    {
      key: 'gaps',
      header: t.seo.colTopIssues,
      render: ({ score }) =>
        score.recommendations.length === 0 ? (
          <span className="text-small text-text-muted">{t.seo.clean}</span>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {score.recommendations.slice(0, 2).map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <Badge tone={LEVEL_TONE[c.level]}>{c.level}</Badge>
                <span className="text-small text-text-secondary">{c.name}</span>
              </li>
            ))}
            {score.recommendations.length > 2 ? (
              <li className="text-caption text-text-muted">
                +{score.recommendations.length - 2} {t.seo.more}
              </li>
            ) : null}
          </ul>
        ),
    },
    {
      key: 'action',
      header: '',
      width: '160px',
      align: 'right',
      render: () => (
        <Button size="sm" variant="ghost">
          <Icon.Sparkle size={14} />
          {t.seo.aiOptimize}
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <SeoCopilotBridge siteId={params.siteId} />
      <PageHeader
        eyebrow={t.seo.eyebrow}
        title={t.seo.title}
        description={t.seo.description}
        meta={
          <>
            <span>
              {aggregate.total} {t.seo.pagesTracked}
            </span>
            <span>·</span>
            <span>
              {aggregate.issues} {t.seo.openIssues}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Download size={14} />
              {t.seo.downloadArtefacts}
            </Button>
            <Button variant="primary">
              <Icon.Sparkle size={14} />
              {t.seo.rescoreSite}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <BigStat
          label={t.seo.siteSeo}
          value={`${aggregate.avg}/100`}
          hint={`${aggregate.a} ${t.seo.ofTotal} ${aggregate.total} ${t.seo.pagesAtAGrade}`}
        />
        <BigStat
          label={t.seo.sitemap}
          value={
            sitemapFiles.length === 1 ? `1 ${t.seo.file}` : `${sitemapFiles.length} ${t.seo.files}`
          }
          hint={`${pages.length} ${t.seo.urlsIndexed}`}
        />
        <BigStat label="robots.txt" value="OK" hint={t.seo.aiCrawlersAllowed} />
        <BigStat
          label="llms.txt"
          value="OK"
          hint={`${llmsTxt.split('\n').length} ${t.seo.linesGeoReady}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ArtefactCard
          title="sitemap.xml"
          subtitle={`${sitemapFiles[0]?.filename ?? 'sitemap.xml'} · ${t.seo.autoUpdatesOnPublish}`}
          body={sitemapFiles[0]?.content ?? ''}
        />
        <ArtefactCard title="robots.txt" subtitle={t.seo.aiCrawlerPolicyAllow} body={robotsTxt} />
        <ArtefactCard title="llms.txt" subtitle={t.seo.aiSearchContext} body={llmsTxt} />
        <KeywordResearchCard />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-h3 text-text-primary">{t.seo.perPageScores}</h2>
        <FilterPills value={filter} onChange={setFilter} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.page.path}
        empty={<p className="text-text-muted py-8 text-center">{t.seo.noMatch}</p>}
      />
    </div>
  )
}

function BigStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border-border-subtle bg-bg-surface rounded-lg border p-4">
      <div className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
        {label}
      </div>
      <div className="font-display text-h3 text-text-primary mt-1">{value}</div>
      <p className="text-small text-text-secondary mt-1">{hint}</p>
    </div>
  )
}

function ArtefactCard({
  title,
  subtitle,
  body,
}: {
  title: string
  subtitle: string
  body: string
}) {
  const t = useT()
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em]">
            {title}
          </div>
          <p className="text-small text-text-secondary mt-0.5">{subtitle}</p>
        </div>
        <Button size="sm" variant="ghost">
          <Icon.Download size={14} />
          {t.seo.copy}
        </Button>
      </div>
      <pre className="bg-bg-deep text-caption text-text-secondary max-h-48 overflow-auto rounded-md p-3 font-mono">
        {body.slice(0, 1200)}
        {body.length > 1200 ? '\n…' : ''}
      </pre>
    </div>
  )
}

function KeywordResearchCard() {
  const t = useT()
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em]">
            {t.seo.keywordResearch}
          </div>
          <p className="text-small text-text-secondary mt-0.5">{t.seo.poweredBy}</p>
        </div>
        <Badge tone="outline">{t.seo.demoData}</Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {[
          { kw: 'single origin coffee', volume: '49,500', difficulty: 62 },
          { kw: 'pour over coffee guide', volume: '18,100', difficulty: 41 },
          { kw: 'specialty coffee subscription', volume: '12,400', difficulty: 55 },
        ].map((row) => (
          <li
            key={row.kw}
            className="border-border-subtle bg-bg-deep flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span className="text-small text-text-primary">{row.kw}</span>
            <div className="flex items-center gap-3">
              <span className="text-caption text-text-secondary font-mono">vol {row.volume}</span>
              <Badge
                tone={row.difficulty < 50 ? 'success' : row.difficulty < 70 ? 'warning' : 'error'}
              >
                KD {row.difficulty}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost">
        <Icon.Search size={14} />
        {t.seo.runNewQuery}
      </Button>
    </div>
  )
}

function FilterPills({
  value,
  onChange,
}: {
  value: 'all' | 'critical' | 'warning' | 'pass'
  onChange: (v: 'all' | 'critical' | 'warning' | 'pass') => void
}) {
  const t = useT()
  const items: Array<{ id: 'all' | 'critical' | 'warning' | 'pass'; label: string }> = [
    { id: 'all', label: t.seo.all },
    { id: 'critical', label: t.seo.critical },
    { id: 'warning', label: t.seo.warningsFilter },
    { id: 'pass', label: t.seo.passingFilter },
  ]
  return (
    <div className="border-border-subtle bg-bg-surface flex items-center gap-1 rounded-md border p-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            'text-caption rounded px-3 py-1 font-mono uppercase tracking-[0.08em] transition-colors',
            value === item.id
              ? 'bg-forge-orange/20 text-forge-amber'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
