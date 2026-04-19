import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

/**
 * The marketing site has two parallel route trees:
 *   1. `app/[locale]/...`  — internationalised marketing surfaces (homepage etc.)
 *   2. `app/{the-forge,generate,legal,about,manifesto,changelog,careers,docs,library}/...`
 *      — locale-agnostic static pages (legal copy, sandbox previews,
 *      placeholder content). They render directly without next-intl
 *      middleware, so the matcher below explicitly excludes their prefixes.
 *
 * If you add a new top-level locale-agnostic segment, list it here.
 */
export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*|the-forge|generate|legal|about|manifesto|changelog|careers|docs|library).*)',
  ],
}
