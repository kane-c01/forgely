import { ComingSoon } from '@/components/shell/coming-soon'

export default function AnalyticsPage() {
  return (
    <ComingSoon
      eyebrow="Insights"
      title="Analytics"
      description="Traffic, conversion funnel, SEO impressions and AI-suggested experiments."
      expected="Week 14"
      bullets={[
        'Funnel by source & device',
        'Cohort retention',
        'SEO + GEO ranking',
        'Copilot can compare any two periods',
      ]}
    />
  )
}
