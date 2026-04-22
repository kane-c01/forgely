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

import { requireConfirmed, useRegisterCopilotTool } from '@/components/copilot/copilot-provider'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const SEVERITY_TONE: Record<Severity, 'error' | 'warning' | 'info'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
}

const VERDICT_LABEL: Record<
  'pass' | 'warning' | 'fail',
  { label: string; tone: 'success' | 'warning' | 'error'; helper: string }
> = {
  pass: {
    label: 'Ready to deploy',
    tone: 'success',
    helper: 'No critical findings — green light for the deployer.',
  },
  warning: {
    label: 'Optional improvements',
    tone: 'warning',
    helper: 'No blockers, but several findings would improve trust + reach.',
  },
  fail: {
    label: 'Deployment blocked',
    tone: 'error',
    helper: 'Resolve every critical finding before the next deploy run.',
  },
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

  // W5: wire Copilot tool calls on this page to the live compliance
  // helpers. `runRules` is pure so the re-run is free; we return the
  // verdict breakdown as a compact JSON string so the Copilot drawer
  // can echo it back to the user.
  useRegisterCopilotTool('run_compliance_check', (args) => {
    const subset =
      typeof args.region === 'string' && args.region !== 'all'
        ? {
            ...content,
            regions: [args.region] as ComplianceContent['regions'],
          }
        : content
    const fresh = runRules(subset)
    return JSON.stringify({
      verdict: fresh.overall,
      total: fresh.findings.length,
      critical: fresh.findings.filter((f) => f.severity === 'critical').length,
      warning: fresh.findings.filter((f) => f.severity === 'warning').length,
      info: fresh.findings.filter((f) => f.severity === 'info').length,
    })
  })

  useRegisterCopilotTool('apply_compliance_fix', (args) => {
    const gate = requireConfirmed(args, 'apply_compliance_fix')
    if (gate) return gate
    const location = args.location as string | undefined
    const candidates = location
      ? report.findings.filter((f) => f.location === location && f.autoFixable)
      : report.findings.filter((f) => f.autoFixable)
    if (candidates.length === 0) return '没有可一键修复的项。'
    let patched = 0
    for (const f of candidates) {
      const item = content.items.find((i) => i.path === f.location)
      if (!item) continue
      const sub = applyAutoFix([item], { ...report, findings: [f] })
      if (sub.patches.length > 0) {
        patched += 1
        setResolvedRules((prev) => new Set(prev).add(f.rule + '@' + f.location))
      }
    }
    return `已自动修复 ${patched} 条发现，剩 ${report.findings.length - patched} 条需要人工复核。`
  })

  const columns: DataTableColumn<ComplianceFinding>[] = [
    {
      key: 'severity',
      header: 'Severity',
      width: '110px',
      render: (f) => <Badge tone={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>,
    },
    {
      key: 'region',
      header: 'Region',
      width: '130px',
      render: (f) => <Badge tone="outline">{f.region}</Badge>,
    },
    {
      key: 'rule',
      header: 'Rule',
      render: (f) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-caption text-text-muted font-mono">{f.rule}</span>
          <span className="text-small text-text-primary">{f.ruleName}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      width: '230px',
      render: (f) => (
        <code className="bg-bg-deep text-caption text-forge-amber block break-all rounded px-1.5 py-0.5 font-mono">
          {f.location}
        </code>
      ),
    },
    {
      key: 'snippet',
      header: 'Content',
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
            Auto-fix
          </Button>
        ) : (
          <Button size="sm" variant="ghost">
            <Icon.Sparkle size={14} />
            AI rewrite
          </Button>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Compliance"
        title="Compliance center"
        description="Every site goes through a 9-step legal review (FTC / FDA / GDPR / Prop 65 / CPSIA / DSA / ASA / CASL + category rules) before it ships."
        meta={
          <>
            <span>schema {report.schemaVersion}</span>
            <span>·</span>
            <span>
              {report.findings.length} findings · {report.durationMs}ms
            </span>
            <span>·</span>
            <span>{ALL_RULES.length} rules active</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.History size={14} />
              History
            </Button>
            <Button variant="primary">
              <Icon.Sparkle size={14} />
              Re-run review
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <VerdictCard
          tone={verdict.tone}
          eyebrow="Overall verdict"
          value={verdict.label}
          helper={verdict.helper}
        />
        <MetricCard
          label="Critical"
          value={report.mustFix}
          tone="error"
          hint="must be resolved before deploy"
        />
        <MetricCard
          label="Warnings"
          value={report.shouldFix}
          tone="warning"
          hint="recommended but not blocking"
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
            <p className="text-body">No findings match the current filters.</p>
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
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Icon.Filter size={14} />
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
          Filter
        </span>
      </div>
      <Select
        value={region}
        onChange={(v) => onRegion(v as 'all' | Region)}
        options={[
          { value: 'all', label: 'All regions' },
          ...REGIONS.map((r) => ({ value: r, label: r })),
        ]}
      />
      <Select
        value={severity}
        onChange={(v) => onSeverity(v as 'all' | Severity)}
        options={[
          { value: 'all', label: 'All severities' },
          { value: 'critical', label: 'Critical' },
          { value: 'warning', label: 'Warning' },
          { value: 'info', label: 'Info' },
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
