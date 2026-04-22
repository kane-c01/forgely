/**
 * /signup — Forgely 平台注册入口（中国 B 端首选）。
 *
 * 三种方式的 UI 结构与 /login 完全一致（任务 W2 要求「结构复刻」），
 * 首次成功的手机 OTP / 微信登录会走同一条路径自动创建账号，邮箱注册
 * 走 `auth.signup`，成功后跳 /onboarding 让用户填公司信息领 100 积分。
 *
 * @owner W2 — Sprint 3
 */
import { SignupPanel } from '@/components/auth/signup-panel'

export const metadata = {
  title: '注册 · Forgely',
  description: '创建 Forgely 账号 — 微信 / 手机号 / 邮箱三选一，注册即送 100 积分。',
}

export default function SignupPage() {
  return (
    <main className="bg-bg-void relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,26,0.18)_0,transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(0,217,255,0.10)_0,transparent_55%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-20">
        <div className="grid w-full gap-16 lg:grid-cols-[1fr_460px]">
          <section className="hidden flex-col justify-center lg:flex">
            <span className="text-caption text-forge-amber font-mono uppercase tracking-[0.22em]">
              Forgely · 品牌 OS
            </span>
            <h1 className="font-display text-display text-text-primary mt-6 max-w-md leading-[1.05]">
              让 AI 帮你把中国好货卖到全球。
            </h1>
            <p className="text-body-lg text-text-secondary mt-6 max-w-md">
              5 分钟生成一个电影级海外独立站。粘贴一条 1688 / Tmall 链接即可， 剩下交给 Forgely ——
              策略、文案、视觉、SEO、合规一条龙。
            </p>
            <ul className="text-body text-text-secondary mt-10 space-y-3">
              <li className="flex items-center gap-3">
                <span className="bg-forge-orange/15 text-caption text-forge-amber grid h-6 w-6 place-items-center rounded-full font-mono">
                  ⚡
                </span>
                <span>完成欢迎引导立送 100 积分</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-forge-orange/15 text-caption text-forge-amber grid h-6 w-6 place-items-center rounded-full font-mono">
                  🛡
                </span>
                <span>中国身份（微信 UnionId + 手机号）安全登录</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-forge-orange/15 text-caption text-forge-amber grid h-6 w-6 place-items-center rounded-full font-mono">
                  $
                </span>
                <span>Stripe / 微信 / 支付宝 三种结算通道自动切换</span>
              </li>
            </ul>
          </section>
          <SignupPanel />
        </div>
      </div>
    </main>
  )
}
