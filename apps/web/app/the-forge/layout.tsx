import type { ReactNode } from 'react'
import { LenisProvider } from '@/components/scroll/lenis-provider'

/**
 * Segment layout for `/the-forge` — enables Lenis smooth scroll
 * for the cinematic reel preview without affecting the rest of
 * the marketing site (SEO + Lighthouse on `/` stay untouched).
 */
export default function TheForgeLayout({ children }: { children: ReactNode }) {
  return <LenisProvider>{children}</LenisProvider>
}
