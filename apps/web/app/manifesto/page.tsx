import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Manifesto',
  description: 'What Forgely stands for, written in seven sentences.',
  path: '/manifesto',
})

export default function ManifestoPage() {
  return (
    <StaticPageShell
      eyebrow="Manifesto"
      title="Brands deserve a film, not a form."
      intro="Seven beliefs that decide every product call we make."
    >
      <h2>1. Independent brands are the second internet</h2>
      <p>
        We back the next generation of independent storefronts because the alternative — a few
        marketplaces with infinite SKUs — is boring and bad for makers.
      </p>

      <h2>2. Cinematic is the new minimum</h2>
      <p>
        Aesop, Rhode and Recess raised the bar; everybody else has to match it. AI finally makes
        that affordable for a $29 plan.
      </p>

      <h2>3. AI should ship work, not chats</h2>
      <p>
        A Copilot you talk to is a chatbot. A Copilot that publishes a discount, regenerates a hero
        loop and emails a cohort is a teammate.
      </p>

      <h2>4. The first 5 minutes decide everything</h2>
      <p>
        If a founder cannot get from URL to live store in 5 minutes, they bounce. So we measure that
        single number relentlessly.
      </p>

      <h2>5. Defaults matter more than features</h2>
      <p>
        Every Forgely site is dark mode, fluid type, AVIF-first, Schema.org-ready, llms.txt-served,
        GDPR-friendly out of the box — because most operators never change defaults.
      </p>

      <h2>6. Models will change. The pipeline should not.</h2>
      <p>
        Today: Claude Opus, Kling, Flux, Ideogram. In 12 months: who knows. Our agent contract stays
        stable; the providers slot in.
      </p>

      <h2>7. Honest commerce wins</h2>
      <p>
        Compliance, refunds, accessibility, Stripe — they are not edge cases. They are the product.
        Brands that ship them well outlive the rest.
      </p>
    </StaticPageShell>
  )
}
