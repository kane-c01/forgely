'use client'

import { useState } from 'react'

import { useCopilot, useCopilotContext } from '@/components/copilot/copilot-provider'
import { Swatch } from '@/components/brand-kit/swatch'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icons'
import { brandKits } from '@/lib/mocks'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import type { BrandKit } from '@/lib/types'

export default function BrandKitsPage() {
  const [activeId, setActiveId] = useState<string>(brandKits[0]!.id)
  const active = brandKits.find((b) => b.id === activeId) ?? brandKits[0]!
  useCopilotContext({ kind: 'brand-kit', brandKitId: active.id })
  const copilot = useCopilot()
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Brand"
        title="Brand kits"
        description="The single source of truth for your visual & verbal identity. Forge auto-applies your kit to every page on every site."
        actions={
          <>
            <Button variant="ghost">
              <Icon.Upload size={14} /> Upload logo
            </Button>
            <Button>
              <Icon.Plus size={14} /> New brand kit
            </Button>
          </>
        }
        meta={
          <>
            <span>kits</span>
            <span className="tabular-nums text-text-secondary">{brandKits.length}</span>
            <span>·</span>
            <span>last updated</span>
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
                'flex items-center gap-3 rounded-lg border bg-bg-surface p-3 text-left transition-colors',
                kit.id === activeId
                  ? 'border-forge-orange/50 shadow-[0_0_24px_rgba(255,107,26,0.12)]'
                  : 'border-border-subtle hover:border-border-strong',
              )}
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-md text-h2"
                style={{ backgroundColor: kit.colors.primary, color: kit.colors.bg }}
                aria-hidden
              >
                {kit.logo.primary}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-heading text-body text-text-primary">{kit.name}</span>
                <span className="font-mono text-caption text-text-muted">
                  {kit.fonts.heading.family.split(',')[0]} · {kit.colors.primary}
                </span>
              </span>
              {kit.id === activeId ? <Icon.Check size={14} className="text-forge-amber" /> : null}
            </button>
          ))}
        </aside>

        <div className="flex flex-col gap-4">
          <KitDetail kit={active} onAskCopilot={(prompt) => {
            copilot.setOpen(true)
            void copilot.send(prompt)
          }} />
        </div>
      </div>
    </div>
  )
}

function KitDetail({ kit, onAskCopilot }: { kit: BrandKit; onAskCopilot: (prompt: string) => void }) {
  return (
    <>
      {/* Logo + variants */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <Button size="xs" variant="ghost" onClick={() => onAskCopilot('Generate 3 logo variants in a different style.')}>
            <Icon.Sparkle size={12} /> Generate variants
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <LogoTile label="Primary" emoji={kit.logo.primary} bg={kit.colors.bg} fg={kit.colors.fg} />
            <LogoTile label="Light bg" emoji={kit.logo.variants.light} bg="#FFFFFF" fg={kit.colors.fg} />
            <LogoTile label="Dark bg" emoji={kit.logo.variants.dark} bg="#08080A" fg="#F4F4F7" />
            <LogoTile label="Favicon" emoji={kit.logo.variants.favicon} bg={kit.colors.primary} fg={kit.colors.bg} small />
            <LogoTile label="OG image" emoji={kit.logo.variants.ogImage} bg={kit.colors.secondary} fg={kit.colors.bg} />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <Button size="xs" variant="ghost" onClick={() => onAskCopilot('Make the palette warmer.')}>
            <Icon.Sparkle size={12} /> Suggest a shift
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Swatch label="Primary" color={kit.colors.primary} large />
            <Swatch label="Secondary" color={kit.colors.secondary} />
            <Swatch label="Accent" color={kit.colors.accent} />
            <Swatch label="Background" color={kit.colors.bg} />
            <Swatch label="Foreground" color={kit.colors.fg} />
            <Swatch label="Muted" color={kit.colors.muted} />
            <Swatch label="Success" color={kit.colors.semantic.success} />
            <Swatch label="Error" color={kit.colors.semantic.error} />
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <Button size="xs" variant="ghost" onClick={() => onAskCopilot('Suggest a body font that pairs with the heading.')}>
            <Icon.Sparkle size={12} /> Suggest pairings
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FontSpec role="Heading" font={kit.fonts.heading} sample="A morning worth waking up for." />
          <FontSpec role="Body" font={kit.fonts.body} sample="Single-origin beans, pulled at dawn, shipped within 7 days of roast." />
          {kit.fonts.display ? (
            <FontSpec role="Display" font={kit.fonts.display} sample="FORGED." />
          ) : null}
        </CardContent>
      </Card>

      {/* Voice */}
      <Card>
        <CardHeader>
          <CardTitle>Voice</CardTitle>
          <Button size="xs" variant="ghost" onClick={() => onAskCopilot('Generate 3 sample taglines in this voice.')}>
            <Icon.Sparkle size={12} /> Generate samples
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-small">
          <Row label="Tone">
            {kit.voice.tone.map((t) => (
              <Badge key={t} tone="forge">
                {t}
              </Badge>
            ))}
          </Row>
          <Row label="Keywords">
            {kit.voice.keywords.map((k) => (
              <Badge key={k} tone="outline">
                {k}
              </Badge>
            ))}
          </Row>
          <Row label="Avoid">
            {kit.voice.avoidWords.map((k) => (
              <Badge key={k} tone="error">
                {k}
              </Badge>
            ))}
          </Row>
          <div>
            <p className="mb-2 font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
              Sample phrases
            </p>
            <ul className="flex flex-col gap-1.5 text-small text-text-primary">
              {kit.voice.samplePhrases.map((p) => (
                <li key={p} className="rounded-md border border-border-subtle bg-bg-deep px-3 py-2">
                  &ldquo;{p}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image style</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 text-small">
          <Stat label="Mood">
            {kit.imageStyle.mood.map((m) => (
              <Badge key={m} tone="outline">
                {m}
              </Badge>
            ))}
          </Stat>
          <Stat label="Color grading">
            <span className="font-mono text-text-secondary">{kit.imageStyle.colorGrading}</span>
          </Stat>
          <Stat label="Composition">
            <span className="font-mono text-text-secondary">{kit.imageStyle.composition}</span>
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
        className="grid aspect-square place-items-center rounded-md border border-border-subtle"
        style={{ backgroundColor: bg, color: fg }}
      >
        <span aria-hidden style={{ fontSize: small ? 28 : 56 }}>
          {emoji}
        </span>
      </span>
      <span className="font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
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
    <div className="rounded-md border border-border-subtle bg-bg-deep p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-caption uppercase tracking-[0.12em] text-text-muted">{role}</span>
        <span className="font-mono text-caption text-text-secondary">
          {font.family} · {font.source} · {font.weights.join('/')}
        </span>
      </div>
      <p className="font-display text-h2 leading-tight text-text-primary">{sample}</p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      <span className="flex flex-wrap gap-1.5">{children}</span>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-caption uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}
