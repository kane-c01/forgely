'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'phone' | 'code'

export function LoginPhoneOtp() {
  const [stage, setStage] = useState<Stage>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const router = useRouter()

  const requestOtp = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的中国大陆手机号')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/trpc/cnAuth.requestOtp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { phone, purpose: 'login' } }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text.slice(0, 120) || '发送验证码失败')
      }
      setStage('code')
      let s = 60
      setResendIn(s)
      const timer = setInterval(() => {
        s -= 1
        setResendIn(s)
        if (s <= 0) clearInterval(timer)
      }, 1000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位验证码')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/trpc/cnAuth.loginWithPhoneOtp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { phone, code } }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text.slice(0, 120) || '登录失败')
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
        <span className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">手机号</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={11}
          placeholder="138 0000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          disabled={stage === 'code' || busy}
          className="h-12 rounded-md border border-border-strong bg-bg-deep px-4 text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40 disabled:opacity-60"
        />
      </label>

      {stage === 'code' ? (
        <label className="flex flex-col gap-2">
          <span className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">验证码</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6 位数字"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            disabled={busy}
            className="h-12 rounded-md border border-border-strong bg-bg-deep px-4 text-body tracking-[0.4em] text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40 disabled:opacity-60"
          />
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-small text-error">
          {error}
        </p>
      ) : null}

      {stage === 'phone' ? (
        <button
          type="button"
          onClick={requestOtp}
          disabled={busy}
          className="h-12 rounded-md bg-forge-orange px-6 font-medium text-bg-void shadow-elevated transition-colors hover:bg-forge-amber disabled:opacity-60"
        >
          {busy ? '发送中…' : '发送验证码'}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStage('phone')}
            disabled={busy}
            className="h-12 rounded-md border border-border-strong bg-bg-elevated text-text-secondary transition-colors hover:text-text-primary"
          >
            重输手机号
          </button>
          <button
            type="button"
            onClick={submitCode}
            disabled={busy}
            className="h-12 rounded-md bg-forge-orange px-6 font-medium text-bg-void shadow-elevated transition-colors hover:bg-forge-amber disabled:opacity-60"
          >
            {busy ? '登录中…' : '登录'}
          </button>
        </div>
      )}

      {stage === 'code' ? (
        <button
          type="button"
          onClick={requestOtp}
          disabled={resendIn > 0 || busy}
          className="text-small text-text-muted transition-colors hover:text-forge-amber disabled:opacity-50"
        >
          {resendIn > 0 ? `${resendIn}s 后可重发` : '重新发送验证码'}
        </button>
      ) : null}
    </div>
  )
}
