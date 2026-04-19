import { ComingSoon } from '@/components/shell/coming-soon'

export default function GlobalSettingsPage() {
  return (
    <ComingSoon
      eyebrow="Account"
      title="Global settings"
      description="Workspace-level preferences shared across every site you own."
      expected="Week 10"
      bullets={[
        'Workspace name + logo',
        'Default brand kit',
        'Notification preferences',
        'Developer API keys',
      ]}
    />
  )
}
