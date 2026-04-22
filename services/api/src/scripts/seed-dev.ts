/**
 * Forgely dev seed — realistic demo data for the /super + user dashboards.
 *
 * Runs after `prisma/seed.ts` (plans / credits packages / super_admin /
 * Visual DNA) and adds:
 *   - 3 regular users (alex@forgely.dev / mia@forgely.dev / kenji@forgely.dev,
 *     password: `password123`)
 *   - 3 sites per user (ToyBloom / Lumina / Aurea) — one live, one building,
 *     one draft
 *   - 10 products per site (coffee / supplements / home goods)
 *   - 20 orders per site across 5 customers
 *   - Credit wallets + a handful of purchase / consumption / refund ledger
 *     rows so /super/finance has something non-trivial to render
 *
 * Idempotent: uses `upsert` on natural keys (email / subdomain / handle)
 * so re-running the script is safe.
 *
 * Usage:
 *   pnpm seed
 *   # or
 *   pnpm --filter @forgely/api exec tsx src/scripts/seed-dev.ts
 */

import { PrismaClient, type Prisma } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

// ─── Config ─────────────────────────────────────────────────────────────

interface SeedUser {
  email: string
  name: string
  region: 'cn' | 'global'
  locale: string
  plan: 'free' | 'starter' | 'pro' | 'business'
  initialBalance: number
}

const DEV_USERS: SeedUser[] = [
  {
    email: 'alex@forgely.dev',
    name: 'Alex Morgan',
    region: 'global',
    locale: 'en',
    plan: 'pro',
    initialBalance: 4_231,
  },
  {
    email: 'mia@forgely.dev',
    name: 'Mia Zhang',
    region: 'cn',
    locale: 'zh-CN',
    plan: 'starter',
    initialBalance: 1_820,
  },
  {
    email: 'kenji@forgely.dev',
    name: 'Kenji Tanaka',
    region: 'global',
    locale: 'en',
    plan: 'business',
    initialBalance: 18_900,
  },
]

interface SeedSite {
  /** Unique per user; joined with user index to build subdomain. */
  slugSeed: string
  name: string
  status: 'draft' | 'generating' | 'published'
  dnaId: string
  heroMomentType: string | null
  themeColor: string
}

const DEV_SITES: SeedSite[] = [
  {
    slugSeed: 'toybloom',
    name: 'ToyBloom',
    status: 'published',
    dnaId: 'nordic_minimal',
    heroMomentType: 'M04',
    themeColor: '#A88E6F',
  },
  {
    slugSeed: 'lumina',
    name: 'Lumina Skincare',
    status: 'generating',
    dnaId: 'clinical_wellness',
    heroMomentType: 'M01',
    themeColor: '#0F2A24',
  },
  {
    slugSeed: 'aurea',
    name: 'Aurea Coffee',
    status: 'draft',
    dnaId: 'kyoto_ceramic',
    heroMomentType: 'M03',
    themeColor: '#8B5A3C',
  },
]

/** 10 products per site — generated from 10 templates keyed by site name. */
function productTemplates(siteName: string): Array<{
  title: string
  handle: string
  priceCents: number
  inventory: number
  status: 'active' | 'draft' | 'archived'
}> {
  if (siteName === 'ToyBloom') {
    return [
      {
        title: 'Birch Blocks · Natural',
        handle: 'birch-blocks-natural',
        priceCents: 3800,
        inventory: 124,
        status: 'active',
      },
      {
        title: 'Rainbow Stacker · Oak',
        handle: 'rainbow-stacker-oak',
        priceCents: 5400,
        inventory: 62,
        status: 'active',
      },
      {
        title: 'Wooden Train Set',
        handle: 'wooden-train-set',
        priceCents: 8900,
        inventory: 18,
        status: 'active',
      },
      {
        title: 'Organic Cotton Plush',
        handle: 'organic-cotton-plush',
        priceCents: 2900,
        inventory: 94,
        status: 'active',
      },
      {
        title: 'Baby Activity Cube',
        handle: 'baby-activity-cube',
        priceCents: 7200,
        inventory: 6,
        status: 'active',
      },
      {
        title: 'Sensory Play Mat',
        handle: 'sensory-play-mat',
        priceCents: 6500,
        inventory: 40,
        status: 'active',
      },
      {
        title: 'Quiet Book · Vol 1',
        handle: 'quiet-book-vol-1',
        priceCents: 4200,
        inventory: 12,
        status: 'active',
      },
      {
        title: 'Stacking Pebbles',
        handle: 'stacking-pebbles',
        priceCents: 3200,
        inventory: 88,
        status: 'active',
      },
      {
        title: 'Wooden Clock Puzzle',
        handle: 'wooden-clock-puzzle',
        priceCents: 4800,
        inventory: 24,
        status: 'draft',
      },
      {
        title: 'Archive: Felt Garland',
        handle: 'felt-garland',
        priceCents: 1800,
        inventory: 0,
        status: 'archived',
      },
    ]
  }
  if (siteName === 'Lumina Skincare') {
    return [
      {
        title: 'Radiance Serum · 30ml',
        handle: 'radiance-serum-30ml',
        priceCents: 4800,
        inventory: 210,
        status: 'active',
      },
      {
        title: 'Barrier Cream · 50g',
        handle: 'barrier-cream-50g',
        priceCents: 3900,
        inventory: 148,
        status: 'active',
      },
      {
        title: 'Ceramide Moisturizer',
        handle: 'ceramide-moisturizer',
        priceCents: 5900,
        inventory: 82,
        status: 'active',
      },
      {
        title: 'Vitamin C Booster',
        handle: 'vitamin-c-booster',
        priceCents: 4200,
        inventory: 34,
        status: 'active',
      },
      {
        title: 'Overnight Mask',
        handle: 'overnight-mask',
        priceCents: 3600,
        inventory: 67,
        status: 'active',
      },
      {
        title: 'Gentle Cleanser',
        handle: 'gentle-cleanser',
        priceCents: 2800,
        inventory: 190,
        status: 'active',
      },
      {
        title: 'Eye Contour Gel',
        handle: 'eye-contour-gel',
        priceCents: 4500,
        inventory: 9,
        status: 'active',
      },
      {
        title: 'Travel Trio',
        handle: 'travel-trio',
        priceCents: 6200,
        inventory: 44,
        status: 'active',
      },
      {
        title: 'Retinol Night Oil',
        handle: 'retinol-night-oil',
        priceCents: 7800,
        inventory: 22,
        status: 'draft',
      },
      {
        title: 'Archive: Clay Mask',
        handle: 'clay-mask',
        priceCents: 2400,
        inventory: 0,
        status: 'archived',
      },
    ]
  }
  return [
    {
      title: 'Primary Essentials Blend · 250g',
      handle: 'primary-essentials',
      priceCents: 2400,
      inventory: 124,
      status: 'active',
    },
    {
      title: 'Morning Light Decaf',
      handle: 'morning-light-decaf',
      priceCents: 2200,
      inventory: 47,
      status: 'active',
    },
    {
      title: 'Ceramic Pour-Over Set',
      handle: 'ceramic-pour-over-set',
      priceCents: 8900,
      inventory: 12,
      status: 'active',
    },
    {
      title: 'Single-Origin Yirgacheffe',
      handle: 'yirgacheffe-single-origin',
      priceCents: 3200,
      inventory: 6,
      status: 'active',
    },
    {
      title: 'Cold Brew Concentrate',
      handle: 'cold-brew-concentrate',
      priceCents: 1800,
      inventory: 0,
      status: 'draft',
    },
    {
      title: 'Brewing Journal',
      handle: 'brewing-journal',
      priceCents: 1500,
      inventory: 0,
      status: 'archived',
    },
    {
      title: 'Stainless Scale',
      handle: 'stainless-scale',
      priceCents: 4900,
      inventory: 40,
      status: 'active',
    },
    {
      title: 'Ceramic Dripper · V60',
      handle: 'ceramic-dripper-v60',
      priceCents: 3400,
      inventory: 28,
      status: 'active',
    },
    {
      title: 'Canvas Coffee Apron',
      handle: 'canvas-coffee-apron',
      priceCents: 4200,
      inventory: 11,
      status: 'active',
    },
    {
      title: 'Cherry-Dark Espresso',
      handle: 'cherry-dark-espresso',
      priceCents: 2600,
      inventory: 74,
      status: 'active',
    },
  ]
}

const DEMO_CUSTOMERS = [
  { email: 'alice@example.com', name: 'Alice Tanaka' },
  { email: 'mei@example.com', name: 'Mei Chen' },
  { email: 'lucas@example.com', name: 'Lucas Becker' },
  { email: 'daniel@example.com', name: 'Daniel Park' },
  { email: 'priya@example.com', name: 'Priya Mehta' },
]

// ─── Helpers ────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function pickCustomer(i: number): { email: string; name: string } {
  const c = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length]
  if (!c) throw new Error('DEMO_CUSTOMERS is empty')
  return c
}

// ─── Seeders ────────────────────────────────────────────────────────────

async function seedUsers(): Promise<
  Array<{ user: { id: string; email: string; name: string | null }; config: SeedUser }>
> {
  const password = 'password123'
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

  const results: Array<{
    user: { id: string; email: string; name: string | null }
    config: SeedUser
  }> = []
  for (const u of DEV_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: 'user',
        plan: u.plan,
        region: u.region,
        locale: u.locale,
        emailVerifiedAt: new Date(),
        passwordHash,
        deletedAt: null,
      },
      create: {
        email: u.email,
        name: u.name,
        role: 'user',
        plan: u.plan,
        region: u.region,
        locale: u.locale,
        emailVerifiedAt: new Date(),
        passwordHash,
      },
    })

    await prisma.userCredits.upsert({
      where: { userId: user.id },
      update: { balance: u.initialBalance, lifetimeEarned: u.initialBalance * 2 },
      create: {
        userId: user.id,
        balance: u.initialBalance,
        lifetimeEarned: u.initialBalance * 2,
        lifetimeSpent: u.initialBalance,
      },
    })

    results.push({ user, config: u })
  }
  console.info(`✓ Seeded ${results.length} dev users (password: ${password})`)
  return results
}

async function seedSitesForUser(
  userId: string,
  userIndex: number,
): Promise<Array<{ id: string; name: string }>> {
  const created: Array<{ id: string; name: string }> = []
  for (let i = 0; i < DEV_SITES.length; i += 1) {
    const template = DEV_SITES[i]!
    const subdomain = `${template.slugSeed}-${userIndex + 1}`
    const site = await prisma.site.upsert({
      where: { subdomain },
      update: {
        userId,
        name: template.name,
        status: template.status,
        dnaId: template.dnaId,
        heroMomentType: template.heroMomentType,
        publishedAt: template.status === 'published' ? daysAgo(3) : null,
      },
      create: {
        userId,
        name: template.name,
        subdomain,
        status: template.status,
        dnaId: template.dnaId,
        heroMomentType: template.heroMomentType,
        publishedAt: template.status === 'published' ? daysAgo(3) : null,
      },
    })
    created.push({ id: site.id, name: site.name })
  }
  return created
}

/**
 * Seed products + placeholder "orders" as credit transactions scoped to
 * the owner. There's no Prisma Order model in the core schema (orders
 * live in the Medusa connector for the storefront tenant); so we only
 * populate `MediaAsset` / `Page` / `CreditTransaction` here. The /super
 * finance and user-dashboard KPIs use these as their sole live source.
 */
async function seedSiteContent(site: { id: string; name: string }, userId: string): Promise<void> {
  const products = productTemplates(site.name)

  await prisma.page.upsert({
    where: { siteId_slug: { siteId: site.id, slug: '/home' } },
    update: {
      title: `${site.name} · home`,
      content: `<h1>${site.name}</h1><p>Your forged brand experience lives here.</p>`,
      status: 'published',
      type: 'page',
      author: 'seed',
    },
    create: {
      siteId: site.id,
      type: 'page',
      slug: '/home',
      title: `${site.name} · home`,
      content: `<h1>${site.name}</h1><p>Your forged brand experience lives here.</p>`,
      status: 'published',
      publishedAt: new Date(),
      author: 'seed',
    },
  })

  // Product hero image MediaAsset rows keyed per handle. Store only the
  // subset the media library renders (filename + url + prompt).
  for (const p of products) {
    const filename = `${p.handle}.jpg`
    const existing = await prisma.mediaAsset.findFirst({
      where: { siteId: site.id, filename },
    })
    if (existing) continue
    await prisma.mediaAsset.create({
      data: {
        userId,
        siteId: site.id,
        type: 'image',
        url: `https://placehold.co/1024x1024?text=${encodeURIComponent(p.title.slice(0, 24))}`,
        thumbnailUrl: null,
        filename,
        size: 1024 * 300,
        mimeType: 'image/jpeg',
        source: 'ai_generated',
        generator: 'flux',
        prompt: `${p.title} — product studio photo`,
        tags: ['product', p.status],
        dimensions: { width: 1024, height: 1024 },
      },
    })
  }

  // Placeholder orders — stored as `CreditTransaction` rows of type
  // `purchase` so /super/finance aggregates render real numbers. Amounts
  // are credit-equivalent of the order total (1¢ = 1 credit).
  for (let i = 0; i < 20; i += 1) {
    const product = products[i % products.length]!
    const customer = pickCustomer(i)
    const whenAgo = daysAgo(Math.floor(i / 2))
    // Make credit-transaction ids deterministic so re-runs skip dups.
    const description = `order #${1000 + i} · ${customer.name} · ${site.name} · ${product.handle}`
    const existing = await prisma.creditTransaction.findFirst({
      where: { userId, description },
    })
    if (existing) continue
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: i % 17 === 0 ? 'refund' : 'purchase',
        amount: i % 17 === 0 ? -Math.round(product.priceCents / 2) : product.priceCents,
        balance: 0, // balance tracking isn't meaningful for storefront sales
        description,
        metadata: {
          siteId: site.id,
          siteName: site.name,
          customerEmail: customer.email,
          productHandle: product.handle,
          orderNumber: 1000 + i,
        } as Prisma.InputJsonValue,
        createdAt: whenAgo,
      },
    })
  }
}

async function ensureSuperAdminSubscription(): Promise<void> {
  // Make sure `/super` pages have *something* to render even before the
  // first Stripe webhook fires.
  const admin = await prisma.user.findUnique({ where: { email: 'admin@forgely.dev' } })
  if (!admin) return
  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: { plan: 'business', status: 'active' },
    create: {
      userId: admin.id,
      plan: 'business',
      status: 'active',
      stripeSubscriptionId: `sub_seed_${admin.id.slice(-6)}`,
      stripePriceId: 'price_seed_placeholder',
      cadence: 'monthly',
      currentPeriodStart: daysAgo(2),
      currentPeriodEnd: daysAgo(-28),
      cancelAtPeriodEnd: false,
    },
  })
}

async function seedAuditTrail(
  superAdminId: string,
  dev: Array<{ user: { id: string; email: string } }>,
): Promise<void> {
  const samples = [
    { action: 'user.signin', actorType: 'super_admin', targetType: 'user' },
    { action: 'user.grant_credits', actorType: 'super_admin', targetType: 'user' },
    { action: 'site.publish', actorType: 'user', targetType: 'site' },
    { action: 'subscription.create', actorType: 'system', targetType: 'user' },
  ]
  for (let i = 0; i < dev.length * samples.length; i += 1) {
    const user = dev[i % dev.length]!
    const sample = samples[i % samples.length]!
    await prisma.auditLog.create({
      data: {
        actorType: sample.actorType,
        actorId: sample.actorType === 'super_admin' ? superAdminId : user.user.id,
        action: sample.action,
        targetType: sample.targetType,
        targetId: user.user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-dev',
        reason: sample.action === 'user.grant_credits' ? 'Launch-month bonus' : null,
        createdAt: daysAgo(i),
      },
    })
  }
}

async function main(): Promise<void> {
  console.info('▶ Seeding Forgely dev data…')

  // The primary seed (plans / packages / visual-dna / super_admin) must
  // have run first — bail out with a loud hint if it hasn't.
  const superAdmin = await prisma.user.findUnique({ where: { email: 'admin@forgely.dev' } })
  if (!superAdmin) {
    console.error('✖ Missing super_admin; run `pnpm --filter @forgely/api db:seed` first.')
    process.exitCode = 1
    return
  }

  const dev = await seedUsers()

  for (let i = 0; i < dev.length; i += 1) {
    const { user } = dev[i]!
    const sites = await seedSitesForUser(user.id, i)
    for (const site of sites) await seedSiteContent(site, user.id)
    console.info(`  · Seeded ${sites.length} sites + content for ${user.email}`)
  }

  await ensureSuperAdminSubscription()
  await seedAuditTrail(superAdmin.id, dev)

  console.info('✔ Dev seed complete.')
  console.info('  Login: admin@forgely.dev / Forgely!2026  (super_admin)')
  console.info('  Login: alex@forgely.dev  / password123   (user)')
  console.info('  Login: mia@forgely.dev   / password123   (user)')
  console.info('  Login: kenji@forgely.dev / password123   (user)')
}

main()
  .catch((err) => {
    console.error('✖ Dev seed failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
