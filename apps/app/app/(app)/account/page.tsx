import { ComingSoon } from '@/components/shell/coming-soon'

export default function AccountPage() {
  return (
    <ComingSoon
      eyebrow="Account"
      title="Personal account"
      description="Profile, password, two-factor authentication and connected accounts."
      expected="Week 9"
      bullets={[
        'Profile & avatar',
        'Email change with re-verification',
        'TOTP 2FA',
        'GitHub / Google SSO',
      ]}
    />
  )
}
