'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icons'
import { Field, Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/format'
import type { MediaAsset } from '@/lib/types'

interface Props {
  asset: MediaAsset | null
  onClose: () => void
}

export function MediaDetailDrawer({ asset, onClose }: Props) {
  return (
    <Drawer open={asset !== null} onClose={onClose} side="right" width="460px" ariaLabel="Asset details">
      {asset ? (
        <>
          <DrawerHeader>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded bg-bg-elevated text-h3">
                {asset.url}
              </span>
              <div>
                <p className="font-heading text-body text-text-primary">{asset.filename}</p>
                <p className="font-mono text-caption text-text-muted">
                  {asset.width || '—'}×{asset.height || '—'} · {(asset.sizeKb / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              <Icon.Close size={16} />
            </button>
          </DrawerHeader>

          <DrawerBody>
            <div className="aspect-video w-full rounded-md border border-border-subtle bg-gradient-to-br from-bg-elevated to-bg-deep grid place-items-center text-[96px]">
              <span aria-hidden>{asset.url}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-small">
              <Stat label="Source">
                <Badge tone={asset.source === 'ai-generated' ? 'forge' : 'neutral'}>
                  {asset.source}
                </Badge>
              </Stat>
              <Stat label="Kind">
                <Badge tone="outline">{asset.kind}</Badge>
              </Stat>
              {asset.generator ? (
                <Stat label="Generator">
                  <span className="font-mono uppercase tracking-[0.12em] text-forge-amber">
                    {asset.generator}
                  </span>
                </Stat>
              ) : null}
              <Stat label="Used in">
                <span className="font-mono tabular-nums text-text-primary">{asset.uses} place{asset.uses === 1 ? '' : 's'}</span>
              </Stat>
              <Stat label="Created">
                <span className="font-mono text-text-secondary">{formatDateTime(asset.createdAt)}</span>
              </Stat>
            </div>

            {asset.prompt ? (
              <div className="mt-4">
                <p className="mb-1.5 font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
                  Prompt
                </p>
                <p className="rounded-md border border-border-subtle bg-bg-deep px-3 py-2 font-mono text-caption text-text-secondary">
                  {asset.prompt}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3">
              <Field label="Filename">
                <Input defaultValue={asset.filename} />
              </Field>
              <Field label="Alt text" hint="Used by SEO and accessibility tools.">
                <Input defaultValue="" placeholder="Describe this image…" />
              </Field>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button size="sm" variant="ghost">
              <Icon.Trash size={14} /> Delete
            </Button>
            <Button size="sm" variant="secondary">
              <Icon.Sparkle size={14} /> Generate variant
            </Button>
            <Button size="sm">
              <Icon.Download size={14} /> Download
            </Button>
          </DrawerFooter>
        </>
      ) : null}
    </Drawer>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-caption uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}
