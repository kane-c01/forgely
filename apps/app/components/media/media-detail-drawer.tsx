'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icons'
import { Field, Input } from '@/components/ui/input'
import { useT } from '@/lib/i18n'
import { formatDateTime } from '@/lib/format'
import type { MediaAsset } from '@/lib/types'

interface Props {
  asset: MediaAsset | null
  onClose: () => void
}

export function MediaDetailDrawer({ asset, onClose }: Props) {
  const t = useT()
  return (
    <Drawer
      open={asset !== null}
      onClose={onClose}
      side="right"
      width="460px"
      ariaLabel="Asset details"
    >
      {asset ? (
        <>
          <DrawerHeader>
            <div className="flex items-center gap-2.5">
              <span className="bg-bg-elevated text-h3 grid h-8 w-8 place-items-center rounded">
                {asset.url}
              </span>
              <div>
                <p className="font-heading text-body text-text-primary">{asset.filename}</p>
                <p className="text-caption text-text-muted font-mono">
                  {asset.width || '—'}×{asset.height || '—'} · {(asset.sizeKb / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary rounded-md p-1.5"
              aria-label={t.mediaDetail.close}
            >
              <Icon.Close size={16} />
            </button>
          </DrawerHeader>

          <DrawerBody>
            <div className="border-border-subtle from-bg-elevated to-bg-deep grid aspect-video w-full place-items-center rounded-md border bg-gradient-to-br text-[96px]">
              <span aria-hidden>{asset.url}</span>
            </div>

            <div className="text-small mt-4 grid grid-cols-2 gap-3">
              <Stat label={t.mediaDetail.source}>
                <Badge tone={asset.source === 'ai-generated' ? 'forge' : 'neutral'}>
                  {asset.source}
                </Badge>
              </Stat>
              <Stat label={t.mediaDetail.kind}>
                <Badge tone="outline">{asset.kind}</Badge>
              </Stat>
              {asset.generator ? (
                <Stat label={t.mediaDetail.generator}>
                  <span className="text-forge-amber font-mono uppercase tracking-[0.12em]">
                    {asset.generator}
                  </span>
                </Stat>
              ) : null}
              <Stat label={t.mediaDetail.usedIn}>
                <span className="text-text-primary font-mono tabular-nums">
                  {asset.uses} {asset.uses === 1 ? t.mediaDetail.place : t.mediaDetail.placePlural}
                </span>
              </Stat>
              <Stat label={t.mediaDetail.created}>
                <span className="text-text-secondary font-mono">
                  {formatDateTime(asset.createdAt)}
                </span>
              </Stat>
            </div>

            {asset.prompt ? (
              <div className="mt-4">
                <p className="text-caption text-text-muted mb-1.5 font-mono uppercase tracking-[0.12em]">
                  {t.mediaDetail.prompt}
                </p>
                <p className="border-border-subtle bg-bg-deep text-caption text-text-secondary rounded-md border px-3 py-2 font-mono">
                  {asset.prompt}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3">
              <Field label={t.mediaDetail.filename}>
                <Input defaultValue={asset.filename} />
              </Field>
              <Field label={t.mediaDetail.altText} hint={t.mediaDetail.altTextHint}>
                <Input defaultValue="" placeholder={t.mediaDetail.describeImage} />
              </Field>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button size="sm" variant="ghost">
              <Icon.Trash size={14} /> {t.mediaDetail.delete}
            </Button>
            <Button size="sm" variant="secondary">
              <Icon.Sparkle size={14} /> {t.mediaDetail.generateVariant}
            </Button>
            <Button size="sm">
              <Icon.Download size={14} /> {t.mediaDetail.download}
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
      <p className="text-caption text-text-muted font-mono uppercase tracking-[0.12em]">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}
