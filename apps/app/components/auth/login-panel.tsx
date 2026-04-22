'use client'

import { useState } from 'react'

import { LoginPhoneOtp } from './login-phone-otp'
import { LoginWechat } from './login-wechat'
import { LoginEmail } from './login-email'

type Tab = 'wechat' | 'phone' | 'email'

const TABS: Array<{ id: Tab; label: string; emoji: string; hint: string }> = [
  { id: 'wechat', label: '微信扫码', emoji: '💬', hint: '已绑定微信开放平台 —— 中国商家首选' },
  { id: 'phone', label: '手机号', emoji: '📱', hint: '中国手机号 + 6 位验证码' },
  { id: 'email', label: '邮箱', emoji: '✉️', hint: 'Email + 密码（备用）' },
]

export function LoginPanel() {
  const [tab, setTab] = useState<Tab>('wechat')

  return (
    <section className="border-border-strong bg-bg-elevated/80 shadow-elevated rounded-2xl border p-8 backdrop-blur-md">
      <header>
        <h2 className="font-display text-h2 text-text-primary">登录 Forgely</h2>
        <p className="text-small text-text-secondary mt-2">
          首次访问会自动创建账号 — 您即拥有 <span className="text-forge-amber">¥0 / 500 积分</span>
          。
        </p>
      </header>

      <div className="border-border-subtle bg-bg-deep mt-6 grid grid-cols-3 gap-2 rounded-lg border p-1">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'text-small rounded-md px-3 py-2 transition-colors',
                active
                  ? 'bg-bg-elevated text-text-primary shadow-subtle'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              <span className="mr-1.5">{t.emoji}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      <p className="text-caption text-text-muted mt-3">{TABS.find((t) => t.id === tab)?.hint}</p>

      <div className="mt-6">
        {tab === 'phone' ? <LoginPhoneOtp /> : null}
        {tab === 'wechat' ? <LoginWechat /> : null}
        {tab === 'email' ? <LoginEmail /> : null}
      </div>

      <footer className="border-border-subtle text-caption text-text-muted mt-8 border-t pt-4">
        登录即同意我们的{' '}
        <a href="/legal/terms" className="text-forge-amber hover:underline">
          服务条款
        </a>{' '}
        和{' '}
        <a href="/legal/privacy" className="text-forge-amber hover:underline">
          隐私政策
        </a>
        。
      </footer>
    </section>
  )
}
