export interface FaqItem {
  question: string
  answer: string
}

export const faqItems: FaqItem[] = [
  {
    question: 'What does Forgely actually generate?',
    answer:
      'A complete, hostable brand site: a 6-section homepage with cinematic Hero loop, value props, brand story, product showcase, social proof and CTA — wired into a real Medusa v2 storefront with cart, checkout, orders and Stripe.',
  },
  {
    question: 'Do I need design or code skills?',
    answer:
      'No. Forgely picks a Visual DNA, drafts copy, generates assets, and ships the site. You can still tweak everything later via a visual editor or by chatting with the in-product AI Copilot.',
  },
  {
    question: 'Can I import my existing Shopify or WooCommerce store?',
    answer:
      'Yes. Paste a URL and Forgely scrapes products, collections, copy and screenshots. We standardise everything into a single schema and let you choose what to keep, replace or improve.',
  },
  {
    question: 'How does the credit system work?',
    answer:
      "Every plan ships with monthly AI credits. Generations, edits, video re-rolls and Copilot actions consume credits — a full homepage costs around 900 credits. Top-ups never expire; subscription credits reset monthly.",
  },
  {
    question: 'Will my site be unique or templated?',
    answer:
      '10 Visual DNAs × 10 Product Moments = 100 base looks, then your brand voice, products and palette layer on top. Two brands using Forgely will not feel the same — that is the whole point.',
  },
  {
    question: 'Can I export the code if I outgrow Forgely?',
    answer:
      'Yes. Pro plans include monthly code exports of the generated Next.js site. Agency and Enterprise get unlimited exports. Your data, your store, your call.',
  },
]
