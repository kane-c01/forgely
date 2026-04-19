import { NextResponse } from 'next/server'
import { siteConfig } from '@/lib/site'

export const runtime = 'edge'

const body = `# ${siteConfig.name}

> ${siteConfig.tagline}

${siteConfig.description}

## What we do
- AI-generated cinematic brand sites from a single product URL.
- Multi-agent pipeline (Analyzer, Director, Planner, Copywriter, Artist, Compliance, Compiler, Deployer).
- 10 Visual DNAs × 10 Product Moments combine into 100 coherent brand looks.
- Real ecommerce backend (Medusa v2): products, cart, checkout, orders, Stripe.
- AI Copilot in-product that uses 20+ admin tools (rewrite copy, regenerate hero, ship a discount, etc.).

## Plans
- Free: 500 credits one-time, .forgely.app subdomain with watermark.
- Starter $29/mo: 1,500 credits, 3 sites, 1 custom domain.
- Pro $99/mo: 6,000 credits, 10 sites, 5 custom domains, 3D Hero, code export.
- Agency $299/mo: 25,000 credits, 50 sites, white-label.
- Enterprise: custom.

## Contact
- Website: ${siteConfig.url}
- Email: ${siteConfig.contact}
- GitHub: ${siteConfig.github}
`

export function GET() {
  return new NextResponse(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
