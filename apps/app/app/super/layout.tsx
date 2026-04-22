import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSuperSession } from '@/lib/super'
import { LocaleProvider } from '@/lib/i18n'
import { TrpcProvider } from '@/lib/trpc-provider'
import { SuperTopbar } from './_components/Topbar'
import { SuperSidebar } from './_components/Sidebar'
import { SuperCopilotShell } from './_components/SuperCopilotShell'

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
 *
 * The Copilot drawer + ⌘K command palette are mounted via a client
 * sub-shell so the entire /super tree gets AI superpowers without the
 * server layout reaching into client-only providers.
 */
export default async function SuperLayout({ children }: { children: ReactNode }) {
  const session = await getSuperSession().catch(() => null)
  if (!session) {
    redirect('/login?next=/super')
  }

  return (
    <TrpcProvider>
      <LocaleProvider>
        <SuperCopilotShell role={session.role}>
          <div className="bg-bg-void text-text-primary flex min-h-screen">
            <SuperSidebar role={session.role} />
            <div className="flex min-w-0 flex-1 flex-col">
              <SuperTopbar session={session} />
              <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
            </div>
          </div>
        </SuperCopilotShell>
      </LocaleProvider>
    </TrpcProvider>
  )
}
