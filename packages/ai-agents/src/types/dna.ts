/**
 * The 10 built-in Visual DNA ids that the Analyzer Agent may recommend.
 * Mirrors `docs/MASTER.md` §10.2 and the seed fixtures in
 * `services/api/prisma/seed.ts`.
 *
 * Kept in `@forgely/ai-agents` (not `@forgely/visual-dna`) to avoid a
 * circular dep — the visual-dna package will eventually import this list.
 */
export const VISUAL_DNA_IDS = [
  'kyoto_ceramic',
  'clinical_wellness',
  'playful_pop',
  'nordic_minimal',
  'tech_precision',
  'editorial_fashion',
  'organic_garden',
  'neon_night',
  'california_wellness',
  'bold_rebellious',
] as const

export type VisualDnaId = (typeof VISUAL_DNA_IDS)[number]
