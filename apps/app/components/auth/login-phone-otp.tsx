'use client'

/**
 * LoginPhoneOtp — 手机号 + 6 位验证码登录。
 *
 * 通过 /api/auth/phone/send 和 /api/auth/phone/login 完成登录链路：
 *  - send：返回 {mock, expiresAt}。mock=true 时前端展示 "测试验证码 123456"。
 *  - login：成功后 Set-Cookie 已由后端写好，这里只做 redirect。
 *
 * @owner W6 — CN auth
 */
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Stage = 'phone' | 'code'

interface SendResponse {
  ok: boolean
  mock?: boolean
  expiresAt?: string
  resendAvailableAt?: string
  code?: string
  message?: string
  details?: { retryAfter?: number }
}

interface LoginResponse {
  ok: boolean
  userId?: string
  isNewUser?: boolean
  needsOnboarding?: boolean
  redirectTo?: '/onboarding' | '/dashboard'
  code?: string
  message?: string
}

export function LoginPhoneOtp() {
  const [stage, setStage] = useState<Stage>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [mockMode, setMockMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams?.get('next') ?? null

  useEffect(
    () => () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    },
    [],
  )

  const startCountdown = (seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    let s = seconds
    setResendIn(s)
    countdownRef.current = setInterval(() => {
      s -= 1
      setResendIn(s)
      if (s <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }, 1000)
  }

  const requestOtp = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的中国大陆手机号')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      })
      const data = (await res.json()) as SendResponse
      if (!res.ok || !data.ok) {
        const waitS = data.details?.retryAfter
        const msg = data.message ?? (waitS ? `请 ${waitS} 秒后重试` : '发送失败，请稍后重试')
        throw new Error(msg)
      }
      setStage('code')
      setMockMode(!!data.mock)
      startCountdown(60)
    } catch (err) {
      setError((err as Error).message)
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
      const res = await fetch('/api/auth/phone/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = (await res.json()) as LoginResponse
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? '登录失败')
      }
      const dest = nextParam ?? data.redirectTo ?? '/dashboard'
      router.push(dest)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
          手机号
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={11}
          placeholder="138 0000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          disabled={stage === 'code' || busy}
          className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 rounded-md border px-4 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </label>

      {stage === 'code' ? (
        <label className="flex flex-col gap-2">
          <span className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
            验证码
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6 位数字"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            disabled={busy}
            className="border-border-strong bg-bg-deep text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 rounded-md border px-4 tracking-[0.4em] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
          />
          {mockMode ? (
            <span className="text-caption text-forge-amber">
              ⚡ DEV MOCK —— 验证码固定为{' '}
              <code className="bg-bg-elevated rounded px-1.5 py-0.5 font-mono text-[11px] tracking-widest">
                123456
              </code>
              （生产环境配置 ALIYUN_SMS_ACCESS_KEY 后走真实短信）
            </span>
          ) : null}
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
          className="bg-forge-orange text-bg-void shadow-elevated hover:bg-forge-amber h-12 rounded-md px-6 font-medium transition-colors disabled:opacity-60"
        >
          {busy ? '发送中…' : '发送验证码'}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setStage('phone')
              setCode('')
              setError(null)
            }}
            disabled={busy}
            className="border-border-strong bg-bg-elevated text-text-secondary hover:text-text-primary h-12 rounded-md border transition-colors disabled:opacity-60"
          >
            重输手机号
          </button>
          <button
            type="button"
            onClick={submitCode}
            disabled={busy}
            className="bg-forge-orange text-bg-void shadow-elevated hover:bg-forge-amber h-12 rounded-md px-6 font-medium transition-colors disabled:opacity-60"
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
          className="text-small text-text-muted hover:text-forge-amber transition-colors disabled:opacity-50"
        >
          {resendIn > 0 ? `${resendIn}s 后可重发` : '重新发送验证码'}
        </button>
      ) : null}
    </div>
  )
}
