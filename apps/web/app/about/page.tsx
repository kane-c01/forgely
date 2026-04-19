import { StaticPageShell } from '@/components/site/static-page-shell'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'About',
  description: 'Forgely is a brand operating system for the AI era. Here is who we are.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="About"
      title="A small studio building the brand operating system."
      intro="Forgely was founded in 2026 by a team of designers, AI engineers and ex-Shopify operators who were tired of beautiful demos and ugly storefronts."
    >
      <h2>What we believe</h2>
      <p>
        Independent commerce is healthy for the internet. Most independent commerce today looks the
        same because the tooling makes it easy to ship something average and hard to ship something
        cinematic. We are changing that.
      </p>

      <h2>How we work</h2>
      <p>
        We are deliberate. We ship weekly. We default to dark mode, sans meetings, and conventional
        commits. Every employee runs the product on their own brand before it reaches customers.
      </p>

      <h2>Where we are</h2>
      <p>
        Distributed across Europe and Asia. EU-incorporated, US-incorporated, with a Shenzhen
        partner office for our China-out manufacturers.
      </p>

      <p>
        Want to talk to a human? <a href="mailto:hello@forgely.com">hello@forgely.com</a>.
      </p>
    </StaticPageShell>
  )
}
