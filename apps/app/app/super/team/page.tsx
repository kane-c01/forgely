import { SectionCard, SuperButton } from '@/components/super-ui'
import { getSuperSession, getTeamMembers } from '@/lib/super'
import type { SuperRole } from '@/lib/super'

import { I18nHeader, RestrictedBanner } from '../_components/I18nHeader'
import { TeamClient } from './_components/TeamClient'

export const metadata = {
  title: 'Forgely Command · Team',
}

const ROLE_DESC: Record<SuperRole, string> = {
  OWNER: 'Full access including finance and team. There can be only one.',
  ADMIN: 'Everything except finance and team management.',
  SUPPORT: 'Read-only access to users, sites and support tickets.',
}

export default async function SuperTeamPage() {
  const session = await getSuperSession()
  if (session.role !== 'OWNER') {
    return <RestrictedBanner role={session.role} level="owner" />
  }

  const members = getTeamMembers()
  const counts = members.reduce(
    (acc, m) => {
      acc[m.role] += 1
      if (!m.acceptedAt) acc.pending += 1
      if (!m.twoFactorEnabled) acc.no2fa += 1
      return acc
    },
    { OWNER: 0, ADMIN: 0, SUPPORT: 0, pending: 0, no2fa: 0 },
  )

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader section="team" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <RoleStat label="OWNER" count={counts.OWNER} accent="forge" desc={ROLE_DESC.OWNER} />
        <RoleStat label="ADMIN" count={counts.ADMIN} accent="info" desc={ROLE_DESC.ADMIN} />
        <RoleStat
          label="SUPPORT"
          count={counts.SUPPORT}
          accent="neutral"
          desc={ROLE_DESC.SUPPORT}
        />
        <RoleStat
          label="Pending"
          count={counts.pending}
          accent={counts.pending > 0 ? 'warning' : 'neutral'}
          desc="Invites not yet accepted"
        />
        <RoleStat
          label="No 2FA"
          count={counts.no2fa}
          accent={counts.no2fa > 0 ? 'error' : 'success'}
          desc="Required for ADMIN+"
        />
      </div>

      <SectionCard
        title={`Members · ${members.length}`}
        action={<SuperButton variant="primary">Invite member</SuperButton>}
        bodyClassName="p-0"
      >
        <TeamClient members={members} />
      </SectionCard>
    </div>
  )
}

function RoleStat({
  label,
  count,
  desc,
  accent,
}: {
  label: string
  count: number
  desc: string
  accent: 'forge' | 'info' | 'neutral' | 'warning' | 'error' | 'success'
}) {
  const ACC = {
    forge: 'text-forge-amber',
    info: 'text-info',
    neutral: 'text-text-secondary',
    warning: 'text-warning',
    error: 'text-error',
    success: 'text-success',
  } as const
  return (
    <div className="border-border-subtle bg-bg-deep border px-4 py-3">
      <div className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className={`text-h2 mt-1 font-mono tabular-nums ${ACC[accent]}`}>{count}</div>
      <p className="text-caption text-text-muted mt-1">{desc}</p>
    </div>
  )
}
