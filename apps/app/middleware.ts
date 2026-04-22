/**
 * Edge middleware — gate /app, /super, /onboarding behind a session cookie.
 *
 * We only check for the presence of the opaque `forgely_session` cookie
 * here (Edge runtime — no Prisma). Full validation + the `onboardedAt`
 * enforcement happens server-side inside `(app)/layout.tsx`, which can
 * hit Postgres. This keeps the middleware cheap while still redirecting
 * anonymous visitors immediately on any protected route.
 *
 * Protected paths:
 *   - /dashboard           (W2 — tenant dashboard)
 *   - /sites/*             (W2)
 *   - /generate            (W1)
 *   - /onboarding          (W2 — must be signed in to fill the form)
 *   - /account, /billing, /settings, /apps-marketplace, /brand-kits
 *   - /super/*             (super-admin — role gate inside the layout)
 *
 * Public paths:
 *   - /, /login, /signup, /api/*, /legal/*, static assets
 */
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
  '/dashboard',
  '/sites',
  '/generate',
  '/onboarding',
  '/account',
  '/billing',
  '/settings',
  '/apps-marketplace',
  '/brand-kits',
  '/super',
]

const SESSION_COOKIE = 'forgely_session'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (!needsAuth) return NextResponse.next()

  const session = req.cookies.get(SESSION_COOKIE)
  if (session?.value) return NextResponse.next()

  const loginUrl = new URL('/login', req.url)
  const nextTarget = pathname + (req.nextUrl.search ?? '')
  loginUrl.searchParams.set('next', nextTarget)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *   - _next/static, _next/image, favicon, /api/*,
     *   - /login, /signup, /legal/*, /,
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|login|signup|legal|$).*)',
  ],
}
