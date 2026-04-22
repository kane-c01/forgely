/**
 * /onboarding — 首次登录后完成公司信息问卷，提交后拿 100 积分 + 跳 /dashboard。
 *
 * 已完成 onboarding 的用户访问这里会自动跳 /dashboard。
 *
 * @owner W6 — CN auth
 */
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { SESSION_COOKIE_NAME, validateSession } from '@forgely/api/auth'

import { OnboardingForm } from './onboarding-form'

export const metadata = {
  title: '开始 · Forgely',
  description: '告诉我们你的业务，Forgely 会帮你打造海外独立站。',
}

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value ?? ''
  const session = token ? await validateSession(token) : null
  if (!session) redirect('/login')
  if (session.user.onboardedAt) redirect('/dashboard')

  return (
    <main className="bg-bg-void relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,26,0.18)_0,transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(0,217,255,0.10)_0,transparent_55%)]" />
      <div className="mx-auto max-w-2xl px-6 py-20">
        <header className="mb-10">
          <span className="text-caption text-forge-amber font-mono uppercase tracking-[0.22em]">
            Welcome · 欢迎使用 Forgely
          </span>
          <h1 className="font-display text-display text-text-primary mt-4 leading-[1.05]">
            告诉我们你在做什么生意。
          </h1>
          <p className="text-body-lg text-text-secondary mt-4 max-w-md">
            只要 3 个问题，我们就能帮你生成第一个海外独立站草稿 ——
            <span className="text-forge-amber ml-1">填完立刻到账 100 积分。</span>
          </p>
        </header>
        <OnboardingForm userName={session.user.name} />
      </div>
    </main>
  )
}
