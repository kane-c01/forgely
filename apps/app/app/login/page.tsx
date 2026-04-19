/**
 * /login — Forgely platform login (B 端中国用户 entry point)
 *
 * 三种方式：
 *   1. 手机号 + 短信 OTP（首选 P0）
 *   2. 微信扫码（P0，open.weixin.qq.com）
 *   3. 邮箱 + 密码（备用，W3 已实现）
 *
 * docs/PIVOT-CN.md §2
 */
import { LoginPanel } from '@/components/auth/login-panel'

export const metadata = {
  title: '登录 · Forgely',
  description: '微信扫码 / 手机号 OTP / 邮箱登录 — 让 AI 帮你打造海外品牌独立站。',
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-void">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,26,0.18)_0,transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(0,217,255,0.10)_0,transparent_55%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-20">
        <div className="grid w-full gap-16 lg:grid-cols-[1fr_460px]">
          <section className="hidden flex-col justify-center lg:flex">
            <span className="font-mono text-caption uppercase tracking-[0.22em] text-forge-amber">
              Brand operating system · 中国出海
            </span>
            <h1 className="mt-6 max-w-md font-display text-display leading-[1.05] text-text-primary">
              用一个链接，造一个海外站。
            </h1>
            <p className="mt-6 max-w-md text-body-lg text-text-secondary">
              粘贴 1688、Tmall、Shopify 链接，AI 5 分钟生成电影级海外独立站，
              用 Stripe 收美元，让中国老板不被英文卡住。
            </p>
            <ul className="mt-10 space-y-3 text-body text-text-secondary">
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-forge-orange/15 font-mono text-caption text-forge-amber">
                  ⚡
                </span>
                <span>微信扫码登录，30 秒上手</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-forge-orange/15 font-mono text-caption text-forge-amber">
                  ¥
                </span>
                <span>微信支付 / 支付宝订阅 — ¥199 起</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-forge-orange/15 font-mono text-caption text-forge-amber">
                  $
                </span>
                <span>用户站走 Stripe 收 USD — 直入你的账户</span>
              </li>
            </ul>
          </section>
          <LoginPanel />
        </div>
      </div>
    </main>
  )
}
