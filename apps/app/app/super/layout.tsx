import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSuperSession } from '@/lib/super'
import { SuperTopbar } from './_components/Topbar'
import { SuperSidebar } from './_components/Sidebar'
import { SuperCopilotBridges } from './_components/SuperCopilotBridges'

export const metadata: Metadata = {
  title: 'Forgely Command · /super',
  description: 'Super-admin console for the Forgely platform.',
  robots: { index: false, follow: false },
}

/**
 * Server-side gate for the entire /super tree.
 *
 * MVP behaviour: any non-super-admin is redirected to /login.
 * `getSuperSession()` currently returns a deterministic dev session — once
 * the W3 NextAuth integration lands (T06) it will throw if the cookie is
 * missing or `role !== 'super_admin'`.
 */
export default async function SuperLayout({ children }: { children: ReactNode }) {
  const session = await getSuperSession().catch(() => null)
  if (!session) {
    redirect('/login?next=/super')
  }

  return (
    <div className="bg-bg-void text-text-primary flex min-h-screen">
      <SuperSidebar role={session.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SuperTopbar session={session} />
        <SuperCopilotBridges />
        <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
