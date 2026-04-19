'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { AIQuickActions } from '@/components/products/ai-quick-actions'
import { ProductInventoryBar, ProductStatusCell } from '@/components/products/product-row'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Icon } from '@/components/ui/icons'
import { getProduct } from '@/lib/mocks'
import { formatCurrency } from '@/lib/format'

export default function ProductDetailPage({
  params,
}: {
  params: { siteId: string; productId: string }
}) {
  const product = getProduct(params.productId)
  useCopilotContext(
    product
      ? { kind: 'product', productId: product.id, productTitle: product.title }
      : { kind: 'global' },
  )
  if (!product) return notFound()

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <div className="flex items-center gap-2 font-mono text-caption text-text-muted">
        <Link href={`/sites/${params.siteId}/products`} className="hover:text-text-primary">
          Products
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-text-secondary">{product.title}</span>
      </div>

      <PageHeader
        eyebrow={`/${product.handle}`}
        title={product.title}
        description={`Vendor: ${product.vendor}`}
        meta={
          <>
            <ProductStatusCell product={product} />
            <span>·</span>
            <span>Stock</span>
            <ProductInventoryBar inventory={product.inventory} />
            <span>·</span>
            <span className="tabular-nums text-text-secondary">
              {formatCurrency(product.priceCents)}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Eye size={14} /> View on store
            </Button>
            <Button>
              <Icon.Check size={14} /> Save changes
            </Button>
          </>
        }
      />

      <AIQuickActions
        actions={[
          { emoji: '✍️', label: 'Rewrite copy', prompt: 'Rewrite the title and description for SEO and emotional appeal.' },
          { emoji: '💵', label: 'Suggest pricing', prompt: 'Suggest pricing based on competitor median + AOV.' },
          { emoji: '📸', label: 'Generate lifestyle photos', prompt: 'Generate 3 lifestyle photos for this product, warm tones, kinari linen background.' },
          { emoji: '🎬', label: 'Generate hero video', prompt: 'Generate a 4s hero loop video for this product, golden hour lighting.' },
          { emoji: '🏷️', label: 'Suggest a discount', prompt: 'Suggest a launch discount with a code I can copy.' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column: main edit fields */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Title" required>
                <Input defaultValue={product.title} />
              </Field>
              <Field label="Handle" hint="Used in the URL: /products/this-handle">
                <Input defaultValue={product.handle} />
              </Field>
              <Field label="Description" hint="Markdown supported. Use Copilot to rewrite.">
                <Textarea
                  defaultValue={`A ${product.vendor} signature. Crafted with care.`}
                  className="min-h-32"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <Button size="sm" variant="ghost">
                <Icon.Upload size={14} /> Upload
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="group relative flex aspect-square items-center justify-center rounded-md border border-border-subtle bg-bg-deep text-[44px]"
                  >
                    <span aria-hidden>{img}</span>
                    {i === 0 ? (
                      <Badge tone="forge" className="absolute left-2 top-2 !text-[10px]">
                        cover
                      </Badge>
                    ) : null}
                    <button
                      aria-label="Remove image"
                      className="absolute right-2 top-2 hidden grid h-6 w-6 place-items-center rounded-md bg-bg-void/80 text-text-secondary backdrop-blur group-hover:grid hover:text-error"
                    >
                      <Icon.Trash size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong bg-bg-deep text-text-muted transition-colors hover:border-forge-orange/50 hover:text-forge-amber"
                >
                  <Icon.Sparkle size={20} />
                  <span className="font-mono text-caption uppercase tracking-[0.18em]">AI</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <Badge tone="info" className="!text-[10px]">auto</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Meta title">
                <Input defaultValue={`${product.title} — ${product.vendor}`} />
              </Field>
              <Field label="Meta description">
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
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Price">
                <Input defaultValue={(product.priceCents / 100).toFixed(2)} />
              </Field>
              <Field label="Compare at price" hint="Strikethrough on storefront.">
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
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="On hand">
                <Input defaultValue={String(product.inventory)} />
              </Field>
              <Field label="SKU">
                <Input defaultValue={`SKU-${product.id.toUpperCase()}`} />
              </Field>
              <Field label="Track quantity">
                <select className="h-9 w-full rounded-md border border-border-strong bg-bg-deep px-3 text-small text-text-primary focus:border-forge-orange/60 focus:outline-none">
                  <option>Track manually</option>
                  <option>Don&apos;t track</option>
                  <option>Sync with Medusa stock</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label="Vendor">
                <Input defaultValue={product.vendor} />
              </Field>
              <Field label="Collections" hint="Press Enter to add.">
                <Input defaultValue={product.collections.join(', ')} />
              </Field>
              <Field label="Status">
                <select
                  defaultValue={product.status}
                  className="h-9 w-full rounded-md border border-border-strong bg-bg-deep px-3 text-small text-text-primary focus:border-forge-orange/60 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
