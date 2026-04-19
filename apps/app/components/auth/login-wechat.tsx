'use client'

import { useEffect, useState } from 'react'

export function LoginWechat() {
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const state = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    sessionStorage.setItem('forgely_wechat_state', state)
    fetch('/api/trpc/cnAuth.wechatAuthorizeUrl?input=' + encodeURIComponent(JSON.stringify({ json: { state } })))
      .then((r) => r.json())
      .then((j) => {
        const url = j?.result?.data?.json?.url
        if (typeof url === 'string') setAuthUrl(url)
        else setError('微信开放平台未配置')
      })
      .catch((e) => setError((e as Error).message))
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-border-subtle bg-bg-deep p-6">
      {authUrl ? (
        <>
          <div className="grid h-48 w-48 place-items-center rounded-md border border-border-strong bg-bg-elevated text-caption text-text-muted">
            扫码二维码（生产对接微信开放平台后这里渲染真实 QR）
          </div>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small text-forge-amber hover:underline"
          >
            在新窗口完成授权 →
          </a>
        </>
      ) : error ? (
        <p role="alert" className="text-small text-error">
          {error} — 请暂用手机号登录。
        </p>
      ) : (
        <p className="text-small text-text-muted">正在生成授权链接…</p>
      )}
      <p className="text-caption text-text-muted">
        授权完成后会跳回 /api/auth/wechat/callback 自动登录。
      </p>
    </div>
  )
}
