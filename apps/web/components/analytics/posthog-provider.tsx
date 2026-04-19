'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

import { getPosthog, isPosthogEnabled } from '@/lib/posthog'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isPosthogEnabled || !pathname) return
    let cancelled = false
    void getPosthog().then((ph) => {
      if (cancelled || !ph) return
      const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname
      ph.capture('$pageview', { $current_url: url })
    })
    return () => {
      cancelled = true
    }
  }, [pathname, searchParams])

  return null
}

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isPosthogEnabled) return
    void getPosthog()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  )
}
