'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useState } from 'react'

import { useCopilot, useCopilotContext } from '@/components/copilot/copilot-provider'
import { RichEditor } from '@/components/cms/rich-editor'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Icon } from '@/components/ui/icons'
import { getCmsPage, type CmsStatus } from '@/lib/cms-mocks'
import { formatDateTime } from '@/lib/format'

const STATUS_TONE = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
} as const

export default function PageEditorPage({ params }: { params: { siteId: string; pageId: string } }) {
  const initial = getCmsPage(params.pageId)
  useCopilotContext({ kind: 'global' })
  const copilot = useCopilot()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [body, setBody] = useState(initial?.body ?? '<p></p>')
  const [status, setStatus] = useState<CmsStatus>(initial?.status ?? 'draft')
  const [savedAt, setSavedAt] = useState<string | null>(initial?.updatedAt ?? null)
  const [dirty, setDirty] = useState(false)

  if (!initial) return notFound()

  const onSave = () => {
    // Mock save — once trpc.cms.update lands, replace with mutateAsync.
    setSavedAt(new Date().toISOString())
    setDirty(false)
  }

  const askCopilot = (prompt: string) => {
    copilot.setOpen(true)
    void copilot.send(prompt)
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <div className="text-caption text-text-muted flex items-center gap-2 font-mono">
        <Link href={`/sites/${params.siteId}/pages`} className="hover:text-text-primary">
          Pages
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-text-secondary">{initial.title}</span>
      </div>

      <PageHeader
        eyebrow={`/${slug.replace(/^\//, '')}`}
        title={title || '(untitled page)'}
        meta={
          <>
            <Badge tone={STATUS_TONE[status]} dot={status !== 'archived'}>
              {status}
            </Badge>
            <span>·</span>
            <span>last saved</span>
            <span className="text-text-secondary">{savedAt ? formatDateTime(savedAt) : '—'}</span>
            {dirty ? (
              <>
                <span>·</span>
                <Badge tone="warning" dot>
                  unsaved
                </Badge>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Eye size={14} /> Preview
            </Button>
            <Button variant="secondary" onClick={onSave} disabled={!dirty}>
              <Icon.Check size={14} /> Save draft
            </Button>
            <Button>
              <Icon.Sparkle size={14} /> Publish
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Body */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Page body</CardTitle>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => askCopilot(`Rewrite this page in a warmer voice: ${title}`)}
              >
                <Icon.Sparkle size={12} /> Rewrite with AI
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <RichEditor
                value={body}
                onChange={(html) => {
                  setBody(html)
                  setDirty(true)
                }}
                placeholder="Start writing the page body…"
                className="rounded-none border-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label="Title" required>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setDirty(true)
                  }}
                />
              </Field>
              <Field label="Slug" hint="Used in the URL.">
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setDirty(true)
                  }}
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as CmsStatus)
                    setDirty(true)
                  }}
                  className="border-border-strong bg-bg-deep text-small text-text-primary focus:border-forge-orange/60 h-9 w-full rounded-md border px-3 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <Badge tone="info" className="!text-[10px]">
                auto
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label="Meta description" hint="120-160 characters works best.">
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setDirty(true)
                  }}
                  className="min-h-24"
                />
              </Field>
              <Button
                size="xs"
                variant="secondary"
                onClick={() =>
                  askCopilot(`Suggest SEO meta title + description for this page: ${title}`)
                }
              >
                <Icon.Sparkle size={12} /> Generate w/ AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-small text-text-secondary">
                Authored by <strong className="text-text-primary">{initial.author}</strong>
              </p>
              <p className="text-caption text-text-muted mt-1 font-mono">
                Created {formatDateTime(initial.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
