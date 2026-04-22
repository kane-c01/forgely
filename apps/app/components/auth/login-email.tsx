'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginEmail() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams?.get('next') ?? null

  const submit = async () => {
    if (!email.includes('@') || password.length < 8) {
      setError('请输入有效邮箱和至少 8 位密码')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok: boolean
        redirectTo?: string
        message?: string
      } | null
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? '登录失败')
      }
      const dest = nextParam ?? data.redirectTo ?? '/dashboard'
      router.push(dest)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
          邮箱
        </span>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@brand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 rounded-md border px-4 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
          密码
        </span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="至少 8 位"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 rounded-md border px-4 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </label>
      {error ? (
        <p role="alert" className="text-small text-error">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="bg-forge-orange text-bg-void shadow-elevated hover:bg-forge-amber h-12 rounded-md px-6 font-medium transition-colors disabled:opacity-60"
      >
        {busy ? '登录中…' : '登录'}
      </button>
      <a href="/signup" className="text-small text-text-muted hover:text-forge-amber text-center">
        还没账号？注册 →
      </a>
    </div>
  )
}
