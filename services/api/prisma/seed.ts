/**
 * Forgely seed script.
 *
 * Idempotent — safe to re-run. Each fixture uses `upsert` keyed on a
 * stable slug or unique field so re-seeding a dev DB never produces duplicates.
 *
 * Run via:
 *   pnpm --filter @forgely/api db:seed
 *
 * Fixtures:
 *   - 10 Visual DNA presets (skeletons; full specs land in packages/visual-dna in T11)
 *   - 4 Credits packages (docs/MASTER.md §3.3)
 *   - 4 subscription Plans (docs/MASTER.md §3.2)
 *   - 1 super_admin test user (admin@forgely.dev / Forgely!2026)
 *
 * @owner W3 (T05)
 */

import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

// ─── 10 Visual DNA presets ──────────────────────────────────────────────────
// Skeleton specs (full prompt builders live in packages/visual-dna, T11).
const VISUAL_DNA_PRESETS = [
  {
    id: 'kyoto_ceramic',
    name: 'Kyoto Ceramic',
    description: 'Soft warm minimalism, natural wood and ceramic textures. Aesop / Muji adjacent.',
    spec: {
      colors: { primary: '#2D2A26', accent: '#8B5A3C', bg: '#FEFDFB', muted: '#E8E2D9' },
      fonts: { display: 'Fraunces', body: 'Inter' },
      cameraLanguage: { pace: 'slow', style: 'static', avgShotDuration: 7 },
      colorGrade: { temperature: 'warm', saturation: 'desaturated' },
      lighting: { source: 'natural_window', direction: 'side', intensity: 'soft' },
      promptBuilder: {
        styleKeywords: [
          'soft morning light',
          'natural wood tones',
          'zen minimalism',
          'cinematic stillness',
        ],
        negativeKeywords: ['bright', 'saturated', 'busy', 'chaotic'],
      },
    },
  },
  {
    id: 'clinical_wellness',
    name: 'Clinical Wellness',
    description: 'Dark green + gold luxury wellness. Aesop / La Mer / BIOLOGICA.',
    spec: {
      colors: { primary: '#0F2A24', accent: '#C9A86A', bg: '#F2EDE5', muted: '#D6CDB8' },
      fonts: { display: 'Tiempos', body: 'Inter' },
      cameraLanguage: { pace: 'slow', style: 'static', avgShotDuration: 6 },
      colorGrade: { temperature: 'cool', saturation: 'rich' },
    },
  },
  {
    id: 'playful_pop',
    name: 'Playful Pop',
    description: 'High-saturation candy palette. Recess / Poppi / Olipop.',
    spec: {
      colors: { primary: '#FF5470', accent: '#FFD23F', bg: '#FFF6F2', muted: '#FFE3D8' },
      fonts: { display: 'Poppins', body: 'DM Sans' },
      cameraLanguage: { pace: 'fast', style: 'dynamic', avgShotDuration: 3 },
      colorGrade: { temperature: 'warm', saturation: 'vivid' },
    },
  },
  {
    id: 'nordic_minimal',
    name: 'Nordic Minimal',
    description: 'Warm white + raw oak. HAY / Muji / PlanToys.',
    spec: {
      colors: { primary: '#1F1F1F', accent: '#A88E6F', bg: '#F8F5EE', muted: '#E5DFD2' },
      fonts: { display: 'Inter Display', body: 'Inter' },
      cameraLanguage: { pace: 'slow', style: 'static', avgShotDuration: 6 },
    },
  },
  {
    id: 'tech_precision',
    name: 'Tech Precision',
    description: 'Cool grey + silver. Apple / Nothing / Framework.',
    spec: {
      colors: { primary: '#0A0A0B', accent: '#9CA3AF', bg: '#F5F5F7', muted: '#D1D5DB' },
      fonts: { display: 'Geist', body: 'Geist', mono: 'Geist Mono' },
      cameraLanguage: { pace: 'medium', style: 'precise', avgShotDuration: 4 },
    },
  },
  {
    id: 'editorial_fashion',
    name: 'Editorial Fashion',
    description: 'Filmic black & white + deep red. Acne / Jacquemus / The Row.',
    spec: {
      colors: { primary: '#0A0A0A', accent: '#7A1B1B', bg: '#F4F2EE', muted: '#C8C4BC' },
      fonts: { display: 'PP Editorial', body: 'Inter' },
      cameraLanguage: { pace: 'medium', style: 'editorial', avgShotDuration: 5 },
    },
  },
  {
    id: 'organic_garden',
    name: 'Organic Garden',
    description: 'Earth tones + organic green. Our Place / Tata Harper.',
    spec: {
      colors: { primary: '#2F3D2A', accent: '#A8C77A', bg: '#F4F0E6', muted: '#D9D2BD' },
      fonts: { display: 'Fraunces', body: 'Inter' },
      cameraLanguage: { pace: 'slow', style: 'organic', avgShotDuration: 6 },
    },
  },
  {
    id: 'neon_night',
    name: 'Neon Night',
    description: 'Dark base + neon purple/cyan. Liquid Death night / EDM brands.',
    spec: {
      colors: { primary: '#0B0118', accent: '#9D4EDD', bg: '#0F0420', muted: '#3A1B5E' },
      fonts: { display: 'Monument Extended', body: 'Inter' },
      cameraLanguage: { pace: 'fast', style: 'kinetic', avgShotDuration: 3 },
      colorGrade: { temperature: 'cool', saturation: 'vivid' },
    },
  },
  {
    id: 'california_wellness',
    name: 'California Wellness',
    description: 'Sun gold + warm beige. Ritual / AG1 / Rhode.',
    spec: {
      colors: { primary: '#3A2A1E', accent: '#E8B860', bg: '#FBF5E8', muted: '#EADFC2' },
      fonts: { display: 'Fraunces', body: 'Inter' },
      cameraLanguage: { pace: 'slow', style: 'sunny', avgShotDuration: 6 },
    },
  },
  {
    id: 'bold_rebellious',
    name: 'Bold Rebellious',
    description: 'High-contrast B&W + red. Off-White / Liquid Death / Diesel.',
    spec: {
      colors: { primary: '#000000', accent: '#E50914', bg: '#FFFFFF', muted: '#1A1A1A' },
      fonts: { display: 'Druk', body: 'Inter' },
      cameraLanguage: { pace: 'fast', style: 'punk', avgShotDuration: 3 },
    },
  },
] as const

// ─── 4 Credits packages (docs/MASTER.md §3.3) ──────────────────────────────
const CREDITS_PACKAGES = [
  {
    slug: 'mini',
    name: 'Mini',
    credits: 500,
    bonusCredits: 0,
    priceUsd: 500,
    popular: false,
    sortOrder: 1,
    stripePriceId: 'price_mini_dev_placeholder',
  },
  {
    slug: 'standard',
    name: 'Standard',
    credits: 2_500,
    bonusCredits: 300,
    priceUsd: 2_000,
    popular: true,
    sortOrder: 2,
    stripePriceId: 'price_standard_dev_placeholder',
  },
  {
    slug: 'bulk',
    name: 'Bulk',
    credits: 10_000,
    bonusCredits: 2_000,
    priceUsd: 6_900,
    popular: false,
    sortOrder: 3,
    stripePriceId: 'price_bulk_dev_placeholder',
  },
  {
    slug: 'scale',
    name: 'Scale',
    credits: 50_000,
    bonusCredits: 15_000,
    priceUsd: 29_900,
    popular: false,
    sortOrder: 4,
    stripePriceId: 'price_scale_dev_placeholder',
  },
] as const

// ─── 4 subscription Plans (docs/MASTER.md §3.2) ────────────────────────────
const PLANS = [
  {
    slug: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    monthlyCredits: 500,
    maxSites: 0,
    maxCustomDomains: 0,
    enable3D: false,
    enableAiCopilot: false,
    enableCodeExport: false,
    sortOrder: 0,
  },
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthlyUsd: 2_900,
    priceYearlyUsd: 26_100,
    monthlyCredits: 1_500,
    maxSites: 3,
    maxCustomDomains: 1,
    enable3D: false,
    enableAiCopilot: true,
    enableCodeExport: false,
    sortOrder: 1,
  },
  {
    slug: 'pro',
    name: 'Pro',
    priceMonthlyUsd: 9_900,
    priceYearlyUsd: 89_100,
    monthlyCredits: 6_000,
    maxSites: 10,
    maxCustomDomains: 5,
    enable3D: true,
    enableAiCopilot: true,
    enableCodeExport: false,
    features: { codeExportPerMonth: 1 },
    sortOrder: 2,
  },
  {
    slug: 'agency',
    name: 'Agency',
    priceMonthlyUsd: 29_900,
    priceYearlyUsd: 269_100,
    monthlyCredits: 25_000,
    maxSites: 50,
    maxCustomDomains: 9999,
    enable3D: true,
    enableAiCopilot: true,
    enableCodeExport: true,
    features: { whitelabel: true },
    sortOrder: 3,
  },
] as const

async function seedVisualDna(): Promise<void> {
  for (const dna of VISUAL_DNA_PRESETS) {
    await prisma.visualDNA.upsert({
      where: { id: dna.id },
      update: { name: dna.name, description: dna.description, spec: dna.spec },
      create: dna,
    })
  }
  console.info(`✓ Seeded ${VISUAL_DNA_PRESETS.length} Visual DNA presets`)
}

async function seedCreditsPackages(): Promise<void> {
  for (const pkg of CREDITS_PACKAGES) {
    await prisma.creditsPackage.upsert({
      where: { slug: pkg.slug },
      update: {
        name: pkg.name,
        credits: pkg.credits,
        bonusCredits: pkg.bonusCredits,
        priceUsd: pkg.priceUsd,
        popular: pkg.popular,
        sortOrder: pkg.sortOrder,
        stripePriceId: pkg.stripePriceId,
        active: true,
      },
      create: pkg,
    })
  }
  console.info(`✓ Seeded ${CREDITS_PACKAGES.length} credits packages`)
}

async function seedPlans(): Promise<void> {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: { ...plan, active: true },
      create: plan,
    })
  }
  console.info(`✓ Seeded ${PLANS.length} subscription plans`)
}

async function seedSuperAdmin(): Promise<void> {
  const email = 'admin@forgely.dev'
  const password = 'Forgely!2026'
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'super_admin',
      plan: 'enterprise',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
    create: {
      email,
      name: 'Forgely Admin',
      role: 'super_admin',
      plan: 'enterprise',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  })

  await prisma.userCredits.upsert({
    where: { userId: user.id },
    update: { balance: 1_000_000 },
    create: {
      userId: user.id,
      balance: 1_000_000,
      lifetimeEarned: 1_000_000,
    },
  })

  console.info(`✓ Seeded super_admin user — ${email} / ${password}`)
}

async function main(): Promise<void> {
  console.info('▶ Seeding Forgely database…')
  await seedPlans()
  await seedCreditsPackages()
  await seedVisualDna()
  await seedSuperAdmin()
  console.info('✔ Seed complete.')
}

main()
  .catch((err) => {
    console.error('✖ Seed failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
