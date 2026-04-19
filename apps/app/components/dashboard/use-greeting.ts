'use client'

import { useEffect, useState } from 'react'

/**
 * Returns the wall-clock based greeting + a tick that updates every minute.
 *
 * Computed on the client only (the dashboard is `client`) to avoid any
 * SSR/CSR mismatch on `Date()`.
 */
export function useGreeting(name: string) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!now) return { greeting: `Welcome back, ${name}`, time: '', date: '' }

  const hour = now.getHours()
  const word = hour < 5 ? 'Up early' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return {
    greeting: `${word}, ${name}`,
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
  }
}
