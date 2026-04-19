'use client'

import * as React from 'react'

import { cn } from './utils'

export interface ColorPickerProps {
  /** Current color value as hex string. */
  value?: string
  /** Callback when color changes. */
  onChange?: (hex: string) => void
  /** Custom preset swatches (hex). Defaults to 8 Forgely theme colors. */
  presets?: string[]
  disabled?: boolean
  className?: string
}

const DEFAULT_PRESETS = [
  '#FF6B2B', // forge orange
  '#FFB347', // forge amber
  '#D94A38', // forge ember
  '#3B82F6', // blue
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
]

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100
  const ll = l / 100
  const a = sl * Math.min(ll, 1 - ll)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * ColorPicker — HSL slider-based color picker with preset swatch grid.
 * Outputs standard hex values.
 */
export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  { value = '#FF6B2B', onChange, presets = DEFAULT_PRESETS, disabled, className },
  ref,
) {
  const [hsl, setHsl] = React.useState<[number, number, number]>(() => hexToHsl(value))

  React.useEffect(() => {
    setHsl(hexToHsl(value))
  }, [value])

  const updateHsl = (idx: 0 | 1 | 2, val: number) => {
    const next: [number, number, number] = [...hsl]
    next[idx] = val
    setHsl(next)
    onChange?.(hslToHex(next[0], next[1], next[2]))
  }

  const currentHex = hslToHex(hsl[0], hsl[1], hsl[2])

  return (
    <div
      ref={ref}
      className={cn('w-64 space-y-4', disabled && 'pointer-events-none opacity-50', className)}
    >
      {/* Preview */}
      <div className="flex items-center gap-3">
        <div
          className="border-border-strong h-10 w-10 rounded-lg border"
          style={{ backgroundColor: currentHex }}
        />
        <input
          type="text"
          value={currentHex.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
              setHsl(hexToHsl(v))
              onChange?.(v)
            }
          }}
          className="border-border-strong bg-bg-surface text-text-primary h-10 w-24 rounded-lg border px-2 text-center font-mono text-sm"
        />
      </div>

      {/* HSL Sliders */}
      <div className="space-y-2">
        {(['Hue', 'Saturation', 'Lightness'] as const).map((label, i) => (
          <label key={label} className="block">
            <span className="text-text-secondary mb-1 block text-xs">{label}</span>
            <input
              type="range"
              min={0}
              max={i === 0 ? 360 : 100}
              value={hsl[i as 0 | 1 | 2]}
              onChange={(e) => updateHsl(i as 0 | 1 | 2, Number(e.target.value))}
              className="accent-forge-orange w-full"
            />
          </label>
        ))}
      </div>

      {/* Presets */}
      <div>
        <p className="text-text-secondary mb-2 text-xs">Presets</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => {
                setHsl(hexToHsl(hex))
                onChange?.(hex)
              }}
              className={cn(
                'h-7 w-7 rounded-md border-2 transition-transform hover:scale-110',
                currentHex.toLowerCase() === hex.toLowerCase()
                  ? 'border-forge-orange scale-110'
                  : 'border-transparent',
              )}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>
    </div>
  )
})
