'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userName: string | null
}

const CATEGORIES: Array<{ id: string; label: string; emoji: string }> = [
  { id: 'apparel', label: '服饰 / 鞋包', emoji: '👕' },
  { id: 'beauty', label: '美妆 / 护肤', emoji: '💄' },
  { id: 'electronics', label: '3C / 电子', emoji: '🔌' },
  { id: 'home', label: '家居 / 百货', emoji: '🛋️' },
  { id: 'food', label: '食品 / 饮料', emoji: '🍜' },
  { id: 'health', label: '健康 / 保健', emoji: '💊' },
  { id: 'sports', label: '运动 / 户外', emoji: '⛰️' },
  { id: 'other', label: '其他', emoji: '📦' },
]

const MARKETS: Array<{ id: string; label: string; flag: string }> = [
  { id: 'US', label: '美国', flag: '🇺🇸' },
  { id: 'EU', label: '欧盟', flag: '🇪🇺' },
  { id: 'UK', label: '英国', flag: '🇬🇧' },
  { id: 'CA', label: '加拿大', flag: '🇨🇦' },
  { id: 'AU', label: '澳大利亚', flag: '🇦🇺' },
  { id: 'JP', label: '日本', flag: '🇯🇵' },
  { id: 'KR', label: '韩国', flag: '🇰🇷' },
  { id: 'SEA', label: '东南亚', flag: '🌏' },
]

export function OnboardingForm({ userName }: Props) {
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState<string>('')
  const [markets, setMarkets] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const toggleMarket = (id: string) => {
    setMarkets((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const submit = async () => {
    setError(null)
    if (companyName.trim().length < 2) {
      setError('公司名至少 2 个字符')
      return
    }
    if (!category) {
      setError('请选一个经营类目')
      return
    }
    if (markets.length === 0) {
      setError('至少选一个目标市场')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          businessCategory: category,
          targetMarkets: markets,
        }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok: boolean
        message?: string
        creditsGranted?: number
      } | null
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? '保存失败')
      }
      router.push('/dashboard?welcome=1')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border-border-strong bg-bg-elevated/80 shadow-elevated space-y-8 rounded-2xl border p-8 backdrop-blur-md">
      {userName ? (
        <p className="text-small text-text-muted">
          嗨，<span className="text-text-primary">{userName}</span>，我们开始吧。
        </p>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
          公司 / 品牌名
        </span>
        <input
          type="text"
          placeholder="e.g. Forgely 工坊"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          maxLength={80}
          disabled={busy}
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 rounded-md border px-4 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
          经营类目
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((c) => {
            const active = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                disabled={busy}
                className={[
                  'text-small flex flex-col items-start gap-1 rounded-md border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-forge-orange bg-forge-orange/10 text-text-primary shadow-subtle'
                    : 'border-border-subtle bg-bg-deep text-text-secondary hover:border-border-strong hover:text-text-primary',
                ].join(' ')}
              >
                <span className="text-lg">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
          目标市场（可多选）
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MARKETS.map((m) => {
            const active = markets.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMarket(m.id)}
                disabled={busy}
                className={[
                  'text-small flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-forge-orange bg-forge-orange/10 text-text-primary shadow-subtle'
                    : 'border-border-subtle bg-bg-deep text-text-secondary hover:border-border-strong hover:text-text-primary',
                ].join(' ')}
              >
                <span className="text-lg">{m.flag}</span>
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-small text-error">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="bg-forge-orange text-bg-void shadow-elevated hover:bg-forge-amber h-12 w-full rounded-md px-6 font-medium transition-colors disabled:opacity-60"
      >
        {busy ? '保存中…' : '完成 —— 领取 100 积分 →'}
      </button>
      <p className="text-caption text-text-muted">
        稍后可在{' '}
        <a href="/settings" className="text-forge-amber hover:underline">
          设置
        </a>{' '}
        中修改。
      </p>
    </section>
  )
}
