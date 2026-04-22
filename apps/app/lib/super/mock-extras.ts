/**
 * Mock data for /super "extras" — the modules added in the late-Sprint-3
 * push so the Super console looks complete to the OWNER while we wait
 * for the underlying tRPC routers to land.
 *
 * Modules covered:
 *   - Plugins   → `superPluginsRouter.list`
 *   - Health    → `superHealthRouter.overview`
 *   - AI Ops    → `superAiOpsRouter.overview` (router still TODO — UI
 *                 leads, backend trails)
 *   - Sites     → `superSitesRouter.list` (router still TODO)
 *
 * The shapes mirror their respective routers 1:1 so the page can swap
 * the import to `trpc.super.*.useQuery({})` without rewriting JSX.
 */

import { MOCK_NOW_UTC_MS } from './mock-data'

// ─────────────────────────────────────────────────────────────────────────
// Plugins
// ─────────────────────────────────────────────────────────────────────────

export type PluginDecision = 'approve' | 'reject' | 'pending'

export interface SuperPluginRow {
  pluginId: string
  pluginName: string
  version: string
  developer: string
  category: '主题' | '集成' | '分析' | '物流' | '支付' | '客服' | '本地化'
  installs: number
  enabled: number
  firstInstalledAt: number
  lastUpdatedAt: number
  decision: PluginDecision
}

const PLUGIN_FIXTURES: SuperPluginRow[] = [
  {
    pluginId: 'plg_baidu_seo',
    pluginName: '百度站长 SEO 提交',
    version: '1.4.2',
    developer: 'Forgely 官方',
    category: '本地化',
    installs: 1_842,
    enabled: 1_701,
    firstInstalledAt: MOCK_NOW_UTC_MS - 180 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 3 * 24 * 60 * 60 * 1000,
    decision: 'approve',
  },
  {
    pluginId: 'plg_wechat_share',
    pluginName: '微信分享 SDK',
    version: '2.0.1',
    developer: 'Forgely 官方',
    category: '集成',
    installs: 3_421,
    enabled: 3_398,
    firstInstalledAt: MOCK_NOW_UTC_MS - 240 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 14 * 24 * 60 * 60 * 1000,
    decision: 'approve',
  },
  {
    pluginId: 'plg_yto_logistics',
    pluginName: '圆通速递跨境物流',
    version: '0.9.8',
    developer: '杭州盛物科技',
    category: '物流',
    installs: 612,
    enabled: 583,
    firstInstalledAt: MOCK_NOW_UTC_MS - 90 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 7 * 24 * 60 * 60 * 1000,
    decision: 'approve',
  },
  {
    pluginId: 'plg_aliyun_oss_picker',
    pluginName: '阿里云 OSS 媒体选择器',
    version: '1.2.0',
    developer: 'Forgely 官方',
    category: '集成',
    installs: 1_103,
    enabled: 1_058,
    firstInstalledAt: MOCK_NOW_UTC_MS - 120 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 30 * 24 * 60 * 60 * 1000,
    decision: 'approve',
  },
  {
    pluginId: 'plg_unverified_chatbot',
    pluginName: '匿名客服机器人',
    version: '0.1.0',
    developer: 'unknown@外部开发者',
    category: '客服',
    installs: 4,
    enabled: 4,
    firstInstalledAt: MOCK_NOW_UTC_MS - 6 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 1 * 24 * 60 * 60 * 1000,
    decision: 'pending',
  },
  {
    pluginId: 'plg_pinduoduo_sync',
    pluginName: '拼多多商品同步',
    version: '0.4.1',
    developer: '深圳 LumaCommerce',
    category: '集成',
    installs: 28,
    enabled: 22,
    firstInstalledAt: MOCK_NOW_UTC_MS - 21 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 11 * 24 * 60 * 60 * 1000,
    decision: 'pending',
  },
  {
    pluginId: 'plg_outdated_loyalty',
    pluginName: '会员积分宝（已停更）',
    version: '0.5.6',
    developer: '北京小蜜科技',
    category: '客服',
    installs: 11,
    enabled: 0,
    firstInstalledAt: MOCK_NOW_UTC_MS - 300 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: MOCK_NOW_UTC_MS - 200 * 24 * 60 * 60 * 1000,
    decision: 'reject',
  },
]

export function getSuperPlugins(): SuperPluginRow[] {
  return PLUGIN_FIXTURES
}

// ─────────────────────────────────────────────────────────────────────────
// System Health
// ─────────────────────────────────────────────────────────────────────────

export type HealthSourceStatus = 'ok' | 'unconfigured' | 'unavailable' | 'error'

export interface HealthSourceCard {
  id:
    | 'sentry'
    | 'posthog'
    | 'cloudflare'
    | 'aliyun_oss'
    | 'postgres'
    | 'redis'
    | 'ali_sms'
    | 'wechatpay'
    | 'alipay'
  label: string
  vendor: string
  status: HealthSourceStatus
  primaryMetric: string
  secondaryMetric?: string
  errorHint?: string
  fetchedAt: number
}

export interface SystemHealthOverview {
  generatedAt: number
  status: 'all_systems_ok' | 'degraded' | 'outage'
  sources: HealthSourceCard[]
}

const HEALTH_OVERVIEW: SystemHealthOverview = {
  generatedAt: MOCK_NOW_UTC_MS,
  status: 'degraded',
  sources: [
    {
      id: 'postgres',
      label: '主数据库',
      vendor: '阿里云 PolarDB-PG',
      status: 'ok',
      primaryMetric: '连接 14 / 100',
      secondaryMetric: 'P95 4.2ms · 死元组 0.6%',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'redis',
      label: '缓存与队列',
      vendor: '阿里云 Redis',
      status: 'ok',
      primaryMetric: '内存 27% · 256MB',
      secondaryMetric: 'BullMQ 11 jobs 处理中',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'aliyun_oss',
      label: '对象存储',
      vendor: '阿里云 OSS',
      status: 'ok',
      primaryMetric: '已用 184 GB / 1 TB',
      secondaryMetric: '过去 24h 请求 12.4 万',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'cloudflare',
      label: '海外站点 CDN',
      vendor: 'Cloudflare R2 + Pages',
      status: 'ok',
      primaryMetric: 'R2 12.7 GB · 142 站点',
      secondaryMetric: 'Workers CPU 4.3s / 24h',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'sentry',
      label: '错误监控',
      vendor: 'Sentry',
      status: 'ok',
      primaryMetric: '24h 新错误 3',
      secondaryMetric: '未解决 8 · 当前 0.2/min',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'posthog',
      label: '产品分析',
      vendor: 'PostHog',
      status: 'ok',
      primaryMetric: 'DAU 4,921',
      secondaryMetric: 'WAU 17,082',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'ali_sms',
      label: '短信通道',
      vendor: '阿里云 SMS',
      status: 'unconfigured',
      primaryMetric: '尚未配置',
      errorHint: '请到 .env 设置 ALI_SMS_ACCESS_KEY_ID',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'wechatpay',
      label: '微信支付',
      vendor: '微信支付 V3',
      status: 'ok',
      primaryMetric: '24h 成功 412 / 失败 3',
      secondaryMetric: '回调延迟 P95 1.4s',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
    {
      id: 'alipay',
      label: '支付宝',
      vendor: 'Alipay 开放平台',
      status: 'error',
      primaryMetric: '回调验签失败 ×7',
      errorHint: '请检查 ALIPAY_PUBLIC_KEY 是否过期',
      fetchedAt: MOCK_NOW_UTC_MS,
    },
  ],
}

export function getHealthOverview(): SystemHealthOverview {
  return HEALTH_OVERVIEW
}

// ─────────────────────────────────────────────────────────────────────────
// AI Ops
// ─────────────────────────────────────────────────────────────────────────

export type AiProviderName = 'deepseek' | 'qwen' | 'anthropic' | 'kling' | 'vidu' | 'flux' | 'meshy'

export interface AiProviderRow {
  provider: AiProviderName
  region: 'cn' | 'global'
  model: string
  callCount24h: number
  successRate: number
  costUsd24h: number
  p95LatencyMs: number
  status: 'ok' | 'rate_limited' | 'down' | 'unconfigured'
  lastErrorAt?: number
  lastErrorMessage?: string
}

export interface AiOpsOverview {
  generatedAt: number
  totals: {
    calls24h: number
    costUsd24h: number
    revenueShare: number
    activeProviders: number
  }
  series: {
    ts: number
    deepseekUsd: number
    qwenUsd: number
    anthropicUsd: number
    mediaUsd: number
  }[]
  topConsumers: { userId: string; userLabel: string; calls24h: number; usd24h: number }[]
  providers: AiProviderRow[]
  recentErrors: {
    id: string
    occurredAt: number
    provider: AiProviderName
    code: string
    message: string
    userLabel: string
  }[]
}

const HOUR = 60 * 60 * 1000

function makeAiSeries(): AiOpsOverview['series'] {
  const out: AiOpsOverview['series'] = []
  for (let i = 23; i >= 0; i--) {
    const ts = MOCK_NOW_UTC_MS - i * HOUR
    const wave = Math.sin((i / 24) * Math.PI * 2)
    out.push({
      ts,
      deepseekUsd: 4.2 + wave * 1.4,
      qwenUsd: 2.1 + wave * 0.8,
      anthropicUsd: 1.5 + wave * 0.4,
      mediaUsd: 6.8 + wave * 2.1,
    })
  }
  return out
}

const AI_OPS_OVERVIEW: AiOpsOverview = {
  generatedAt: MOCK_NOW_UTC_MS,
  totals: {
    calls24h: 84_217,
    costUsd24h: 327.84,
    revenueShare: 18.7,
    activeProviders: 7,
  },
  series: makeAiSeries(),
  topConsumers: [
    { userId: 'u_8412', userLabel: '广州 · ToyBloom 工厂', calls24h: 1_842, usd24h: 18.42 },
    { userId: 'u_7301', userLabel: '深圳 · Lumina 美妆', calls24h: 1_521, usd24h: 14.97 },
    { userId: 'u_5128', userLabel: '杭州 · Aurea 咖啡', calls24h: 1_207, usd24h: 11.12 },
    { userId: 'u_6420', userLabel: '上海 · LinkLane 服饰', calls24h: 982, usd24h: 8.86 },
    { userId: 'u_3119', userLabel: '青岛 · NorthMariner 户外', calls24h: 731, usd24h: 6.74 },
  ],
  providers: [
    {
      provider: 'deepseek',
      region: 'cn',
      model: 'deepseek-chat',
      callCount24h: 38_421,
      successRate: 99.7,
      costUsd24h: 86.4,
      p95LatencyMs: 1_240,
      status: 'ok',
    },
    {
      provider: 'qwen',
      region: 'cn',
      model: 'qwen-plus / qwen-vl-plus',
      callCount24h: 21_807,
      successRate: 99.2,
      costUsd24h: 42.1,
      p95LatencyMs: 1_810,
      status: 'ok',
    },
    {
      provider: 'anthropic',
      region: 'global',
      model: 'claude-sonnet-4',
      callCount24h: 8_321,
      successRate: 98.8,
      costUsd24h: 51.7,
      p95LatencyMs: 2_450,
      status: 'ok',
    },
    {
      provider: 'kling',
      region: 'cn',
      model: 'kling-2.0',
      callCount24h: 2_104,
      successRate: 96.4,
      costUsd24h: 78.2,
      p95LatencyMs: 38_400,
      status: 'rate_limited',
      lastErrorAt: MOCK_NOW_UTC_MS - 18 * 60 * 1000,
      lastErrorMessage: '触发了 Kling 阵列配额限制（30 RPM），自动回落到 Vidu。',
    },
    {
      provider: 'vidu',
      region: 'cn',
      model: 'vidu-1.5',
      callCount24h: 1_321,
      successRate: 97.9,
      costUsd24h: 41.2,
      p95LatencyMs: 26_700,
      status: 'ok',
    },
    {
      provider: 'flux',
      region: 'global',
      model: 'flux-1.1-pro',
      callCount24h: 11_820,
      successRate: 98.4,
      costUsd24h: 22.7,
      p95LatencyMs: 4_900,
      status: 'ok',
    },
    {
      provider: 'meshy',
      region: 'global',
      model: 'meshy-4-3d',
      callCount24h: 423,
      successRate: 95.1,
      costUsd24h: 5.5,
      p95LatencyMs: 62_800,
      status: 'ok',
    },
  ],
  recentErrors: [
    {
      id: 'err_1',
      occurredAt: MOCK_NOW_UTC_MS - 12 * 60 * 1000,
      provider: 'kling',
      code: 'RATE_LIMIT',
      message: '触发 Kling 阵列限流（30 RPM）— 已自动转 Vidu',
      userLabel: '广州 · ToyBloom 工厂',
    },
    {
      id: 'err_2',
      occurredAt: MOCK_NOW_UTC_MS - 47 * 60 * 1000,
      provider: 'anthropic',
      code: 'TIMEOUT',
      message: 'Claude 响应 30s 超时 — 单次回退至 DeepSeek',
      userLabel: '杭州 · Aurea 咖啡',
    },
    {
      id: 'err_3',
      occurredAt: MOCK_NOW_UTC_MS - 2 * HOUR,
      provider: 'deepseek',
      code: 'INVALID_RESPONSE',
      message: 'DeepSeek 返回非法 JSON — 已重试一次成功',
      userLabel: '深圳 · Lumina 美妆',
    },
  ],
}

export function getAiOpsOverview(): AiOpsOverview {
  return AI_OPS_OVERVIEW
}

// ─────────────────────────────────────────────────────────────────────────
// Sites
// ─────────────────────────────────────────────────────────────────────────

export type SuperSiteStatus = 'live' | 'frozen' | 'building' | 'failed' | 'archived'
export type HostingRegion = 'auto' | 'us' | 'eu' | 'apac'
export type DomainStatus =
  | 'none'
  | 'pending_verification'
  | 'verified'
  | 'ssl_provisioning'
  | 'active'
  | 'failed'

export interface SuperSiteRow {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  domainStatus: DomainStatus
  hostingRegion: HostingRegion
  hostingAddonActive: boolean
  ownerLabel: string
  ownerRegion: '中国' | '海外'
  status: SuperSiteStatus
  productsCount: number
  ordersLast30: number
  revenueUsd30: number
  createdAt: number
  lastDeployedAt: number
  flaggedReason?: string
}

const SITES_FIXTURES: SuperSiteRow[] = [
  {
    id: 'site_toybloom',
    name: 'ToyBloom Toys',
    subdomain: 'toybloom',
    customDomain: 'toybloom.com',
    domainStatus: 'active',
    hostingRegion: 'us',
    hostingAddonActive: true,
    ownerLabel: '广州 · 玩美玩具',
    ownerRegion: '中国',
    status: 'live',
    productsCount: 142,
    ordersLast30: 318,
    revenueUsd30: 24_812,
    createdAt: MOCK_NOW_UTC_MS - 84 * 24 * 60 * 60 * 1000,
    lastDeployedAt: MOCK_NOW_UTC_MS - 3 * 60 * 60 * 1000,
  },
  {
    id: 'site_lumina',
    name: 'Lumina Skin',
    subdomain: 'lumina-skin',
    customDomain: 'luminaskin.com',
    domainStatus: 'active',
    hostingRegion: 'eu',
    hostingAddonActive: true,
    ownerLabel: '深圳 · Lumina 美妆',
    ownerRegion: '中国',
    status: 'live',
    productsCount: 38,
    ordersLast30: 1_207,
    revenueUsd30: 89_231,
    createdAt: MOCK_NOW_UTC_MS - 41 * 24 * 60 * 60 * 1000,
    lastDeployedAt: MOCK_NOW_UTC_MS - 28 * 60 * 1000,
  },
  {
    id: 'site_aurea',
    name: 'Aurea Coffee',
    subdomain: 'aurea-coffee',
    customDomain: null,
    domainStatus: 'none',
    hostingRegion: 'auto',
    hostingAddonActive: false,
    ownerLabel: '杭州 · Aurea 咖啡',
    ownerRegion: '中国',
    status: 'building',
    productsCount: 12,
    ordersLast30: 0,
    revenueUsd30: 0,
    createdAt: MOCK_NOW_UTC_MS - 4 * 60 * 60 * 1000,
    lastDeployedAt: MOCK_NOW_UTC_MS - 4 * 60 * 60 * 1000,
  },
  {
    id: 'site_norhaven',
    name: 'NorHaven Outdoors',
    subdomain: 'norhaven',
    customDomain: 'norhaven.co',
    domainStatus: 'pending_verification',
    hostingRegion: 'us',
    hostingAddonActive: true,
    ownerLabel: '青岛 · NorthMariner 户外',
    ownerRegion: '中国',
    status: 'live',
    productsCount: 67,
    ordersLast30: 412,
    revenueUsd30: 38_201,
    createdAt: MOCK_NOW_UTC_MS - 96 * 24 * 60 * 60 * 1000,
    lastDeployedAt: MOCK_NOW_UTC_MS - 18 * 60 * 60 * 1000,
  },
  {
    id: 'site_blocked_supplements',
    name: 'NaturalCure Pro',
    subdomain: 'naturalcure-pro',
    customDomain: null,
    domainStatus: 'none',
    hostingRegion: 'auto',
    hostingAddonActive: false,
    ownerLabel: '匿名 · 待核实',
    ownerRegion: '中国',
    status: 'frozen',
    productsCount: 23,
    ordersLast30: 8,
    revenueUsd30: 612,
    createdAt: MOCK_NOW_UTC_MS - 17 * 24 * 60 * 60 * 1000,
    lastDeployedAt: MOCK_NOW_UTC_MS - 6 * 24 * 60 * 60 * 1000,
    flaggedReason: 'FDA 合规扫描发现 12 项严重违规 — 已临时冻结，等待商家整改',
  },
  {
    id: 'site_failed_deploy',
    name: 'LinkLane Apparel',
    subdomain: 'linklane',
    customDomain: null,
    domainStatus: 'none',
    hostingRegion: 'apac',
    hostingAddonActive: true,
    ownerLabel: '上海 · LinkLane 服饰',
    ownerRegion: '中国',
    status: 'failed',
    productsCount: 0,
    ordersLast30: 0,
    revenueUsd30: 0,
    createdAt: MOCK_NOW_UTC_MS - 90 * 60 * 1000,
    lastDeployedAt: MOCK_NOW_UTC_MS - 90 * 60 * 1000,
    flaggedReason: 'Cloudflare Pages 部署失败：项目体积超出 25MB 上限',
  },
]

export function getSuperSites(): SuperSiteRow[] {
  return SITES_FIXTURES
}

// ─────────────────────────────────────────────────────────────────────────
// Content (platform-level docs, blog, legal, help)
// ─────────────────────────────────────────────────────────────────────────

export type ContentKind = 'docs' | 'blog' | 'legal' | 'help'
export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type ContentLocale = 'zh-CN' | 'en'

export interface SuperContentRow {
  id: string
  kind: ContentKind
  title: string
  localesAvailable: ContentLocale[]
  primaryLocale: ContentLocale
  status: ContentStatus
  author: string
  updatedAt: number
  path: string
}

const CONTENT_FIXTURES: SuperContentRow[] = [
  {
    id: 'c_pivot_cn',
    kind: 'docs',
    title: 'Forgely 中国市场战略 (PIVOT-CN)',
    localesAvailable: ['zh-CN', 'en'],
    primaryLocale: 'zh-CN',
    status: 'published',
    author: 'Alex Chen',
    updatedAt: MOCK_NOW_UTC_MS - 2 * 24 * 60 * 60 * 1000,
    path: '/docs/pivot-cn',
  },
  {
    id: 'c_blog_launch',
    kind: 'blog',
    title: 'Forgely 1.0 正式发布 — 中国工厂也能做爆款出海',
    localesAvailable: ['zh-CN'],
    primaryLocale: 'zh-CN',
    status: 'scheduled',
    author: 'Priya Patel',
    updatedAt: MOCK_NOW_UTC_MS - 8 * 60 * 60 * 1000,
    path: '/blog/forgely-1-0',
  },
  {
    id: 'c_tos',
    kind: 'legal',
    title: '用户协议 · Terms of Service',
    localesAvailable: ['zh-CN', 'en'],
    primaryLocale: 'zh-CN',
    status: 'published',
    author: 'Platform',
    updatedAt: MOCK_NOW_UTC_MS - 30 * 24 * 60 * 60 * 1000,
    path: '/legal/terms',
  },
  {
    id: 'c_privacy',
    kind: 'legal',
    title: '隐私政策 · Privacy Policy',
    localesAvailable: ['zh-CN', 'en'],
    primaryLocale: 'zh-CN',
    status: 'published',
    author: 'Platform',
    updatedAt: MOCK_NOW_UTC_MS - 30 * 24 * 60 * 60 * 1000,
    path: '/legal/privacy',
  },
  {
    id: 'c_help_wechat',
    kind: 'help',
    title: '如何绑定微信支付账户',
    localesAvailable: ['zh-CN'],
    primaryLocale: 'zh-CN',
    status: 'published',
    author: 'Lin Rossi',
    updatedAt: MOCK_NOW_UTC_MS - 4 * 24 * 60 * 60 * 1000,
    path: '/help/wechat-pay-setup',
  },
  {
    id: 'c_help_icp',
    kind: 'help',
    title: '国内独立站 ICP 备案须知',
    localesAvailable: ['zh-CN'],
    primaryLocale: 'zh-CN',
    status: 'draft',
    author: 'Lin Rossi',
    updatedAt: MOCK_NOW_UTC_MS - 2 * 60 * 60 * 1000,
    path: '/help/icp-setup',
  },
  {
    id: 'c_blog_stripe',
    kind: 'blog',
    title: 'Stripe Connect for China Merchants · Full Guide',
    localesAvailable: ['en'],
    primaryLocale: 'en',
    status: 'published',
    author: 'Marc Cohen',
    updatedAt: MOCK_NOW_UTC_MS - 12 * 24 * 60 * 60 * 1000,
    path: '/en/blog/stripe-connect-guide',
  },
  {
    id: 'c_docs_api',
    kind: 'docs',
    title: 'Forgely API — tRPC & OpenAPI',
    localesAvailable: ['en'],
    primaryLocale: 'en',
    status: 'draft',
    author: 'Alex Chen',
    updatedAt: MOCK_NOW_UTC_MS - 1 * 60 * 60 * 1000,
    path: '/en/docs/api',
  },
]

export function getSuperContent(): SuperContentRow[] {
  return CONTENT_FIXTURES
}

// ─────────────────────────────────────────────────────────────────────────
// Platform Analytics
// ─────────────────────────────────────────────────────────────────────────

export interface PlatformAnalyticsOverview {
  generatedAt: number
  funnel: { step: 1 | 2 | 3 | 4 | 5; count: number; conversionFromPrev: number }[]
  retention: { cohortDate: string; d1: number; d7: number; d30: number }[]
  channels: { label: string; visits: number; signups: number; paying: number }[]
  timeToFirstSite: { medianSeconds: number; p90Seconds: number }
  avgCredits: { current: number; previous: number }
  churnRate: { current: number; previous: number }
  dauWauMau: { dau: number; wau: number; mau: number }
}

const ANALYTICS_OVERVIEW: PlatformAnalyticsOverview = {
  generatedAt: MOCK_NOW_UTC_MS,
  funnel: [
    { step: 1, count: 124_820, conversionFromPrev: 1.0 },
    { step: 2, count: 18_234, conversionFromPrev: 0.146 },
    { step: 3, count: 12_410, conversionFromPrev: 0.68 },
    { step: 4, count: 9_128, conversionFromPrev: 0.735 },
    { step: 5, count: 4_207, conversionFromPrev: 0.461 },
  ],
  retention: [
    { cohortDate: '2026-03-W1', d1: 0.72, d7: 0.41, d30: 0.24 },
    { cohortDate: '2026-03-W2', d1: 0.74, d7: 0.43, d30: 0.26 },
    { cohortDate: '2026-03-W3', d1: 0.76, d7: 0.46, d30: 0.28 },
    { cohortDate: '2026-03-W4', d1: 0.78, d7: 0.48, d30: 0.3 },
    { cohortDate: '2026-04-W1', d1: 0.81, d7: 0.52, d30: 0.33 },
    { cohortDate: '2026-04-W2', d1: 0.79, d7: 0.5, d30: 0.0 },
    { cohortDate: '2026-04-W3', d1: 0.82, d7: 0.0, d30: 0.0 },
  ],
  channels: [
    { label: 'organic', visits: 68_421, signups: 9_284, paying: 2_412 },
    { label: 'wechat', visits: 31_204, signups: 6_428, paying: 1_102 },
    { label: 'referral', visits: 12_918, signups: 2_104, paying: 482 },
    { label: 'ads', visits: 12_277, signups: 418, paying: 211 },
  ],
  timeToFirstSite: { medianSeconds: 1_428, p90Seconds: 3_912 },
  avgCredits: { current: 2_450, previous: 2_180 },
  churnRate: { current: 4.3, previous: 5.1 },
  dauWauMau: { dau: 4_921, wau: 17_082, mau: 38_204 },
}

export function getPlatformAnalytics(): PlatformAnalyticsOverview {
  return ANALYTICS_OVERVIEW
}

// ─────────────────────────────────────────────────────────────────────────
// Support Tickets
// ─────────────────────────────────────────────────────────────────────────

export type TicketPriority = 'p1' | 'p2' | 'p3' | 'p4'
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type TicketCategory = 'billing' | 'generation' | 'compliance' | 'technical' | 'other'

export interface SupportTicketRow {
  id: string
  subject: string
  requesterLabel: string
  requesterId: string
  category: TicketCategory
  priority: TicketPriority
  assignee: string | null
  status: TicketStatus
  createdAt: number
  updatedAt: number
  firstResponseMs?: number
}

const TICKETS_FIXTURES: SupportTicketRow[] = [
  {
    id: 'tkt_1842',
    subject: '微信支付回调一直失败，订阅没激活',
    requesterLabel: '广州 · ToyBloom 工厂',
    requesterId: 'u_8412',
    category: 'billing',
    priority: 'p1',
    assignee: 'sa_lin',
    status: 'in_progress',
    createdAt: MOCK_NOW_UTC_MS - 35 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 5 * 60 * 1000,
    firstResponseMs: 8 * 60 * 1000,
  },
  {
    id: 'tkt_1841',
    subject: 'Hero 视频生成 3 次都失败，Kling 返回超时',
    requesterLabel: '深圳 · Lumina 美妆',
    requesterId: 'u_7301',
    category: 'generation',
    priority: 'p2',
    assignee: 'sa_priya',
    status: 'waiting',
    createdAt: MOCK_NOW_UTC_MS - 2 * 60 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 22 * 60 * 1000,
    firstResponseMs: 14 * 60 * 1000,
  },
  {
    id: 'tkt_1840',
    subject: '站点被 FDA 警告，请协助下架',
    requesterLabel: '匿名 · NaturalCure Pro',
    requesterId: 'u_4120',
    category: 'compliance',
    priority: 'p1',
    assignee: null,
    status: 'open',
    createdAt: MOCK_NOW_UTC_MS - 18 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 18 * 60 * 1000,
  },
  {
    id: 'tkt_1839',
    subject: '导出订单 CSV 下载 500',
    requesterLabel: '杭州 · Aurea 咖啡',
    requesterId: 'u_5128',
    category: 'technical',
    priority: 'p3',
    assignee: 'sa_marc',
    status: 'in_progress',
    createdAt: MOCK_NOW_UTC_MS - 5 * 60 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 3 * 60 * 60 * 1000,
    firstResponseMs: 45 * 60 * 1000,
  },
  {
    id: 'tkt_1838',
    subject: '希望增加 Shopee 适配器',
    requesterLabel: '青岛 · NorthMariner 户外',
    requesterId: 'u_3119',
    category: 'other',
    priority: 'p4',
    assignee: null,
    status: 'open',
    createdAt: MOCK_NOW_UTC_MS - 2 * 24 * 60 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tkt_1835',
    subject: '积分扣多了，能退回吗',
    requesterLabel: '上海 · LinkLane 服饰',
    requesterId: 'u_6420',
    category: 'billing',
    priority: 'p2',
    assignee: 'sa_lin',
    status: 'resolved',
    createdAt: MOCK_NOW_UTC_MS - 8 * 60 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 1 * 60 * 60 * 1000,
    firstResponseMs: 22 * 60 * 1000,
  },
  {
    id: 'tkt_1832',
    subject: '生成的英文文案中有中式表达',
    requesterLabel: '东莞 · BladeWood 工艺',
    requesterId: 'u_2188',
    category: 'generation',
    priority: 'p3',
    assignee: 'sa_alex',
    status: 'closed',
    createdAt: MOCK_NOW_UTC_MS - 4 * 24 * 60 * 60 * 1000,
    updatedAt: MOCK_NOW_UTC_MS - 1 * 24 * 60 * 60 * 1000,
    firstResponseMs: 62 * 60 * 1000,
  },
]

export function getSupportTickets(): SupportTicketRow[] {
  return TICKETS_FIXTURES
}

// ─────────────────────────────────────────────────────────────────────────
// Platform Settings
// ─────────────────────────────────────────────────────────────────────────

export type FeatureFlagId =
  | 'wechatLogin'
  | 'phoneOtp'
  | 'wechatPay'
  | 'alipay'
  | 'stripeConnect'
  | 'aiVideo'
  | 'ai3d'
  | 'compliance'

export interface FeatureFlagRow {
  id: FeatureFlagId
  enabled: boolean
  requiresCredential: boolean
}

export type ApiKeyId =
  | 'deepseek'
  | 'qwen'
  | 'anthropic'
  | 'stripe'
  | 'wechatpay'
  | 'alipay'
  | 'aliyunSms'
  | 'cloudflare'
  | 'sentry'
  | 'posthog'

export interface ApiKeyRow {
  id: ApiKeyId
  envVar: string
  configured: boolean
  maskedPreview?: string
  rotatedAt?: number
}

export interface IcpFiling {
  record: string
  holder: string
  domain: string
  submittedAt: number
  status: 'pending' | 'approved' | 'expired'
}

export interface PlatformSettings {
  platformName: string
  platformDomain: string
  defaultLocale: 'zh-CN' | 'en'
  defaultRegion: 'cn' | 'global'
  maintenanceMode: boolean
  signupEnabled: boolean
  featureFlags: FeatureFlagRow[]
  apiKeys: ApiKeyRow[]
  icp: IcpFiling
  legal: {
    tosUpdatedAt: number
    privacyUpdatedAt: number
    cookieUpdatedAt: number
  }
}

const PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'Forgely',
  platformDomain: 'forgely.cn',
  defaultLocale: 'zh-CN',
  defaultRegion: 'cn',
  maintenanceMode: false,
  signupEnabled: true,
  featureFlags: [
    { id: 'wechatLogin', enabled: true, requiresCredential: true },
    { id: 'phoneOtp', enabled: true, requiresCredential: true },
    { id: 'wechatPay', enabled: true, requiresCredential: true },
    { id: 'alipay', enabled: false, requiresCredential: true },
    { id: 'stripeConnect', enabled: true, requiresCredential: true },
    { id: 'aiVideo', enabled: true, requiresCredential: true },
    { id: 'ai3d', enabled: false, requiresCredential: true },
    { id: 'compliance', enabled: true, requiresCredential: false },
  ],
  apiKeys: [
    { id: 'deepseek', envVar: 'DEEPSEEK_API_KEY', configured: false },
    { id: 'qwen', envVar: 'DASHSCOPE_API_KEY', configured: false },
    { id: 'anthropic', envVar: 'ANTHROPIC_API_KEY', configured: false },
    {
      id: 'stripe',
      envVar: 'STRIPE_SECRET_KEY',
      configured: true,
      maskedPreview: 'sk_test_••••••••7c3a',
      rotatedAt: MOCK_NOW_UTC_MS - 90 * 24 * 60 * 60 * 1000,
    },
    { id: 'wechatpay', envVar: 'WECHAT_PAY_MCH_ID', configured: false },
    { id: 'alipay', envVar: 'ALIPAY_APP_ID', configured: false },
    { id: 'aliyunSms', envVar: 'ALIYUN_SMS_ACCESS_KEY', configured: false },
    {
      id: 'cloudflare',
      envVar: 'CLOUDFLARE_API_TOKEN',
      configured: true,
      maskedPreview: 'f7••••••••3c',
      rotatedAt: MOCK_NOW_UTC_MS - 45 * 24 * 60 * 60 * 1000,
    },
    { id: 'sentry', envVar: 'SENTRY_AUTH_TOKEN', configured: false },
    { id: 'posthog', envVar: 'POSTHOG_API_KEY', configured: false },
  ],
  icp: {
    record: '京 ICP 备 2026XXXXXX 号-1',
    holder: 'Forgely（北京）科技有限公司',
    domain: 'forgely.cn',
    submittedAt: MOCK_NOW_UTC_MS - 60 * 24 * 60 * 60 * 1000,
    status: 'pending',
  },
  legal: {
    tosUpdatedAt: MOCK_NOW_UTC_MS - 30 * 24 * 60 * 60 * 1000,
    privacyUpdatedAt: MOCK_NOW_UTC_MS - 30 * 24 * 60 * 60 * 1000,
    cookieUpdatedAt: MOCK_NOW_UTC_MS - 30 * 24 * 60 * 60 * 1000,
  },
}

export function getPlatformSettings(): PlatformSettings {
  return PLATFORM_SETTINGS
}
