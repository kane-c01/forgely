'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { slug: 'apparel', label: '服装鞋帽' },
  { slug: 'beauty', label: '美妆护肤' },
  { slug: 'food', label: '食品饮料' },
  { slug: 'home', label: '家居家具' },
  { slug: 'baby', label: '母婴亲子' },
  { slug: 'electronics', label: '数码电子' },
  { slug: 'outdoor', label: '户外运动' },
  { slug: 'pet', label: '宠物用品' },
  { slug: 'jewelry', label: '珠宝饰品' },
  { slug: 'health', label: '健康保健' },
  { slug: 'toy', label: '玩具娱乐' },
  { slug: 'other', label: '其他' },
]

const MARKETS = [
  { code: 'US', label: '美国 (USD)' },
  { code: 'GB', label: '英国 (GBP)' },
  { code: 'DE', label: '德国 (EUR)' },
  { code: 'FR', label: '法国 (EUR)' },
  { code: 'JP', label: '日本 (JPY)' },
  { code: 'KR', label: '韩国 (KRW)' },
  { code: 'AU', label: '澳洲 (AUD)' },
  { code: 'CA', label: '加拿大 (CAD)' },
  { code: 'SG', label: '新加坡 (SGD)' },
  { code: 'AE', label: '阿联酋 (AED)' },
  { code: 'MX', label: '墨西哥 (MXN)' },
  { code: 'BR', label: '巴西 (BRL)' },
]

export function OnboardingForm() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState<string>('apparel')
  const [markets, setMarkets] = useState<Set<string>>(new Set(['US']))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleMarket = (code: string) => {
    setMarkets((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const submit = async () => {
    if (companyName.trim().length < 1) {
      setError('请填写公司/品牌名称')
      return
    }
    if (markets.size === 0) {
      setError('至少选择一个目标市场')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/trpc/auth.completeOnboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          json: {
            companyName: companyName.trim(),
            businessCategory: category,
            targetMarkets: Array.from(markets),
          },
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt.slice(0, 160) || '提交失败')
      }
      router.push('/dashboard')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-border-strong bg-bg-elevated/60 shadow-elevated flex flex-col gap-8 rounded-2xl border p-8 backdrop-blur-md">
      <Field label="公司 / 品牌名" hint="会出现在你生成的站点上，用户后续可以在 Brand Kit 里修改。">
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="例如：青果咖啡 Qiao Coffee"
          disabled={busy}
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 w-full rounded-md border px-4 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </Field>

      <Field label="经营类目" hint="AI 会根据类目选择对应的视觉 DNA、文案语气、合规规则。">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const active = c.slug === category
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                disabled={busy}
                className={[
                  'text-small rounded-md border px-3 py-2 transition-colors',
                  active
                    ? 'border-forge-orange bg-forge-orange/10 text-forge-amber'
                    : 'border-border-subtle bg-bg-deep text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="目标市场（可多选）" hint="我们会按市场推荐默认货币、站点语言、合规规则。">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MARKETS.map((m) => {
            const active = markets.has(m.code)
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => toggleMarket(m.code)}
                disabled={busy}
                className={[
                  'text-small rounded-md border px-3 py-2 transition-colors',
                  active
                    ? 'border-forge-orange bg-forge-orange/10 text-forge-amber'
                    : 'border-border-subtle bg-bg-deep text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </Field>

      {error ? (
        <p role="alert" className="text-small text-error">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-caption text-text-muted">
          提交后立即到账 <span className="text-forge-amber">100 积分</span>（gift），
          可在账户页看到。
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="bg-forge-orange text-bg-void shadow-elevated hover:bg-forge-amber h-12 rounded-md px-8 font-medium transition-colors disabled:opacity-60"
        >
          {busy ? '保存中…' : '开始使用 Forgely →'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">{label}</p>
        <p className="text-caption text-text-muted mt-1">{hint}</p>
      </div>
      {children}
    </div>
  )
}
