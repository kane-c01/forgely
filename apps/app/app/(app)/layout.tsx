/**
 * (app) layout — server-side session + onboarding guard.
 *
 * The Edge `middleware.ts` already turned anonymous visitors away. Here
 * we have a full Prisma connection, so we enforce the second gate:
 * users whose `onboardedAt` is still null must finish `/onboarding`
 * before they can touch any tenant page.
 *
 * @owner W2 — Sprint 3
 */
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { validateSession } from '@forgely/api/auth'

import { AppShell } from '@/components/shell/app-shell'
import { TrpcProvider } from '@/lib/trpc-provider'

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('forgely_session')?.value
  if (!token) redirect('/login?next=/dashboard')
  const resolved = await validateSession(token).catch(() => null)
  if (!resolved?.user) redirect('/login?next=/dashboard')
  if (!resolved.user.onboardedAt) redirect('/onboarding')

  return (
    <TrpcProvider>
      <AppShell>{children}</AppShell>
    </TrpcProvider>
  )
}
