/**
 * Local-only fallback for the generation conversation.
 *
 * Used when `trpc.conversation.start` fails (most commonly because the
 * user isn't signed in / there's no DATABASE_URL). The script mirrors
 * the server's `nextAssistantTurn(scripted: true)` path so the demo
 * flow stays representative even without a backend.
 *
 * Real flow lives in `services/api/src/router/conversation.ts` →
 * `packages/ai-agents/src/agents/conversation.ts`.
 */
export type ConversationStage =
  | 'choosing_path'
  | 'gathering_url'
  | 'gathering_description'
  | 'gathering_audience'
  | 'choosing_dna'
  | 'choosing_hero'
  | 'review_plan'
  | 'ready'

export type AnswerKind = 'choice' | 'url' | 'text' | 'tags' | 'product' | 'confirm'

export interface MockProductCandidate {
  id: string
  title: string
  imageUrl: string
  priceCents: number
}

export type MockExpects =
  | { kind: 'choice'; options: Array<{ id: string; label: string }> }
  | { kind: 'url' }
  | { kind: 'text'; multiline?: boolean; placeholder?: string }
  | { kind: 'tags'; suggestions?: string[] }
  | { kind: 'product'; products: MockProductCandidate[] }
  | { kind: 'confirm' }

export interface MockTurn {
  stage: ConversationStage
  message: string
  reasoning: string
  expects: MockExpects
}

const SAMPLE_PRODUCTS: MockProductCandidate[] = [
  {
    id: 'mock-p-1',
    title: 'Primary Essentials Blend',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600',
    priceCents: 2400,
  },
  {
    id: 'mock-p-2',
    title: 'Morning Light Decaf',
    imageUrl: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600',
    priceCents: 2200,
  },
  {
    id: 'mock-p-3',
    title: 'Single-Origin Yirgacheffe',
    imageUrl: 'https://images.unsplash.com/photo-1493515322954-4fa727e97985?w=600',
    priceCents: 3200,
  },
]

const SCRIPT: Record<ConversationStage, MockTurn | null> = {
  choosing_path: {
    stage: 'choosing_path',
    message: 'Welcome to Forgely. Where are we starting from today?',
    reasoning: 'I need to know your input path before I can decide what to ask next.',
    expects: {
      kind: 'choice',
      options: [
        { id: 'HAS_STORE', label: 'I already have a store (Shopify / Wo­oCommerce / standalone)' },
        { id: 'HAS_SOURCE_LINK', label: 'I have a 1688 / Taobao / Tmall source link' },
        { id: 'DESCRIBE_ONLY', label: 'I have nothing yet — let me describe it' },
      ],
    },
  },
  gathering_url: {
    stage: 'gathering_url',
    message: 'Paste the store URL — anything from `*.myshopify.com` to your custom domain works.',
    reasoning: 'I need a real URL to analyze the catalogue and visual style.',
    expects: { kind: 'url' },
  },
  gathering_description: {
    stage: 'gathering_description',
    message: 'In one paragraph, describe your brand and what you sell.',
    reasoning: 'Without a source URL I have to ground myself in your words.',
    expects: {
      kind: 'text',
      multiline: true,
      placeholder: 'e.g. Single-origin coffee from a small Kyoto roaster…',
    },
  },
  gathering_audience: {
    stage: 'gathering_audience',
    message: 'Who are you trying to reach overseas? Pick a few descriptors.',
    reasoning: 'Audience tags drive both the visual DNA and the copy tone.',
    expects: {
      kind: 'tags',
      suggestions: [
        'design-lovers',
        'wellness-conscious',
        '25-40 yo professionals',
        'home-cooks',
        'gift-buyers',
        'subscription-friendly',
      ],
    },
  },
  choosing_dna: {
    stage: 'choosing_dna',
    message: 'Pick the visual DNA you want me to work in.',
    reasoning: 'DNA locks the colour palette, type pairing and motion language.',
    expects: {
      kind: 'choice',
      options: [
        { id: 'kyoto-ceramic', label: '🇯🇵 Kyoto Ceramic — warm kinari, hand-crafted' },
        { id: 'clinical-wellness', label: '🌿 Clinical Wellness — calm, evidence-led' },
        { id: 'editorial-fashion', label: '📐 Editorial Fashion — bold, gallery-cool' },
        { id: 'tech-precision', label: '⚙️ Tech Precision — engineered, neutral' },
      ],
    },
  },
  choosing_hero: {
    stage: 'choosing_hero',
    message: 'Of these 3 candidates, which should be your homepage hero?',
    reasoning: 'I ranked these by visual quality, price band and inventory.',
    expects: { kind: 'product', products: SAMPLE_PRODUCTS },
  },
  review_plan: {
    stage: 'review_plan',
    message:
      "Here's the plan: Kyoto Ceramic DNA, hero featuring your top SKU, 5-section storefront, EN+ZH copy. Forging will cost ~520 credits. Confirm?",
    reasoning:
      "I've collected enough — once you confirm I dispatch the 12-step pipeline (≈ 4 min).",
    expects: { kind: 'confirm' },
  },
  ready: null,
}

const ORDER: ConversationStage[] = [
  'choosing_path',
  'gathering_description',
  'gathering_audience',
  'choosing_dna',
  'choosing_hero',
  'review_plan',
  'ready',
]

export function firstTurn(): MockTurn {
  return SCRIPT.choosing_path!
}

export function nextStageAfter(
  current: ConversationStage,
  answer: { kind: AnswerKind; choice?: string },
): ConversationStage {
  // Branch off on the first choice (HAS_STORE → URL stage; everything
  // else → description stage).
  if (current === 'choosing_path' && answer.kind === 'choice') {
    if (answer.choice === 'HAS_STORE') return 'gathering_url'
    if (answer.choice === 'HAS_SOURCE_LINK') return 'gathering_url'
    return 'gathering_description'
  }
  // After URL goes straight to audience (skip description).
  if (current === 'gathering_url') return 'gathering_audience'
  const idx = ORDER.indexOf(current)
  if (idx < 0 || idx === ORDER.length - 1) return 'ready'
  return ORDER[idx + 1] ?? 'ready'
}

export function turnFor(stage: ConversationStage): MockTurn | null {
  return SCRIPT[stage]
}
