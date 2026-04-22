'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignupEmail() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const submit = async () => {
    if (name.trim().length < 1) {
      setError('请填写您的称呼')
      return
    }
    if (!email.includes('@')) {
      setError('请输入有效邮箱')
      return
    }
    if (password.length < 8) {
      setError('密码至少 8 位')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/trpc/auth.signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { email, password, name } }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt.slice(0, 160) || '注册失败')
      }
      router.push('/onboarding')
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
          称呼
        </span>
        <input
          type="text"
          autoComplete="name"
          placeholder="王老板 / Jane Chen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 rounded-md border px-4 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </label>
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
          autoComplete="new-password"
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
        {busy ? '创建中…' : '创建账号'}
      </button>
    </div>
  )
}
