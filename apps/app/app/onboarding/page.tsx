/**
 * /onboarding — first-run Welcome form.
 *
 * Collects three essentials needed by every downstream AI agent:
 *   1. 公司名 (CompanyName) — 用于文案 + deploy subdomain 建议
 *   2. 经营类目 (BusinessCategory) — slug 驱动 Planner / Director 提示词
 *   3. 目标市场 (TargetMarkets) — 驱动货币/语言/合规默认项
 *
 * Submission calls `auth.completeOnboarding` which writes the three fields
 * onto User, stamps `onboardedAt = now()` and gifts 100 credits. The
 * `(app)/layout.tsx` enforces this page — any visit to the app with
 * `onboardedAt == null` is redirected here by server-side guard.
 *
 * @owner W2 — Sprint 3
 */
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export const metadata = {
  title: '欢迎 · Forgely',
  description: '3 分钟完成 Forgely 欢迎引导 —— 让 AI 理解你的品牌、类目和目标市场。',
}

export default function OnboardingPage() {
  return (
    <main className="bg-bg-void relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(255,107,26,0.14)_0,transparent_60%)]" />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <header className="mb-10">
          <span className="text-caption text-forge-amber font-mono uppercase tracking-[0.22em]">
            Welcome · 1 / 1
          </span>
          <h1 className="font-display text-display text-text-primary mt-4 leading-[1.05]">
            聊聊你的品牌。
          </h1>
          <p className="text-body-lg text-text-secondary mt-4 max-w-xl">
            3 分钟告诉 Forgely 你做什么、卖给谁、目标哪个市场 —— 我们的 AI
            会用这些信息调优后续所有生成的文案、画面、SEO。 完成后自动送{' '}
            <span className="text-forge-amber">100 积分</span>。
          </p>
        </header>
        <OnboardingForm />
      </div>
    </main>
  )
}
