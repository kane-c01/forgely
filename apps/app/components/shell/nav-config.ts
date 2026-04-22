import type { IconKey } from '@/components/ui/icons'
import type { TranslationKeys } from '@/lib/i18n'

/**
 * Single source of truth for the dashboard left sidebar.
 *
 * `siteId` placeholders get rewritten by `<SidebarNav>` once the user has
 * selected a site (or we fall back to the default mock site so links
 * never 404 in screenshot mode).
 *
 * `labelKey` is a dot-path into `TranslationKeys['nav']` so the sidebar
 * renders in the user's chosen language.
 */

export interface NavLeaf {
  labelKey: keyof TranslationKeys['nav']
  href: string
  icon: IconKey
  scope: 'global' | 'site'
}

export interface NavGroup {
  labelKey: keyof TranslationKeys['nav']
  items: NavLeaf[]
}

export const navGroups: NavGroup[] = [
  {
    labelKey: 'workspace',
    items: [
      { labelKey: 'dashboard', href: '/dashboard', icon: 'Dashboard', scope: 'global' },
      { labelKey: 'sites', href: '/sites', icon: 'Sites', scope: 'global' },
    ],
  },
  {
    labelKey: 'store',
    items: [
      { labelKey: 'products', href: '/sites/{siteId}/products', icon: 'Box', scope: 'site' },
      { labelKey: 'orders', href: '/sites/{siteId}/orders', icon: 'Cart', scope: 'site' },
      { labelKey: 'customers', href: '/sites/{siteId}/customers', icon: 'Users', scope: 'site' },
    ],
  },
  {
    labelKey: 'brand',
    items: [
      { labelKey: 'themeEditor', href: '/sites/{siteId}/editor', icon: 'Editor', scope: 'site' },
      { labelKey: 'media', href: '/sites/{siteId}/media', icon: 'Image', scope: 'site' },
      { labelKey: 'brandKits', href: '/brand-kits', icon: 'Brand', scope: 'global' },
    ],
  },
  {
    labelKey: 'growth',
    items: [
      { labelKey: 'seoGeo', href: '/sites/{siteId}/seo', icon: 'Globe', scope: 'site' },
      { labelKey: 'compliance', href: '/sites/{siteId}/compliance', icon: 'Check', scope: 'site' },
    ],
  },
  {
    labelKey: 'account',
    items: [
      { labelKey: 'billing', href: '/billing', icon: 'Wallet', scope: 'global' },
      { labelKey: 'apps', href: '/apps-marketplace', icon: 'Apps', scope: 'global' },
      { labelKey: 'settings', href: '/settings', icon: 'Settings', scope: 'global' },
    ],
  },
]

export function resolveHref(href: string, siteId: string): string {
  return href.replace('{siteId}', siteId)
}
