import type { IconKey } from '@/components/ui/icons'

/**
 * Single source of truth for the dashboard left sidebar.
 *
 * `siteId` placeholders get rewritten by `<SidebarNav>` once the user has
 * selected a site (or we fall back to the default mock site so links
 * never 404 in screenshot mode).
 */

export interface NavLeaf {
  label: string
  href: string
  icon: IconKey
  scope: 'global' | 'site'
}

export interface NavGroup {
  label: string
  items: NavLeaf[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'Dashboard', scope: 'global' },
      { label: 'Sites', href: '/sites', icon: 'Sites', scope: 'global' },
    ],
  },
  {
    label: 'Store',
    items: [
      { label: 'Products', href: '/sites/{siteId}/products', icon: 'Box', scope: 'site' },
      { label: 'Orders', href: '/sites/{siteId}/orders', icon: 'Cart', scope: 'site' },
      { label: 'Customers', href: '/sites/{siteId}/customers', icon: 'Users', scope: 'site' },
    ],
  },
  {
    label: 'Brand',
    items: [
      { label: 'Theme Editor', href: '/sites/{siteId}/editor', icon: 'Editor', scope: 'site' },
      { label: 'Media', href: '/sites/{siteId}/media', icon: 'Image', scope: 'site' },
      { label: 'Brand Kits', href: '/brand-kits', icon: 'Brand', scope: 'global' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'SEO + GEO', href: '/sites/{siteId}/seo', icon: 'Globe', scope: 'site' },
      { label: 'Compliance', href: '/sites/{siteId}/compliance', icon: 'Check', scope: 'site' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Billing', href: '/billing', icon: 'Wallet', scope: 'global' },
      { label: 'Apps', href: '/apps-marketplace', icon: 'Apps', scope: 'global' },
      { label: 'Settings', href: '/settings', icon: 'Settings', scope: 'global' },
    ],
  },
]

export function resolveHref(href: string, siteId: string): string {
  return href.replace('{siteId}', siteId)
}
