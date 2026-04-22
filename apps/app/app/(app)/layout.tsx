import type { ReactNode } from 'react'

import { AppShell } from '@/components/shell/app-shell'
import { LocaleProvider } from '@/lib/i18n'
import { TrpcProvider } from '@/lib/trpc-provider'

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <TrpcProvider>
      <LocaleProvider>
        <AppShell>{children}</AppShell>
      </LocaleProvider>
    </TrpcProvider>
  )
}
