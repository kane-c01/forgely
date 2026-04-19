import { Button } from '@forgely/ui'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-caption uppercase tracking-[0.2em] text-forge-amber">
        @forgely/storefront · :3002
      </span>
      <h1 className="max-w-4xl font-display text-display leading-[1.05] tracking-tight">
        A storefront forged by Forgely.
      </h1>
      <p className="max-w-2xl text-body-lg text-text-secondary">
        Tenant-driven content will render here.
      </p>
      <div className="flex gap-3">
        <Button>Start Forging</Button>
        <Button variant="ghost">Learn more</Button>
      </div>
    </main>
  )
}
