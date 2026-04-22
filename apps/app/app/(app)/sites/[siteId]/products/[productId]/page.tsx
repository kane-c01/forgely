'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { AIQuickActions } from '@/components/products/ai-quick-actions'
import { ProductInventoryBar, ProductStatusCell } from '@/components/products/product-row'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { getProduct } from '@/lib/mocks'
import { formatCurrency } from '@/lib/format'

export default function ProductDetailPage({
  params,
}: {
  params: { siteId: string; productId: string }
}) {
  const t = useT()
  const product = getProduct(params.productId)
  useCopilotContext(
    product
      ? { kind: 'product', productId: product.id, productTitle: product.title }
      : { kind: 'global' },
  )
  if (!product) return notFound()

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <div className="text-caption text-text-muted flex items-center gap-2 font-mono">
        <Link href={`/sites/${params.siteId}/products`} className="hover:text-text-primary">
          {t.productDetail.breadcrumb}
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-text-secondary">{product.title}</span>
      </div>

      <PageHeader
        eyebrow={`/${product.handle}`}
        title={product.title}
        description={`${t.productDetail.vendor}${product.vendor}`}
        meta={
          <>
            <ProductStatusCell product={product} />
            <span>·</span>
            <span>{t.productDetail.stock}</span>
            <ProductInventoryBar inventory={product.inventory} />
            <span>·</span>
            <span className="text-text-secondary tabular-nums">
              {formatCurrency(product.priceCents)}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Eye size={14} /> {t.productDetail.viewOnStore}
            </Button>
            <Button>
              <Icon.Check size={14} /> {t.productDetail.saveChanges}
            </Button>
          </>
        }
      />

      <AIQuickActions
        actions={[
          {
            emoji: '✍️',
            label: t.productDetail.rewriteCopy,
            prompt: 'Rewrite the title and description for SEO and emotional appeal.',
          },
          {
            emoji: '💵',
            label: t.productDetail.suggestPricing,
            prompt: 'Suggest pricing based on competitor median + AOV.',
          },
          {
            emoji: '📸',
            label: t.productDetail.generatePhotos,
            prompt:
              'Generate 3 lifestyle photos for this product, warm tones, kinari linen background.',
          },
          {
            emoji: '🎬',
            label: t.productDetail.generateVideo,
            prompt: 'Generate a 4s hero loop video for this product, golden hour lighting.',
          },
          {
            emoji: '🏷️',
            label: t.productDetail.suggestDiscount,
            prompt: 'Suggest a launch discount with a code I can copy.',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column: main edit fields */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.productDetail.general}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label={t.productDetail.titleLabel} required>
                <Input defaultValue={product.title} />
              </Field>
              <Field label={t.productDetail.handle} hint={t.productDetail.handleHint}>
                <Input defaultValue={product.handle} />
              </Field>
              <Field label={t.productDetail.description} hint={t.productDetail.descriptionHint}>
                <Textarea
                  defaultValue={`A ${product.vendor} signature. Crafted with care.`}
                  className="min-h-32"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.productDetail.media}</CardTitle>
              <Button size="sm" variant="ghost">
                <Icon.Upload size={14} /> {t.productDetail.upload}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="border-border-subtle bg-bg-deep group relative flex aspect-square items-center justify-center rounded-md border text-[44px]"
                  >
                    <span aria-hidden>{img}</span>
                    {i === 0 ? (
                      <Badge tone="forge" className="absolute left-2 top-2 !text-[10px]">
                        {t.productDetail.cover}
                      </Badge>
                    ) : null}
                    <button
                      aria-label={t.productDetail.removeImage}
                      className="bg-bg-void/80 text-text-secondary hover:text-error absolute right-2 top-2 grid hidden h-6 w-6 place-items-center rounded-md backdrop-blur group-hover:grid"
                    >
                      <Icon.Trash size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="border-border-strong bg-bg-deep text-text-muted hover:border-forge-orange/50 hover:text-forge-amber flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed transition-colors"
                >
                  <Icon.Sparkle size={20} />
                  <span className="text-caption font-mono uppercase tracking-[0.18em]">AI</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.productDetail.seo}</CardTitle>
              <Badge tone="info" className="!text-[10px]">
                {t.productDetail.auto}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t.productDetail.metaTitle}>
                <Input defaultValue={`${product.title} — ${product.vendor}`} />
              </Field>
              <Field label={t.productDetail.metaDescription}>
                <Textarea
                  defaultValue={`Order ${product.title} from ${product.vendor}. Roasted weekly, shipped within 7 days.`}
                  className="min-h-20"
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.productDetail.pricing}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label={t.productDetail.price}>
                <Input defaultValue={(product.priceCents / 100).toFixed(2)} />
              </Field>
              <Field label={t.productDetail.compareAtPrice} hint={t.productDetail.compareHint}>
                <Input
                  defaultValue={
                    product.compareAtCents ? (product.compareAtCents / 100).toFixed(2) : ''
                  }
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.productDetail.inventory}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label={t.productDetail.onHand}>
                <Input defaultValue={String(product.inventory)} />
              </Field>
              <Field label={t.productDetail.sku}>
                <Input defaultValue={`SKU-${product.id.toUpperCase()}`} />
              </Field>
              <Field label={t.productDetail.trackQuantity}>
                <select className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none">
                  <option>{t.productDetail.trackManually}</option>
                  <option>{t.productDetail.dontTrack}</option>
                  <option>{t.productDetail.syncMedusa}</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.productDetail.organization}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label={t.productDetail.vendorLabel}>
                <Input defaultValue={product.vendor} />
              </Field>
              <Field label={t.productDetail.collections} hint={t.productDetail.collectionsHint}>
                <Input defaultValue={product.collections.join(', ')} />
              </Field>
              <Field label={t.productDetail.status}>
                <select
                  defaultValue={product.status}
                  className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none"
                >
                  <option value="active">{t.productDetail.active}</option>
                  <option value="draft">{t.productDetail.draft}</option>
                  <option value="archived">{t.productDetail.archived}</option>
                </select>
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
