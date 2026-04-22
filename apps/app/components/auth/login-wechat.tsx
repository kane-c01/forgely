'use client'

/**
 * LoginWechat — 微信扫码登录组件。
 *
 * 流程：
 *   1. mount → POST /api/auth/wechat/start → {state, url, mock}
 *   2. 渲染 QR：
 *      - mock：本地 SVG 占位 + "DEV MOCK 自动登录中" 文案
 *      - prod：iframe 嵌入微信开放平台 qrconnect 页（渲染真实 QR）
 *   3. 每 2s GET /api/auth/wechat/claim?state=...
 *      - waiting → 继续轮询
 *      - success → session cookie 已由后端写好 → router.push(redirectTo)
 *      - expired/error → 展示错误 + "重试"
 *
 * @owner W6 — CN auth
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Stage = 'loading' | 'waiting' | 'success' | 'expired' | 'error'

interface StartResponse {
  ok: boolean
  state: string
  url: string
  mock: boolean
  configured: boolean
  pollEverySeconds: number
}

interface ClaimResponse {
  status: Stage | 'waiting'
  redirectTo?: '/onboarding' | '/dashboard'
  isNewUser?: boolean
  mock?: boolean
  error?: string
}

export function LoginWechat() {
  const [stage, setStage] = useState<Stage>('loading')
  const [startData, setStartData] = useState<StartResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') ?? null

  const clearPoll = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }

  const startLogin = useCallback(async () => {
    clearPoll()
    setStage('loading')
    setError(null)
    try {
      const res = await fetch('/api/auth/wechat/start', { method: 'POST' })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = (await res.json()) as StartResponse
      if (!data.ok) throw new Error('启动失败')
      setStartData(data)
      setStage('waiting')
    } catch (err) {
      setStage('error')
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    void startLogin()
    return clearPoll
  }, [startLogin])

  useEffect(() => {
    if (stage !== 'waiting' || !startData) return
    const intervalMs = Math.max(1000, startData.pollEverySeconds * 1000)
    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/auth/wechat/claim?state=${encodeURIComponent(startData.state)}`,
        )
        if (!res.ok) return
        const data = (await res.json()) as ClaimResponse
        if (data.status === 'success' && data.redirectTo) {
          clearPoll()
          setStage('success')
          const dest = next ?? data.redirectTo
          router.push(dest)
          router.refresh()
        } else if (data.status === 'expired' || data.status === 'error') {
          clearPoll()
          setStage(data.status)
          setError(data.error ?? '扫码已超时，请重试。')
        }
      } catch {
        // 静默 —— 下一轮再试
      }
    }, intervalMs)
    return clearPoll
  }, [stage, startData, router, next])

  return (
    <div className="border-border-subtle bg-bg-deep flex flex-col items-center gap-4 rounded-md border p-6">
      {stage === 'loading' ? (
        <div className="border-border-strong bg-bg-elevated text-caption text-text-muted grid h-48 w-48 place-items-center rounded-md border">
          正在生成二维码…
        </div>
      ) : null}

      {stage === 'waiting' && startData?.mock ? (
        <MockQrPlaceholder state={startData.state} />
      ) : null}
      {stage === 'waiting' && startData && !startData.mock ? (
        <WechatQrFrame url={startData.url} />
      ) : null}

      {stage === 'success' ? (
        <div className="border-success bg-bg-elevated text-small text-success grid h-48 w-48 place-items-center rounded-md border">
          ✓ 扫码成功，跳转中…
        </div>
      ) : null}

      {stage === 'expired' || stage === 'error' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="border-error/70 bg-bg-elevated text-small text-error grid h-48 w-48 place-items-center rounded-md border">
            {stage === 'expired' ? '二维码已过期' : '扫码失败'}
          </div>
          <button
            type="button"
            onClick={startLogin}
            className="bg-forge-orange text-small text-bg-void hover:bg-forge-amber h-10 rounded-md px-6 font-medium"
          >
            重新生成
          </button>
        </div>
      ) : null}

      {error && stage === 'error' ? (
        <p role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : null}

      {startData?.mock ? (
        <p className="text-caption text-text-muted">
          ⚡ DEV MOCK —— 2 秒后自动&ldquo;扫码成功&rdquo;。生产环境请配置
          <code className="bg-bg-elevated text-forge-amber mx-1 rounded px-1 text-[11px]">
            WECHAT_OPEN_APP_ID
          </code>
          /
          <code className="bg-bg-elevated text-forge-amber mx-1 rounded px-1 text-[11px]">
            WECHAT_OPEN_APP_SECRET
          </code>
          。
        </p>
      ) : (
        <p className="text-caption text-text-muted">用微信扫一扫授权登录 Forgely。</p>
      )}
    </div>
  )
}

function WechatQrFrame({ url }: { url: string }) {
  return (
    <iframe
      title="微信扫码登录"
      src={url}
      sandbox="allow-scripts allow-top-navigation allow-same-origin"
      className="border-border-strong h-64 w-64 rounded-md border bg-white"
    />
  )
}

function MockQrPlaceholder({ state }: { state: string }) {
  // 根据 state 生成 10×10 的伪 QR 图案，视觉效果"像"二维码但不是真的。
  const cells = generatePseudoCells(state, 15)
  return (
    <div className="relative">
      <svg
        viewBox="0 0 15 15"
        className="border-border-strong h-48 w-48 rounded-md border bg-white"
        role="img"
        aria-label="DEV mock QR"
      >
        {cells.map((row, y) =>
          row.map((on, x) =>
            on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="black" /> : null,
          ),
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="bg-forge-orange/90 text-bg-void rounded px-2 py-1 text-[11px] font-semibold">
          DEV MOCK
        </div>
      </div>
    </div>
  )
}

function generatePseudoCells(seed: string, size: number): boolean[][] {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  const rand = () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 0xffffffff
  }
  const cells: boolean[][] = []
  for (let y = 0; y < size; y++) {
    const row: boolean[] = []
    for (let x = 0; x < size; x++) {
      // 三角定位图案（模仿 QR 的三个角）
      const inCorner = (x < 3 && y < 3) || (x >= size - 3 && y < 3) || (x < 3 && y >= size - 3)
      row.push(inCorner ? ((x + y) & 1) === 0 : rand() > 0.55)
    }
    cells.push(row)
  }
  return cells
}
