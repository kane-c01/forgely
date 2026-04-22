'use client'

import { useState } from 'react'

import { LoginPhoneOtp } from './login-phone-otp'
import { LoginWechat } from './login-wechat'
import { SignupEmail } from './signup-email'

type Tab = 'phone' | 'wechat' | 'email'

const TABS: Array<{ id: Tab; label: string; emoji: string; hint: string }> = [
  { id: 'phone', label: '手机号', emoji: '📱', hint: '首次注册：手机号 + 6 位验证码' },
  { id: 'wechat', label: '微信扫码', emoji: '💬', hint: '扫码后自动创建账号' },
  { id: 'email', label: '邮箱 + 密码', emoji: '✉️', hint: '备用：Email + 至少 8 位密码' },
]

export function SignupPanel() {
  const [tab, setTab] = useState<Tab>('phone')

  return (
    <section className="border-border-strong bg-bg-elevated/80 shadow-elevated rounded-2xl border p-8 backdrop-blur-md">
      <header>
        <h2 className="font-display text-h2 text-text-primary">注册 Forgely</h2>
        <p className="text-small text-text-secondary mt-2">
          完成引导即送 <span className="text-forge-amber">100 积分</span>
          ，相当于一次免费图文站生成。
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
        {tab === 'email' ? <SignupEmail /> : null}
      </div>

      <footer className="border-border-subtle text-caption text-text-muted mt-8 border-t pt-4">
        已有账号？
        <a href="/login" className="text-forge-amber ml-1 hover:underline">
          登录 →
        </a>
      </footer>
    </section>
  )
}
