'use client'

/**
 * Compliance Center — site-level page (T29 UI)
 *
 * MASTER.md §15.4 处理流程的可视化:
 *   - 顶部判定卡（pass / warning / fail）
 *   - 区域 + 严重度筛选
 *   - findings 表（含 AI 一键修复 / Rewrite 按钮）
 *
 * 数据当前是 client-side 通过 `runRules()` 跑 mock content 现算的。
 * Sprint 2 切到 tRPC `compliance.check({ siteId })` 后只换 useMemo 来源即可。
 */

import { useMemo, useState } from 'react'

import {
  ALL_RULES,
  applyAutoFix,
  runRules,
  type ComplianceContent,
  type ComplianceFinding,
  type Region,
  type Severity,
} from '@forgely/compliance'

import { ComplianceCopilotBridge } from '@/components/copilot/bridges'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'

const SEVERITY_TONE: Record<Severity, 'error' | 'warning' | 'info'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
}

function useVerdictLabel() {
  const t = useT()
  return {
    pass: {
      label: t.compliance.readyToDeploy,
      tone: 'success' as const,
      helper: t.compliance.readyToDeployHelper,
    },
    warning: {
      label: t.compliance.optionalImprovements,
      tone: 'warning' as const,
      helper: t.compliance.optionalImprovementsHelper,
    },
    fail: {
      label: t.compliance.deploymentBlocked,
      tone: 'error' as const,
      helper: t.compliance.deploymentBlockedHelper,
    },
  }
}

const REGIONS: Region[] = [
  'US-FTC',
  'US-FDA',
  'US-COPPA',
  'US-CPSIA',
  'US-CA-PROP65',
  'EU-GDPR',
  'EU-DSA',
  'EU-CE',
  'UK-ASA',
  'CA-CASL',
]

/* ----------------------- Mock review payload ---------------------- *
 * Demonstrates 4 of the most common findings types. Swap with real
 * tRPC data once available.
 */
function buildDemoContent(siteId: string): ComplianceContent {
  return {
    siteId,
    regions: ['US-FTC', 'US-FDA', 'EU-GDPR', 'UK-ASA', 'GLOBAL'],
    category: 'supplements',
    items: [
      {
        path: 'product.calm-blend.description',
        type: 'product-description',
        text: 'Our Calm Blend cures anxiety in just 7 days. 100% safe, no side effects, doctor recommended.',
      },
      {
        path: 'product.glow-cream.description',
        type: 'product-description',
        text: 'A botanical face cream that reverses aging and removes wrinkles permanently.',
      },
      {
        path: 'page.home.hero.headline',
        type: 'hero-headline',
        text: "The world's best eco-friendly skincare. Lifetime guarantee.",
      },
      {
        path: 'page.signup.cta',
        type: 'cta',
        text: 'Subscribe to our newsletter for exclusive deals!',
      },
    ],
  }
}

export default function CompliancePage({ params }: { params: { siteId: string } }) {
  const t = useT()
  const VERDICT_LABEL = useVerdictLabel()
  const [regionFilter, setRegionFilter] = useState<'all' | Region>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all')
  const [resolvedRules, setResolvedRules] = useState<Set<string>>(new Set())

  const content = useMemo(() => buildDemoContent(params.siteId), [params.siteId])
  const report = useMemo(() => runRules(content), [content])

  const filtered = useMemo(() => {
    return report.findings
      .filter((f) => !resolvedRules.has(f.rule + '@' + f.location))
      .filter((f) => regionFilter === 'all' || f.region === regionFilter)
      .filter((f) => severityFilter === 'all' || f.severity === severityFilter)
  }, [report.findings, regionFilter, severityFilter, resolvedRules])

  const verdict = VERDICT_LABEL[report.overall]

  function applySingleFix(f: ComplianceFinding) {
    const item = content.items.find((i) => i.path === f.location)
    if (!item) return
    const sub = applyAutoFix([item], { ...report, findings: [f] })
    if (sub.patches.length > 0) {
      setResolvedRules((prev) => new Set(prev).add(f.rule + '@' + f.location))
    }
  }

  const columns: DataTableColumn<ComplianceFinding>[] = [
    {
      key: 'severity',
      header: t.compliance.colSeverity,
      width: '110px',
      render: (f) => <Badge tone={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>,
    },
    {
      key: 'region',
      header: t.compliance.colRegion,
      width: '130px',
      render: (f) => <Badge tone="outline">{f.region}</Badge>,
    },
    {
      key: 'rule',
      header: t.compliance.colRule,
      render: (f) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-caption text-text-muted font-mono">{f.rule}</span>
          <span className="text-small text-text-primary">{f.ruleName}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: t.compliance.colLocation,
      width: '230px',
      render: (f) => (
        <code className="bg-bg-deep text-caption text-forge-amber block break-all rounded px-1.5 py-0.5 font-mono">
          {f.location}
        </code>
      ),
    },
    {
      key: 'snippet',
      header: t.compliance.colContent,
      render: (f) => (
        <p className="text-small text-text-secondary line-clamp-2">
          “{f.content.trim().slice(0, 180)}
          {f.content.length > 180 ? '…' : ''}”
        </p>
      ),
    },
    {
      key: 'action',
      header: '',
      width: '180px',
      align: 'right',
      render: (f) =>
        f.autoFixable ? (
          <Button size="sm" variant="primary" onClick={() => applySingleFix(f)}>
            <Icon.Check size={14} />
            {t.compliance.autoFix}
          </Button>
        ) : (
          <Button size="sm" variant="ghost">
            <Icon.Sparkle size={14} />
            {t.compliance.aiRewrite}
          </Button>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <ComplianceCopilotBridge siteId={params.siteId} />
      <PageHeader
        eyebrow={t.compliance.eyebrow}
        title={t.compliance.title}
        description={t.compliance.description}
        meta={
          <>
            <span>schema {report.schemaVersion}</span>
            <span>·</span>
            <span>
              {report.findings.length} {t.compliance.findings} · {report.durationMs}ms
            </span>
            <span>·</span>
            <span>
              {ALL_RULES.length} {t.compliance.rulesActive}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.History size={14} />
              {t.compliance.history}
            </Button>
            <Button variant="primary">
              <Icon.Sparkle size={14} />
              {t.compliance.rerunReview}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <VerdictCard
          tone={verdict.tone}
          eyebrow={t.compliance.overallVerdict}
          value={verdict.label}
          helper={verdict.helper}
        />
        <MetricCard
          label={t.compliance.critical}
          value={report.mustFix}
          tone="error"
          hint={t.compliance.mustResolve}
        />
        <MetricCard
          label={t.compliance.warnings}
          value={report.shouldFix}
          tone="warning"
          hint={t.compliance.recommendedNotBlocking}
        />
      </div>

      <FilterBar
        region={regionFilter}
        onRegion={setRegionFilter}
        severity={severityFilter}
        onSeverity={setSeverityFilter}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(f) => `${f.rule}@${f.location}`}
        empty={
          <div className="text-text-muted flex flex-col items-center justify-center gap-2 py-8">
            <Icon.Check size={28} />
            <p className="text-body">{t.compliance.noFindings}</p>
          </div>
        }
      />
    </div>
  )
}

function VerdictCard({
  tone,
  eyebrow,
  value,
  helper,
}: {
  tone: 'success' | 'warning' | 'error'
  eyebrow: string
  value: string
  helper: string
}) {
  const accent: Record<typeof tone, string> = {
    success: 'border-success/40 bg-success/10',
    warning: 'border-warning/40 bg-warning/10',
    error: 'border-error/40 bg-error/10',
  }
  return (
    <div className={cn('rounded-lg border p-4', accent[tone])}>
      <div className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
        {eyebrow}
      </div>
      <div className="font-display text-h3 text-text-primary mt-1">{value}</div>
      <p className="text-small text-text-secondary mt-1">{helper}</p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string
  value: number
  tone: 'error' | 'warning' | 'info'
  hint: string
}) {
  return (
    <div className="border-border-subtle bg-bg-surface rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
          {label}
        </span>
        <Badge tone={tone}>{value}</Badge>
      </div>
      <div className="font-display text-h3 text-text-primary mt-1">{value}</div>
      <p className="text-small text-text-secondary mt-1">{hint}</p>
    </div>
  )
}

function FilterBar({
  region,
  onRegion,
  severity,
  onSeverity,
}: {
  region: 'all' | Region
  onRegion: (r: 'all' | Region) => void
  severity: 'all' | Severity
  onSeverity: (s: 'all' | Severity) => void
}) {
  const t = useT()
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Icon.Filter size={14} />
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
          {t.compliance.filter}
        </span>
      </div>
      <Select
        value={region}
        onChange={(v) => onRegion(v as 'all' | Region)}
        options={[
          { value: 'all', label: t.compliance.allRegions },
          ...REGIONS.map((r) => ({ value: r, label: r })),
        ]}
      />
      <Select
        value={severity}
        onChange={(v) => onSeverity(v as 'all' | Severity)}
        options={[
          { value: 'all', label: t.compliance.allSeverities },
          { value: 'critical', label: t.compliance.critical },
          { value: 'warning', label: t.compliance.warning },
          { value: 'info', label: t.compliance.info },
        ]}
      />
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-border-subtle bg-bg-deep text-caption text-text-primary focus:border-forge-orange rounded-md border px-2.5 py-1.5 font-mono uppercase tracking-[0.08em] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
