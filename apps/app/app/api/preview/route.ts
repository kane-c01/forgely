/**
 * Theme Editor live preview iframe — `/api/preview`
 *
 * Returns a self-contained HTML document that renders the storefront
 * sections from a SiteDSL chunk passed in the query string. Used by
 * `<EditorPreview iframe>` so changes in the inspector show up in real
 * time without a full re-render of the parent app.
 *
 * Two communication modes:
 *
 *   1) Initial paint  — `?siteId=x&dsl=<base64>` query string. Server
 *      decodes, falls back to a sensible default when missing.
 *   2) Live updates   — `window.postMessage({ type: 'forgely:dsl', dsl })`
 *      from the parent. The iframe replaces its body using a tiny
 *      vanilla JS renderer (we deliberately don't ship React inside
 *      the iframe to keep payload sub-50 KB).
 *
 * @owner W6 Sprint 3 — task #4
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Block {
  id: string
  type: string
  visible?: boolean
  props?: Record<string, unknown>
}

interface Dsl {
  device?: 'desktop' | 'tablet' | 'mobile'
  blocks?: Block[]
}

const DEFAULT_DSL: Dsl = {
  device: 'desktop',
  blocks: [
    {
      id: 'b_hero',
      type: 'hero',
      visible: true,
      props: {
        eyebrow: 'New · Spring Harvest',
        headline: 'A morning worth waking up for.',
        subhead: 'Single-origin beans, pulled at dawn.',
        ctaPrimary: 'Shop the blend',
      },
    },
    {
      id: 'b_value',
      type: 'value-props',
      visible: true,
      props: {
        headline: 'Why us',
        items: [
          { icon: '🌍', title: 'Direct from origin', body: 'Same farm, every bag.' },
          { icon: '🔥', title: 'Roasted weekly', body: 'Never older than 7 days.' },
          { icon: '🫘', title: 'Whole bean only', body: 'Ground at the moment of brew.' },
        ],
      },
    },
    {
      id: 'b_footer',
      type: 'footer',
      visible: true,
      props: { columns: 4 },
    },
  ],
}

function decodeDsl(raw: string | null): Dsl {
  if (!raw) return DEFAULT_DSL
  try {
    // accept both base64-encoded and URL-encoded JSON
    const json = raw.match(/^[A-Za-z0-9+/=_-]+$/)
      ? Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
      : decodeURIComponent(raw)
    const parsed = JSON.parse(json) as Dsl
    if (!Array.isArray(parsed.blocks)) return DEFAULT_DSL
    return parsed
  } catch {
    return DEFAULT_DSL
  }
}

const escape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function renderBlock(b: Block): string {
  const p = b.props ?? {}
  if (b.visible === false) return ''
  switch (b.type) {
    case 'hero':
      return `<section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-inner">
          ${p.eyebrow ? `<span class="eyebrow">${escape(String(p.eyebrow))}</span>` : ''}
          <h1>${escape(String(p.headline ?? 'Headline'))}</h1>
          ${p.subhead ? `<p class="lead">${escape(String(p.subhead))}</p>` : ''}
          <div class="cta-row">
            ${p.ctaPrimary ? `<button class="btn primary">${escape(String(p.ctaPrimary))}</button>` : ''}
            ${p.ctaSecondary ? `<button class="btn ghost">${escape(String(p.ctaSecondary))}</button>` : ''}
          </div>
        </div>
      </section>`
    case 'value-props': {
      const items = (p.items as Array<{ icon: string; title: string; body: string }>) ?? []
      return `<section class="vp">
        <h2>${escape(String(p.headline ?? 'Why us'))}</h2>
        <div class="vp-grid">
          ${items
            .map(
              (it) => `<div class="vp-card">
                <div class="vp-icon">${escape(it.icon)}</div>
                <h3>${escape(it.title)}</h3>
                <p>${escape(it.body)}</p>
              </div>`,
            )
            .join('')}
        </div>
      </section>`
    }
    case 'product-grid': {
      const cols = Number(p.columns ?? 3)
      const limit = Number(p.limit ?? 6)
      return `<section class="grid">
        <h2>${escape(String(p.headline ?? 'Featured'))}</h2>
        <div class="grid-${cols}">
          ${Array.from({ length: limit })
            .map(
              (_, i) => `<div class="card">
                <div class="card-img">☕</div>
                <p class="card-title">Product ${i + 1}</p>
                <p class="card-price">$24</p>
              </div>`,
            )
            .join('')}
        </div>
      </section>`
    }
    case 'testimonials':
      return `<section class="vp">
        <h2>${escape(String(p.headline ?? 'From the community'))}</h2>
        <div class="vp-grid">
          <div class="vp-card"><p>“The morning ritual I never knew I needed.”</p><span>— Alice</span></div>
          <div class="vp-card"><p>“Best decaf I have had — clean, crisp, complete.”</p><span>— Daniel</span></div>
          <div class="vp-card"><p>“I subscribe and never run out.”</p><span>— Mei</span></div>
        </div>
      </section>`
    case 'rich-text':
      return `<section class="rt"><div class="rt-inner">${escape(String(p.body ?? '')) || '<em>(empty)</em>'}</div></section>`
    case 'newsletter':
      return `<section class="newsletter">
        <h2>${escape(String(p.headline ?? 'Stay in the loop'))}</h2>
        <p>${escape(String(p.subhead ?? ''))}</p>
        <div class="cta-row"><input placeholder="you@example.com" /><button class="btn primary">Subscribe</button></div>
      </section>`
    case 'footer':
      return `<footer><span>© Forged with Forgely</span></footer>`
    default:
      return `<section class="unknown">Unknown block: ${escape(b.type)}</section>`
  }
}

function htmlFor(siteId: string, dsl: Dsl): string {
  const body = (dsl.blocks ?? []).map(renderBlock).join('\n')
  const dslJson = JSON.stringify(dsl).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forgely preview · ${escape(siteId)}</title>
<style>
  :root {
    --bg: #f5ede0;
    --fg: #1a1410;
    --muted: #5c4f40;
    --border: #c7b7a233;
    --primary: #c74a0a;
    --accent: #ffd166;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--fg); font: 16px/1.55 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  h1, h2, h3 { margin: 0; font-family: 'Fraunces', 'Inter Display', serif; }
  .hero { position: relative; padding: 96px 48px; background: #1a140f; color: #f5ede0; overflow: hidden; }
  .hero-bg { position: absolute; inset: -40px; background: radial-gradient(circle at 80% 10%, rgba(255,209,102,0.35), transparent 55%), radial-gradient(circle at 50% 100%, rgba(199,74,10,0.4), transparent 60%); filter: blur(40px); }
  .hero-inner { position: relative; max-width: 720px; }
  .eyebrow { display: inline-block; padding: 4px 12px; border: 1px solid rgba(255,209,102,0.4); border-radius: 999px; background: rgba(255,209,102,0.1); font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #ffd166; }
  .hero h1 { font-size: 56px; line-height: 1.04; margin-top: 16px; color: #f5ede0; }
  .lead { color: #c7b7a2; max-width: 560px; margin-top: 12px; }
  .cta-row { display: flex; gap: 12px; margin-top: 20px; }
  .btn { padding: 10px 20px; border-radius: 8px; border: 0; font: inherit; font-weight: 500; cursor: pointer; }
  .btn.primary { background: var(--primary); color: var(--bg); box-shadow: 0 0 24px rgba(199,74,10,0.4); }
  .btn.ghost { background: transparent; color: #c7b7a2; border: 1px solid rgba(199,183,162,0.3); }
  .vp { padding: 64px 48px; background: var(--bg); }
  .vp h2 { text-align: center; font-size: 36px; margin-bottom: 32px; }
  .vp-grid { max-width: 960px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .vp-card { padding: 20px; border: 1px solid var(--border); border-radius: 10px; background: rgba(255,255,255,0.6); }
  .vp-card .vp-icon { font-size: 28px; }
  .vp-card h3 { margin-top: 12px; font-size: 18px; }
  .vp-card p { margin-top: 6px; color: var(--muted); font-size: 14px; }
  .grid { padding: 64px 48px; background: #f8f0e2; }
  .grid h2 { font-size: 32px; margin-bottom: 24px; max-width: 960px; margin-left: auto; margin-right: auto; }
  .grid-3, .grid-4 { max-width: 960px; margin: 0 auto; display: grid; gap: 16px; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
  .card { background: white; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .card-img { aspect-ratio: 4/5; background: #efe2cb; display: grid; place-items: center; font-size: 48px; }
  .card-title { padding: 8px 12px 0; font-size: 14px; font-weight: 500; }
  .card-price { padding: 0 12px 12px; font-family: ui-monospace, monospace; font-size: 12px; color: var(--muted); }
  .rt { padding: 64px 48px; background: var(--bg); }
  .rt-inner { max-width: 640px; margin: 0 auto; font-size: 17px; color: var(--muted); }
  .newsletter { padding: 64px 48px; background: #1a140f; color: #f5ede0; text-align: center; }
  .newsletter h2 { font-size: 36px; }
  .newsletter p { color: #c7b7a2; margin-top: 8px; margin-bottom: 16px; }
  .newsletter input { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(199,183,162,0.3); background: transparent; color: #f5ede0; }
  footer { padding: 32px 48px; background: #0f0b07; color: #c7b7a2; text-align: center; font-family: ui-monospace, monospace; font-size: 12px; }
  .unknown { padding: 24px; background: #ffe4e1; color: #c74a0a; text-align: center; font-family: ui-monospace, monospace; }
</style>
</head>
<body data-site-id="${escape(siteId)}">
<div id="root">${body}</div>
<script>
  // Initial DSL was used to render the SSR body above. Subsequent
  // updates arrive via postMessage from the parent app:
  //   parent.postMessage({ type: 'forgely:dsl', dsl }, '*')
  let currentDsl = ${dslJson};

  const ESC = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function renderBlock(b) {
    if (b.visible === false) return '';
    const p = b.props || {};
    switch (b.type) {
      case 'hero':
        return '<section class="hero"><div class="hero-bg"></div><div class="hero-inner">' +
          (p.eyebrow ? '<span class="eyebrow">' + ESC(p.eyebrow) + '</span>' : '') +
          '<h1>' + ESC(p.headline || 'Headline') + '</h1>' +
          (p.subhead ? '<p class="lead">' + ESC(p.subhead) + '</p>' : '') +
          '<div class="cta-row">' +
          (p.ctaPrimary ? '<button class="btn primary">' + ESC(p.ctaPrimary) + '</button>' : '') +
          (p.ctaSecondary ? '<button class="btn ghost">' + ESC(p.ctaSecondary) + '</button>' : '') +
          '</div></div></section>';
      case 'value-props':
        return '<section class="vp"><h2>' + ESC(p.headline || 'Why us') + '</h2><div class="vp-grid">' +
          (p.items || []).map(it => '<div class="vp-card"><div class="vp-icon">' + ESC(it.icon) + '</div><h3>' + ESC(it.title) + '</h3><p>' + ESC(it.body) + '</p></div>').join('') +
          '</div></section>';
      case 'product-grid': {
        const cols = Number(p.columns || 3);
        const limit = Number(p.limit || 6);
        let cards = '';
        for (let i = 0; i < limit; i++) cards += '<div class="card"><div class="card-img">☕</div><p class="card-title">Product ' + (i+1) + '</p><p class="card-price">$24</p></div>';
        return '<section class="grid"><h2>' + ESC(p.headline || 'Featured') + '</h2><div class="grid-' + cols + '">' + cards + '</div></section>';
      }
      case 'testimonials':
        return '<section class="vp"><h2>' + ESC(p.headline || 'From the community') + '</h2><div class="vp-grid">' +
          '<div class="vp-card"><p>“The morning ritual I never knew I needed.”</p><span>— Alice</span></div>' +
          '<div class="vp-card"><p>“Best decaf I have had — clean, crisp, complete.”</p><span>— Daniel</span></div>' +
          '<div class="vp-card"><p>“I subscribe and never run out.”</p><span>— Mei</span></div>' +
          '</div></section>';
      case 'rich-text':
        return '<section class="rt"><div class="rt-inner">' + (p.body ? ESC(p.body) : '<em>(empty)</em>') + '</div></section>';
      case 'newsletter':
        return '<section class="newsletter"><h2>' + ESC(p.headline || 'Stay in the loop') + '</h2><p>' + ESC(p.subhead || '') + '</p><div class="cta-row"><input placeholder="you@example.com"/><button class="btn primary">Subscribe</button></div></section>';
      case 'footer':
        return '<footer><span>© Forged with Forgely</span></footer>';
      default:
        return '<section class="unknown">Unknown block: ' + ESC(b.type) + '</section>';
    }
  }

  function rerender(dsl) {
    currentDsl = dsl;
    const root = document.getElementById('root');
    if (!root) return;
    root.innerHTML = (dsl.blocks || []).map(renderBlock).join('');
  }

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'forgely:dsl' && msg.dsl) rerender(msg.dsl);
  });

  // Tell parent we're ready (parent can buffer until then).
  parent && parent.postMessage({ type: 'forgely:ready' }, '*');
</script>
</body>
</html>`
}

export function GET(req: Request): Response {
  const url = new URL(req.url)
  const siteId = url.searchParams.get('siteId') ?? 'qiao-coffee'
  const dsl = decodeDsl(url.searchParams.get('dsl'))
  const html = htmlFor(siteId, dsl)
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      // Iframes embed inside the editor — same origin only.
      'x-frame-options': 'SAMEORIGIN',
    },
  })
}
