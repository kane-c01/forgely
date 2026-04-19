import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

export const runtime = 'edge'
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundColor: '#08080A',
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(255,107,26,0.45) 0%, rgba(199,74,10,0.15) 35%, transparent 65%)',
          color: '#F4F4F7',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontSize: 28,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #FFD166 0%, #FF6B1A 60%, #C74A0A 100%)',
              color: '#08080A',
              fontWeight: 800,
            }}
          >
            F
          </div>
          <span style={{ fontWeight: 600 }}>Forgely</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              fontWeight: 300,
              maxWidth: 1000,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Brand operating system</span>
            <span
              style={{
                background:
                  'linear-gradient(120deg, #FFD166 0%, #FF6B1A 60%, #C74A0A 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                fontStyle: 'italic',
              }}
            >
              for the AI era.
            </span>
          </div>
          <p
            style={{
              fontSize: 30,
              color: '#A8A8B4',
              maxWidth: 900,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            Forge cinematic brand sites from a single link.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: '#6B6B78',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span>forgely.com</span>
          <span>Private beta · 2026</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
