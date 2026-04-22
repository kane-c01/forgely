/**
 * apps/app middleware —— 保护需要登录的页面。
 *
 * 受保护的路径：`/dashboard`, `/account`, `/settings`, `/billing`,
 *              `/sites/*`, `/brand-kits`, `/generate`, `/apps-marketplace`,
 *              `/onboarding`, `/super/*`
 *
 * 公开路径：`/login`, `/signup`, `/legal/*`, `/api/*`, `/_next/*`, 静态文件。
 *
 * 未登录访问受保护路径 → 302 /login?next=<original_path>。
 *
 * 注意：middleware 只校验 cookie 存在 + 非空（基本 gate），真正会话
 * 合法性由下游 Route Handler / Server Component 通过 validateSession()
 * 验证。这样我们不把 Prisma 拉进 Edge runtime。
 *
 * @owner W6 — CN auth
 */
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'forgely_session'

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/legal',
  '/_next',
  '/api/auth',
  '/api/health',
  '/api/trpc',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
]

const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/account',
  '/settings',
  '/billing',
  '/sites',
  '/brand-kits',
  '/generate',
  '/apps-marketplace',
  '/onboarding',
  '/super',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()
  if (!isProtected(pathname)) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (token && token.length > 8) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', req.nextUrl)
  const nextParam = pathname + (req.nextUrl.search ?? '')
  if (nextParam && nextParam !== '/') {
    loginUrl.searchParams.set('next', nextParam)
  }
  return NextResponse.redirect(loginUrl)
}

/** Match all paths except obvious static assets. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|assets|images|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
}
