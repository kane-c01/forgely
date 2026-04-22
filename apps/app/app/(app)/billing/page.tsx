'use client'

/**
 * Billing — subscription status, plan upgrade + CN checkout flow.
 *
 * Real-data flow:
 *   1. `billing.subscription` → current plan / status / renewal date.
 *   2. `billing.listTransactions` → ledger history.
 *   3. Click "Buy Pro (¥599/月)" →
 *        mutation `billing.createWechatPayCheckout`
 *        → show QR code drawer
 *        → polling `billing.checkPayment` (every 3s)
 *        → on paid: router.push('/billing?success=1') and invalidate subscription.
 *
 * @owner W4 — payments real
 */
import { QRCodeSVG } from 'qrcode.react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerHeader } from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icons'
import { trpc } from '@/lib/trpc'

type Channel = 'wechat' | 'alipay'
type PlanSlug = 'starter' | 'pro' | 'agency'
type Cadence = 'monthly' | 'yearly'

interface PlanCardSpec {
  slug: PlanSlug
  name: string
  tagline: string
  priceMonthlyFen: number
  priceYearlyFen: number
  credits: number
  features: string[]
  popular?: boolean
}

const PLANS: PlanCardSpec[] = [
  {
    slug: 'starter',
    name: 'Starter',
    tagline: '个人创作者起步',
    priceMonthlyFen: 9900,
    priceYearlyFen: 99000,
    credits: 1500,
    features: ['1 站点', '1500 积分/月', '基础 AI 生成'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    tagline: '中小团队 · 最受欢迎',
    priceMonthlyFen: 59900,
    priceYearlyFen: 599000,
    credits: 6000,
    features: ['5 站点', '6000 积分/月', '全部 AI Copilot 功能', '自定义域名'],
    popular: true,
  },
  {
    slug: 'agency',
    name: 'Agency',
    tagline: '代运营 / 工作室',
    priceMonthlyFen: 249900,
    priceYearlyFen: 2499000,
    credits: 25000,
    features: ['25 站点', '25000 积分/月', '白牌导出', '优先支持'],
  },
]

const fenToRmb = (fen: number): string => `¥${(fen / 100).toFixed(0)}`

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return '—'
  }
}

const formatDateTime = (iso: string | Date): string => {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TX_TYPE_LABEL: Record<string, string> = {
  purchase: '一次性购买',
  subscription: '订阅积分',
  consumption: '消耗',
  refund: '退款',
  gift: '赠送',
  promotion: '促销',
  adjustment: '调整',
  reservation_release: '预留释放',
}

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [cadence, setCadence] = useState<Cadence>('monthly')
  const [drawer, setDrawer] = useState<{
    plan: PlanSlug
    channel: Channel
    cadence: Cadence
  } | null>(null)

  const utils = trpc.useUtils()
  const subQuery = trpc.billing.subscription.useQuery()
  const txQuery = trpc.billing.listTransactions.useQuery({ limit: 20 })
  const wechatMutation = trpc.billing.createWechatPayCheckout.useMutation()
  const alipayMutation = trpc.billing.createAlipayCheckout.useMutation()

  const successBanner = searchParams?.get('success') === '1'

  const currentPlan = subQuery.data?.plan ?? null
  const currentStatus = subQuery.data?.status ?? null

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        description="订阅计划、积分钱包、账单记录与支付方式。"
      />

      {successBanner ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <div className="flex items-center gap-2">
            <Icon.Check size={16} /> 支付成功，订阅已激活。
          </div>
        </div>
      ) : null}

      {/* Current subscription */}
      <section className="border-border-subtle bg-bg-surface rounded-lg border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption text-text-muted font-mono uppercase tracking-wide">
              Current plan
            </p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="font-heading text-h2 text-text-primary">
                {currentPlan ? currentPlan.toUpperCase() : 'FREE'}
              </h2>
              {currentStatus ? (
                <Badge tone={currentStatus === 'active' ? 'success' : 'warning'} dot>
                  {currentStatus}
                </Badge>
              ) : (
                <Badge tone="outline">未订阅</Badge>
              )}
            </div>
            {subQuery.data?.currentPeriodEnd ? (
              <p className="text-caption text-text-muted mt-2 font-mono">
                下一期：{formatDate(String(subQuery.data.currentPeriodEnd))}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={cadence === 'monthly' ? 'primary' : 'ghost'}
              onClick={() => setCadence('monthly')}
            >
              月付
            </Button>
            <Button
              variant={cadence === 'yearly' ? 'primary' : 'ghost'}
              onClick={() => setCadence('yearly')}
            >
              年付（省 2 个月）
            </Button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = cadence === 'monthly' ? p.priceMonthlyFen : p.priceYearlyFen
          const isCurrent = currentPlan === p.slug
          return (
            <div
              key={p.slug}
              className={`flex flex-col rounded-lg border p-5 ${
                p.popular
                  ? 'border-forge-orange/50 bg-forge-orange/5'
                  : 'border-border-subtle bg-bg-surface'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-heading text-h3 text-text-primary">{p.name}</p>
                  <p className="text-caption text-text-muted mt-1">{p.tagline}</p>
                </div>
                {p.popular ? <Badge tone="warning">推荐</Badge> : null}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-text-primary text-[32px]">
                  {fenToRmb(price)}
                </span>
                <span className="text-caption text-text-muted">
                  / {cadence === 'monthly' ? '月' : '年'}
                </span>
              </div>

              <ul className="text-small text-text-secondary mt-4 flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Icon.Check size={14} className="text-forge-amber mt-[2px]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2">
                <Button
                  className="flex-1"
                  disabled={isCurrent}
                  onClick={() => setDrawer({ plan: p.slug, channel: 'wechat', cadence })}
                >
                  {isCurrent ? '当前计划' : `微信 · 购买 ${p.name}`}
                </Button>
                <Button
                  variant="ghost"
                  disabled={isCurrent}
                  onClick={() => setDrawer({ plan: p.slug, channel: 'alipay', cadence })}
                  aria-label="支付宝支付"
                >
                  <Icon.Wallet size={14} />
                </Button>
              </div>
            </div>
          )
        })}
      </section>

      {/* Transactions */}
      <section className="border-border-subtle bg-bg-surface rounded-lg border">
        <header className="border-border-subtle flex items-center justify-between border-b px-5 py-3">
          <p className="font-heading text-h4 text-text-primary">交易记录</p>
          {txQuery.isLoading ? (
            <span className="text-caption text-text-muted font-mono">加载中…</span>
          ) : null}
        </header>
        <div className="divide-border-subtle divide-y">
          {(txQuery.data?.items ?? []).length === 0 ? (
            <p className="text-caption text-text-muted px-5 py-6 font-mono">暂无交易记录</p>
          ) : (
            txQuery.data?.items.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex flex-col">
                  <p className="text-small text-text-primary">
                    {TX_TYPE_LABEL[tx.type] ?? tx.type} · {tx.description}
                  </p>
                  <p className="text-caption text-text-muted font-mono">
                    {formatDateTime(tx.createdAt as unknown as string)}
                  </p>
                </div>
                <span
                  className={`font-display tabular-nums ${
                    tx.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount.toLocaleString('zh-CN')} 积分
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <PaymentDrawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        plan={drawer?.plan ?? null}
        channel={drawer?.channel ?? null}
        cadence={drawer?.cadence ?? 'monthly'}
        createWechatCheckout={wechatMutation}
        createAlipayCheckout={alipayMutation}
        onSuccess={() => {
          utils.billing.subscription.invalidate()
          utils.billing.listTransactions.invalidate()
          setDrawer(null)
          router.push('/billing?success=1')
        }}
      />
    </div>
  )
}

// ─── Payment drawer ────────────────────────────────────────────────────────

interface PaymentDrawerProps {
  open: boolean
  onClose: () => void
  plan: PlanSlug | null
  channel: Channel | null
  cadence: Cadence
  createWechatCheckout: ReturnType<typeof trpc.billing.createWechatPayCheckout.useMutation>
  createAlipayCheckout: ReturnType<typeof trpc.billing.createAlipayCheckout.useMutation>
  onSuccess: () => void
}

function PaymentDrawer({
  open,
  onClose,
  plan,
  channel,
  cadence,
  createWechatCheckout,
  createAlipayCheckout,
  onSuccess,
}: PaymentDrawerProps) {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !plan || !channel) {
      setOrderId(null)
      setQrPayload(null)
      setRedirectUrl(null)
      setError(null)
      return
    }

    setError(null)
    setOrderId(null)
    setQrPayload(null)
    setRedirectUrl(null)

    const run = async () => {
      try {
        if (channel === 'wechat') {
          const r = await createWechatCheckout.mutateAsync({
            planSlug: plan,
            cadence,
            scene: 'native',
          })
          setOrderId(r.orderId)
          setQrPayload(r.qrCode ?? null)
          setRedirectUrl(r.redirectUrl ?? null)
        } else {
          const r = await createAlipayCheckout.mutateAsync({
            planSlug: plan,
            cadence,
            scene: 'native',
          })
          setOrderId(r.orderId)
          setQrPayload(r.qrCode ?? null)
          setRedirectUrl(r.redirectUrl ?? null)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    void run()
    // Mutations are stable across renders — lint rule would require including
    // them, but including them triggers a re-create loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan, channel, cadence])

  // Polling
  const pollQuery = trpc.billing.checkPayment.useQuery(
    { orderId: orderId ?? '' },
    { enabled: !!orderId && open, refetchInterval: 3000 },
  )

  useEffect(() => {
    if (pollQuery.data?.status === 'paid') {
      onSuccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollQuery.data?.status])

  const title = useMemo(() => {
    if (!plan || !channel) return '支付'
    const label = channel === 'wechat' ? '微信支付' : '支付宝'
    return `${label} · 订阅 ${plan.toUpperCase()}（${cadence === 'yearly' ? '年' : '月'}付）`
  }, [plan, channel, cadence])

  return (
    <Drawer open={open} onClose={onClose} side="right" width="440px" ariaLabel={title}>
      <DrawerHeader>
        <p className="font-heading text-h4 text-text-primary">{title}</p>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-muted hover:text-text-primary"
        >
          <Icon.Close size={16} />
        </button>
      </DrawerHeader>
      <DrawerBody className="flex flex-col gap-4">
        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            下单失败：{error}
          </div>
        ) : null}

        {!qrPayload && !redirectUrl && !error ? (
          <p className="text-caption text-text-muted font-mono">正在生成订单…</p>
        ) : null}

        {qrPayload ? (
          <div className="border-border-subtle bg-bg-elevated flex flex-col items-center gap-3 rounded-lg border p-5">
            <QRCodeSVG
              value={qrPayload}
              size={220}
              bgColor="transparent"
              fgColor="currentColor"
              className="text-text-primary"
            />
            <p className="text-caption text-text-muted text-center font-mono">
              打开 {channel === 'wechat' ? '微信' : '支付宝'} 扫一扫支付
            </p>
            <p className="text-caption text-text-muted font-mono">订单号：{orderId}</p>
          </div>
        ) : null}

        {redirectUrl && !qrPayload ? (
          <div className="border-border-subtle bg-bg-elevated flex flex-col gap-3 rounded-lg border p-4">
            <p className="text-small">请跳转到支付页面完成支付：</p>
            <a
              href={redirectUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-forge-amber text-small break-all font-mono underline"
            >
              {redirectUrl}
            </a>
          </div>
        ) : null}

        {orderId ? (
          <div className="border-border-subtle bg-bg-surface text-small text-text-muted rounded-lg border p-4">
            {pollQuery.data?.status === 'paid' ? (
              <span className="text-emerald-300">
                <Icon.Check size={14} className="inline" /> 已支付，正在跳转…
              </span>
            ) : (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="ml-2">等待支付中（每 3 秒轮询）…</span>
              </>
            )}
          </div>
        ) : null}
      </DrawerBody>
    </Drawer>
  )
}
