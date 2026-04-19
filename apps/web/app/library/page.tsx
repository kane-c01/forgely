import Link from 'next/link'
import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Brand Library',
  description:
    '10 Visual DNAs × 10 Product Moments — the building blocks every Forgely site is composed from.',
  path: '/library',
  noIndex: true,
})

const dnas = [
  { id: '01', name: 'Kyoto Ceramic', vibe: '暖白 · 晨光 · 留白' },
  { id: '02', name: 'Clinical Wellness', vibe: '深色 · 金 · 精准' },
  { id: '03', name: 'Playful Pop', vibe: '高饱和 · 快 · 动感' },
  { id: '04', name: 'Nordic Minimal', vibe: '冷白 · 极简 · 自然光' },
  { id: '05', name: 'Tech Precision', vibe: '冷 · 金属 · 硬光' },
  { id: '06', name: 'Editorial Fashion', vibe: '胶片 · 电影 · 慢' },
  { id: '07', name: 'Organic Garden', vibe: '绿 · 自然 · 柔' },
  { id: '08', name: 'Neon Night', vibe: '霓虹 · 深色 · 动感' },
  { id: '09', name: 'California Wellness', vibe: '阳光 · 暖金 · 自然' },
  { id: '10', name: 'Bold Rebellious', vibe: '高对比 · 故意粗糙' },
]

const moments = [
  { id: 'M01', name: 'Liquid Bath' },
  { id: 'M02', name: 'Levitation' },
  { id: 'M03', name: 'Light Sweep' },
  { id: 'M04', name: 'Breathing Still' },
  { id: 'M05', name: 'Droplet Ripple' },
  { id: 'M06', name: 'Mist Emergence' },
  { id: 'M07', name: 'Fabric Drape' },
  { id: 'M08', name: 'Ingredient Ballet' },
  { id: 'M09', name: 'Surface Interaction' },
  { id: 'M10', name: 'Environmental Embed' },
]

export default function LibraryPage() {
  return (
    <StaticPageShell
      eyebrow="Brand library"
      title="100 brand looks, before you even open the editor."
      intro="10 Visual DNAs × 10 Product Moments combine into 100 fully-coherent base looks. Forgely picks the right combo for your products; you can override it any time."
    >
      <h2>Visual DNA presets</h2>
      <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3">
        {dnas.map((d) => (
          <article key={d.id} className="border-border-strong bg-bg-deep rounded-xl border p-4">
            <div className="text-caption text-forge-orange flex items-center justify-between font-mono uppercase tracking-[0.2em]">
              <span>{d.id}</span>
              <span className="text-text-muted">DNA</span>
            </div>
            <p className="font-display text-body-lg text-text-primary mt-2 font-light">{d.name}</p>
            <p className="text-caption text-text-muted mt-1">{d.vibe}</p>
          </article>
        ))}
      </div>

      <h2>Product Moment templates</h2>
      <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3">
        {moments.map((m) => (
          <article key={m.id} className="border-border-strong bg-bg-deep rounded-xl border p-4">
            <div className="text-caption text-forge-orange font-mono uppercase tracking-[0.2em]">
              {m.id}
            </div>
            <p className="font-display text-body-lg text-text-primary mt-2 font-light">{m.name}</p>
          </article>
        ))}
      </div>

      <p className="!mt-12">
        Want to see them moving? The cinematic preview lives at{' '}
        <Link href="/the-forge/full">/the-forge/full</Link>.
      </p>
    </StaticPageShell>
  )
}
