/**
 * In-memory CMS pages mock — used by the `/sites/[id]/pages/*` routes
 * until W3 wires up the real `cms.*` tRPC procedures end-to-end.
 *
 * Once `trpc.cms.list` / `trpc.cms.get` ship, the page components can
 * pipe these through the same `selectDataSource()` helper as everything
 * else and this file goes away.
 */
export type CmsStatus = 'draft' | 'published' | 'archived'

export interface CmsPage {
  id: string
  siteId: string
  title: string
  slug: string
  status: CmsStatus
  /** HTML body (Tiptap-flavoured). */
  body: string
  /** Optional SEO description used for meta + previews. */
  description?: string
  /** Author handle. */
  author: string
  updatedAt: string
}

const ago = (h: number): string => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()

export const cmsPages: CmsPage[] = [
  {
    id: 'p_about',
    siteId: 'qiao-coffee',
    title: 'About Qiao',
    slug: '/about',
    status: 'published',
    author: 'Alex',
    description:
      'A small studio in Kyoto that pulls beans at dawn and ships within a week of roast.',
    body:
      '<h1>A small studio in Kyoto</h1>' +
      '<p>We started Qiao because morning coffee deserves better than a vacuum brick. ' +
      'We work with two farms — only.</p>' +
      '<h2>Our promise</h2>' +
      '<ul><li>Roasted on Tuesdays.</li><li>Shipped on Wednesdays.</li><li>Never older than 7 days when it lands at your door.</li></ul>' +
      '<blockquote>From the same farm, in your hands.</blockquote>',
    updatedAt: ago(2),
  },
  {
    id: 'p_returns',
    siteId: 'qiao-coffee',
    title: 'Returns & exchanges',
    slug: '/policies/returns',
    status: 'published',
    author: 'Alex',
    description: 'Plain-language returns policy.',
    body:
      '<h1>Returns &amp; exchanges</h1>' +
      '<p>If your order arrives damaged, we&rsquo;ll replace it free of charge — no questions, no return shipping. ' +
      'Just <strong>email us within 7 days</strong> with a photo.</p>',
    updatedAt: ago(48),
  },
  {
    id: 'p_press',
    siteId: 'qiao-coffee',
    title: 'Press kit',
    slug: '/press',
    status: 'draft',
    author: 'Alex',
    description: 'Logo files, founder bios, brand voice notes.',
    body:
      '<h2>Press kit (draft)</h2>' +
      '<p>Download our <a href="#">brand kit zip</a>. Founder photos and product hero stills below.</p>',
    updatedAt: ago(72),
  },
]

export function getCmsPage(id: string): CmsPage | undefined {
  return cmsPages.find((p) => p.id === id)
}

export function cmsPagesForSite(siteId: string): CmsPage[] {
  return cmsPages.filter((p) => p.siteId === siteId)
}
