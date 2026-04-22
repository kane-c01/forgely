'use client'

import { useState } from 'react'

import { useCopilot, useCopilotContext } from '@/components/copilot/copilot-provider'
import { Swatch } from '@/components/brand-kit/swatch'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { brandKits } from '@/lib/mocks'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import type { BrandKit } from '@/lib/types'

export default function BrandKitsPage() {
  const [activeId, setActiveId] = useState<string>(brandKits[0]!.id)
  const active = brandKits.find((b) => b.id === activeId) ?? brandKits[0]!
  useCopilotContext({ kind: 'brand-kit', brandKitId: active.id })
  const copilot = useCopilot()
  const t = useT()
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow={t.brandKits.eyebrow}
        title={t.brandKits.title}
        description={t.brandKits.description}
        actions={
          <>
            <Button variant="ghost">
              <Icon.Upload size={14} /> {t.brandKits.uploadLogo}
            </Button>
            <Button>
              <Icon.Plus size={14} /> {t.brandKits.newBrandKit}
            </Button>
          </>
        }
        meta={
          <>
            <span>{t.brandKits.kits}</span>
            <span className="text-text-secondary tabular-nums">{brandKits.length}</span>
            <span>·</span>
            <span>{t.brandKits.lastUpdated}</span>
            <span className="text-text-secondary">{formatDateTime(active.updatedAt)}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Kit list */}
        <aside className="flex flex-col gap-2">
          {brandKits.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => setActiveId(kit.id)}
              className={cn(
                'bg-bg-surface flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                kit.id === activeId
                  ? 'border-forge-orange/50 shadow-[0_0_24px_rgba(255,107,26,0.12)]'
                  : 'border-border-subtle hover:border-border-strong',
              )}
            >
              <span
                className="text-h2 grid h-12 w-12 place-items-center rounded-md"
                style={{ backgroundColor: kit.colors.primary, color: kit.colors.bg }}
                aria-hidden
              >
                {kit.logo.primary}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-heading text-body text-text-primary">{kit.name}</span>
                <span className="text-caption text-text-muted font-mono">
                  {kit.fonts.heading.family.split(',')[0]} · {kit.colors.primary}
                </span>
              </span>
              {kit.id === activeId ? <Icon.Check size={14} className="text-forge-amber" /> : null}
            </button>
          ))}
        </aside>

        <div className="flex flex-col gap-4">
          <KitDetail
            kit={active}
            t={t}
            onAskCopilot={(prompt) => {
              copilot.setOpen(true)
              void copilot.send(prompt)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function KitDetail({
  kit,
  t,
  onAskCopilot,
}: {
  kit: BrandKit
  t: ReturnType<typeof useT>
  onAskCopilot: (prompt: string) => void
}) {
  return (
    <>
      {/* Logo + variants */}
      <Card>
        <CardHeader>
          <CardTitle>{t.brandKits.logo}</CardTitle>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onAskCopilot('Generate 3 logo variants in a different style.')}
          >
            <Icon.Sparkle size={12} /> {t.brandKits.generateVariants}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <LogoTile
              label={t.brandKits.primary}
              emoji={kit.logo.primary}
              bg={kit.colors.bg}
              fg={kit.colors.fg}
            />
            <LogoTile
              label={t.brandKits.lightBg}
              emoji={kit.logo.variants.light}
              bg="#FFFFFF"
              fg={kit.colors.fg}
            />
            <LogoTile
              label={t.brandKits.darkBg}
              emoji={kit.logo.variants.dark}
              bg="#08080A"
              fg="#F4F4F7"
            />
            <LogoTile
              label={t.brandKits.favicon}
              emoji={kit.logo.variants.favicon}
              bg={kit.colors.primary}
              fg={kit.colors.bg}
              small
            />
            <LogoTile
              label={t.brandKits.ogImage}
              emoji={kit.logo.variants.ogImage}
              bg={kit.colors.secondary}
              fg={kit.colors.bg}
            />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>{t.brandKits.colors}</CardTitle>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onAskCopilot('Make the palette warmer.')}
          >
            <Icon.Sparkle size={12} /> {t.brandKits.suggestShift}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Swatch label={t.brandKits.primary} color={kit.colors.primary} large />
            <Swatch label={t.brandKits.secondary} color={kit.colors.secondary} />
            <Swatch label={t.brandKits.accent} color={kit.colors.accent} />
            <Swatch label={t.brandKits.background} color={kit.colors.bg} />
            <Swatch label={t.brandKits.foreground} color={kit.colors.fg} />
            <Swatch label={t.brandKits.muted} color={kit.colors.muted} />
            <Swatch label={t.brandKits.success} color={kit.colors.semantic.success} />
            <Swatch label={t.brandKits.error} color={kit.colors.semantic.error} />
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle>{t.brandKits.typography}</CardTitle>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onAskCopilot('Suggest a body font that pairs with the heading.')}
          >
            <Icon.Sparkle size={12} /> {t.brandKits.suggestPairings}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FontSpec
            role="Heading"
            font={kit.fonts.heading}
            sample="A morning worth waking up for."
          />
          <FontSpec
            role="Body"
            font={kit.fonts.body}
            sample="Single-origin beans, pulled at dawn, shipped within 7 days of roast."
          />
          {kit.fonts.display ? (
            <FontSpec role="Display" font={kit.fonts.display} sample="FORGED." />
          ) : null}
        </CardContent>
      </Card>

      {/* Voice */}
      <Card>
        <CardHeader>
          <CardTitle>{t.brandKits.voice}</CardTitle>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onAskCopilot('Generate 3 sample taglines in this voice.')}
          >
            <Icon.Sparkle size={12} /> {t.brandKits.generateSamples}
          </Button>
        </CardHeader>
        <CardContent className="text-small flex flex-col gap-3">
          <Row label={t.brandKits.tone}>
            {kit.voice.tone.map((v) => (
              <Badge key={v} tone="forge">
                {v}
              </Badge>
            ))}
          </Row>
          <Row label={t.brandKits.keywords}>
            {kit.voice.keywords.map((k) => (
              <Badge key={k} tone="outline">
                {k}
              </Badge>
            ))}
          </Row>
          <Row label={t.brandKits.avoid}>
            {kit.voice.avoidWords.map((k) => (
              <Badge key={k} tone="error">
                {k}
              </Badge>
            ))}
          </Row>
          <div>
            <p className="text-caption text-text-muted mb-2 font-mono uppercase tracking-[0.12em]">
              {t.brandKits.samplePhrases}
            </p>
            <ul className="text-small text-text-primary flex flex-col gap-1.5">
              {kit.voice.samplePhrases.map((p) => (
                <li key={p} className="border-border-subtle bg-bg-deep rounded-md border px-3 py-2">
                  &ldquo;{p}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.brandKits.imageStyle}</CardTitle>
        </CardHeader>
        <CardContent className="text-small grid grid-cols-3 gap-3">
          <Stat label={t.brandKits.mood}>
            {kit.imageStyle.mood.map((m) => (
              <Badge key={m} tone="outline">
                {m}
              </Badge>
            ))}
          </Stat>
          <Stat label={t.brandKits.colorGrading}>
            <span className="text-text-secondary font-mono">{kit.imageStyle.colorGrading}</span>
          </Stat>
          <Stat label={t.brandKits.composition}>
            <span className="text-text-secondary font-mono">{kit.imageStyle.composition}</span>
          </Stat>
        </CardContent>
      </Card>
    </>
  )
}

function LogoTile({
  label,
  emoji,
  bg,
  fg,
  small,
}: {
  label: string
  emoji: string
  bg: string
  fg: string
  small?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="border-border-subtle grid aspect-square place-items-center rounded-md border"
        style={{ backgroundColor: bg, color: fg }}
      >
        <span aria-hidden style={{ fontSize: small ? 28 : 56 }}>
          {emoji}
        </span>
      </span>
      <span className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
        {label}
      </span>
    </div>
  )
}

function FontSpec({
  role,
  font,
  sample,
}: {
  role: string
  font: { family: string; weights: number[]; source: string }
  sample: string
}) {
  return (
    <div className="border-border-subtle bg-bg-deep rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">
          {role}
        </span>
        <span className="text-caption text-text-secondary font-mono">
          {font.family} · {font.source} · {font.weights.join('/')}
        </span>
      </div>
      <p className="font-display text-h2 text-text-primary leading-tight">{sample}</p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption text-text-muted w-20 font-mono uppercase tracking-[0.12em]">
        {label}
      </span>
      <span className="flex flex-wrap gap-1.5">{children}</span>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}
