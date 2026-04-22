'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  requireConfirmed,
  useCopilotContext,
  useRegisterCopilotTool,
} from '@/components/copilot/copilot-provider'
import { AIQuickActions } from '@/components/products/ai-quick-actions'
import { ProductInventoryBar, ProductStatusCell } from '@/components/products/product-row'
import { PageHeader } from '@/components/shell/page-header'
import { trpc } from '@/lib/trpc'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // W5: wire Copilot tool calls for this page to real tRPC mutations.
  // The runners are always registered (unconditional hook order); if
  // `product` is missing the notFound below prevents the page from ever
  // rendering a tool card anyway.
  const updateProduct = trpc.products.update.useMutation()

  useRegisterCopilotTool('update_product', async (args) => {
    const gate = requireConfirmed(args, 'update_product')
    if (gate) return gate
    const targetId = (args.productId as string | undefined) ?? params.productId
    // Accept both `{ patch: { … } }` and flat shapes like `{ priceCents }`
    // that the fake-assistant emits.
    const rawPatch =
      (args.patch as Record<string, unknown> | undefined) ??
      Object.fromEntries(
        Object.entries(args).filter(
          ([k]) => !['productId', '_userConfirmed', '_destructive'].includes(k),
        ),
      )
    await updateProduct.mutateAsync({
      siteId: params.siteId,
      productId: targetId,
      patch: rawPatch,
      reason: 'copilot.tool.update_product',
    })
    return `已更新商品 ${targetId}`
  })

  useRegisterCopilotTool('suggest_pricing', (args) => {
    // Non-destructive — returns advice as a message, does not write.
    const target = typeof args.target === 'number' ? args.target : undefined
    const basis = typeof args.basis === 'string' ? args.basis : 'competitor-median+AOV'
    return target !== undefined
      ? `建议价 ${formatCurrency(target)}（依据 ${basis}），可再发 update_product 应用。`
      : `已分析同类 SKU 与 AOV，建议保持当前定价（依据 ${basis}）。`
  })

  useRegisterCopilotTool('rewrite_copy', async (args) => {
    const gate = requireConfirmed(args, 'rewrite_copy')
    if (gate) return gate
    const options = (args.options as string[] | undefined) ?? []
    const next = options[0]
    if (!next) return '未提供候选文案。'
    // Persist the chosen headline as a product title patch so the
    // draft updates end-to-end (audit log will show a copy change).
    await updateProduct.mutateAsync({
      siteId: params.siteId,
      productId: params.productId,
      patch: { title: next },
      reason: 'copilot.tool.rewrite_copy',
    })
    return `已把文案换成 "${next}" 并写入草稿。`
  })

  if (!product) return notFound()

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <div className="text-caption text-text-muted flex items-center gap-2 font-mono">
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
            <span className="text-text-secondary tabular-nums">
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
          {
            emoji: '✍️',
            label: 'Rewrite copy',
            prompt: 'Rewrite the title and description for SEO and emotional appeal.',
          },
          {
            emoji: '💵',
            label: 'Suggest pricing',
            prompt: 'Suggest pricing based on competitor median + AOV.',
          },
          {
            emoji: '📸',
            label: 'Generate lifestyle photos',
            prompt:
              'Generate 3 lifestyle photos for this product, warm tones, kinari linen background.',
          },
          {
            emoji: '🎬',
            label: 'Generate hero video',
            prompt: 'Generate a 4s hero loop video for this product, golden hour lighting.',
          },
          {
            emoji: '🏷️',
            label: 'Suggest a discount',
            prompt: 'Suggest a launch discount with a code I can copy.',
          },
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
                    className="border-border-subtle bg-bg-deep group relative flex aspect-square items-center justify-center rounded-md border text-[44px]"
                  >
                    <span aria-hidden>{img}</span>
                    {i === 0 ? (
                      <Badge tone="forge" className="absolute left-2 top-2 !text-[10px]">
                        cover
                      </Badge>
                    ) : null}
                    <button
                      aria-label="Remove image"
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
              <CardTitle>SEO</CardTitle>
              <Badge tone="info" className="!text-[10px]">
                auto
              </Badge>
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
                <select className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none">
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
                  className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none"
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
