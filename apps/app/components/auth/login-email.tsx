'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginEmail() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const submit = async () => {
    if (!email.includes('@') || password.length < 8) {
      setError('请输入有效邮箱和至少 8 位密码')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/trpc/auth.login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { email, password } }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt.slice(0, 120) || '登录失败')
      }
      router.push('/dashboard')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">邮箱</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@brand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="h-12 rounded-md border border-border-strong bg-bg-deep px-4 text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40 disabled:opacity-60"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">密码</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="至少 8 位"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          className="h-12 rounded-md border border-border-strong bg-bg-deep px-4 text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40 disabled:opacity-60"
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
        className="h-12 rounded-md bg-forge-orange px-6 font-medium text-bg-void shadow-elevated transition-colors hover:bg-forge-amber disabled:opacity-60"
      >
        {busy ? '登录中…' : '登录'}
      </button>
      <a href="/signup" className="text-center text-small text-text-muted hover:text-forge-amber">
        还没账号？注册 →
      </a>
    </div>
  )
}
