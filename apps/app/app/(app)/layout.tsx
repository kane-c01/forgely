import type { ReactNode } from 'react'

import { AppShell } from '@/components/shell/app-shell'
import { TrpcProvider } from '@/lib/trpc-provider'

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <TrpcProvider>
      <AppShell>{children}</AppShell>
    </TrpcProvider>
  )
}
