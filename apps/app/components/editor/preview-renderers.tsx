'use client'

import { cn } from '@/lib/cn'
import type { ThemeBlock } from '@/lib/types'

/**
 * Cheap, dependency-free preview of a SiteDSL block.
 *
 * NOT the real storefront renderer (that lives in `apps/storefront`) —
 * this is the in-editor faithful-enough preview so designers can see the
 * effect of changing props in real time. The look is intentionally
 * "warm storefront" to contrast with the dark Cinematic Industrial app
 * shell.
 */

interface BlockPreviewProps {
  block: ThemeBlock
  selected?: boolean
  onClick?: () => void
}

export function BlockPreview({ block, selected, onClick }: BlockPreviewProps) {
  if (!block.visible) return null
  return (
    <section
      onClick={onClick}
      className={cn(
        'relative cursor-pointer transition-all',
        selected && 'ring-2 ring-forge-orange shadow-[0_0_24px_rgba(255,107,26,0.3)]',
      )}
    >
      {selected ? (
        <span className="absolute -top-3 left-3 z-10 rounded-md bg-forge-orange px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-bg-void">
          {block.type}
        </span>
      ) : null}
      {render(block)}
    </section>
  )
}

function render(b: ThemeBlock) {
  const p = b.props as Record<string, unknown>
  switch (b.type) {
    case 'hero':
      return (
        <div className="relative flex min-h-[420px] items-center overflow-hidden bg-[#1A140F] px-12 py-20">
          <span className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#FFD166]/30 blur-3xl" />
          <span className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#C74A0A]/40 blur-3xl" />
          <div
            className={cn(
              'relative z-10 flex max-w-3xl flex-col gap-4',
              p.alignment === 'center' && 'mx-auto items-center text-center',
              p.alignment === 'right' && 'ml-auto items-end text-right',
            )}
          >
            {typeof p.eyebrow === 'string' ? (
              <span className="rounded-full border border-[#FFD166]/40 bg-[#FFD166]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#FFD166]">
                {p.eyebrow}
              </span>
            ) : null}
            <h1 className="font-display text-[56px] leading-[1.04] text-[#F5EDE0]">
              {(p.headline as string) ?? 'Headline'}
            </h1>
            {typeof p.subhead === 'string' ? (
              <p className="max-w-xl text-[#C7B7A2]">{p.subhead}</p>
            ) : null}
            <div className="mt-2 flex gap-3">
              {typeof p.ctaPrimary === 'string' ? (
                <button className="rounded-md bg-[#C74A0A] px-5 py-2.5 font-medium text-[#F5EDE0] shadow-[0_0_24px_rgba(199,74,10,0.4)]">
                  {p.ctaPrimary}
                </button>
              ) : null}
              {typeof p.ctaSecondary === 'string' ? (
                <button className="rounded-md border border-[#C7B7A2]/30 px-5 py-2.5 text-[#C7B7A2]">
                  {p.ctaSecondary}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )

    case 'value-props':
      return (
        <div className="bg-[#F5EDE0] px-12 py-16 text-[#1A1410]">
          <h2 className="mb-10 text-center font-display text-[40px] leading-tight">
            {(p.headline as string) ?? 'Value props'}
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {((p.items as Array<{ icon: string; title: string; body: string }>) ?? []).map((it, i) => (
              <div key={i} className="rounded-lg border border-[#C7B7A2]/30 bg-white/60 p-5">
                <span className="text-3xl">{it.icon}</span>
                <h3 className="mt-3 font-heading text-h3">{it.title}</h3>
                <p className="mt-1 text-small text-[#5C4F40]">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'product-grid':
      return (
        <div className="bg-[#F8F0E2] px-12 py-16 text-[#1A1410]">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-[36px] leading-tight">
                {(p.headline as string) ?? 'Featured'}
              </h2>
              <span className="font-mono text-caption uppercase tracking-[0.18em] text-[#5C4F40]">
                {String(p.collection ?? '')}
              </span>
            </div>
            <div className={cn('grid gap-4', p.columns === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
              {Array.from({ length: Math.min(Number(p.limit ?? 6), 6) }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-md border border-[#C7B7A2]/40 bg-white">
                  <div className="grid aspect-[4/5] place-items-center bg-[#EFE2CB] text-5xl">
                    ☕
                  </div>
                  <div className="p-3">
                    <p className="text-small font-medium">Product {i + 1}</p>
                    <p className="font-mono text-caption text-[#5C4F40]">$24</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'testimonials':
      return (
        <div className="bg-[#F5EDE0] px-12 py-16 text-[#1A1410]">
          <h2 className="mb-10 text-center font-display text-[36px]">
            {(p.headline as string) ?? 'Testimonials'}
          </h2>
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              { name: 'Alice', text: 'The morning ritual I never knew I needed.' },
              { name: 'Daniel', text: 'Best decaf I have had — clean, crisp, complete.' },
              { name: 'Mei', text: 'I subscribe and never run out. 10/10.' },
            ].map((t) => (
              <div key={t.name} className="rounded-lg bg-white p-5 shadow-[0_4px_18px_rgba(26,20,16,0.06)]">
                <p className="text-small text-[#1A1410]">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-3 font-mono text-caption text-[#5C4F40]">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'rich-text':
      return (
        <div className="bg-[#F5EDE0] px-12 py-16 text-[#1A1410]">
          <div className="mx-auto max-w-2xl space-y-3 text-body">
            <p>
              {typeof p.body === 'string' && p.body.length > 5
                ? (p.body as string)
                : 'A small studio in Kyoto. Started Qiao because morning coffee deserves better than a vacuum brick. We work with two farms — only.'}
            </p>
            <p>Every bag is roasted on Tuesday and shipped Wednesday. Never older than 7 days.</p>
          </div>
        </div>
      )

    case 'newsletter':
      return (
        <div className="bg-[#1A140F] px-12 py-16 text-[#F5EDE0]">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <h2 className="font-display text-[36px] leading-tight">
              {(p.headline as string) ?? 'Stay in the loop'}
            </h2>
            <p className="text-[#C7B7A2]">{(p.subhead as string) ?? 'New drops, monthly.'}</p>
            <div className="mt-2 flex w-full max-w-sm items-center gap-2">
              <input
                placeholder="you@example.com"
                className="flex-1 rounded-md border border-[#C7B7A2]/30 bg-transparent px-3 py-2 text-small text-[#F5EDE0] placeholder:text-[#C7B7A2]/60"
              />
              <button className="rounded-md bg-[#C74A0A] px-4 py-2 font-medium text-[#F5EDE0]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )

    case 'footer':
      return (
        <div className="bg-[#0F0B07] px-12 py-12 text-[#C7B7A2]">
          <div
            className={cn('mx-auto grid max-w-5xl gap-8', p.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4')}
          >
            {Array.from({ length: Number(p.columns ?? 4) }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <p className="font-mono text-caption uppercase tracking-[0.18em] text-[#FFD166]">
                  Column {i + 1}
                </p>
                <p className="text-small">About</p>
                <p className="text-small">Press</p>
                <p className="text-small">Contact</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center font-mono text-caption text-[#5C4F40]">
            © Qiao Coffee · Forged with Forgely
          </p>
        </div>
      )
  }
}
