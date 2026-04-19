import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #FFD166 0%, #FF6B1A 60%, #C74A0A 100%)',
          color: '#08080A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 110,
          fontWeight: 800,
          borderRadius: 36,
        }}
      >
        F
      </div>
    ),
    { ...size },
  )
}
