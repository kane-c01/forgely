'use client'

import * as React from 'react'
import { Search, Upload, X } from 'lucide-react'

import { cn } from './utils'

export interface FontPickerFont {
  family: string
  source: 'google' | 'custom'
  /** URL to load the font for preview (populated from Google Fonts API or blob URL for custom). */
  previewUrl?: string
}

export interface FontPickerProps {
  /** Currently selected font family. */
  value?: string
  /** Called when a font is selected. */
  onChange?: (font: FontPickerFont) => void
  /** Available Google Fonts (supply from API). */
  fonts?: FontPickerFont[]
  /** Allow custom TTF/OTF upload. */
  allowCustomUpload?: boolean
  /** Called when a custom font file is uploaded. */
  onCustomUpload?: (file: File) => void
  disabled?: boolean
  className?: string
}

/**
 * FontPicker — searchable font selector supporting Google Fonts list
 * and custom TTF/OTF file upload with live preview.
 */
export const FontPicker = React.forwardRef<HTMLDivElement, FontPickerProps>(function FontPicker(
  { value, onChange, fonts = [], allowCustomUpload = true, onCustomUpload, disabled, className },
  ref,
) {
  const [search, setSearch] = React.useState('')
  const [customFonts, setCustomFonts] = React.useState<FontPickerFont[]>([])
  const uploadRef = React.useRef<HTMLInputElement>(null)

  const allFonts = React.useMemo(() => [...customFonts, ...fonts], [customFonts, fonts])

  const filtered = React.useMemo(() => {
    if (!search) return allFonts.slice(0, 50)
    const q = search.toLowerCase()
    return allFonts.filter((f) => f.family.toLowerCase().includes(q)).slice(0, 50)
  }, [allFonts, search])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'ttf' && ext !== 'otf') return

    const url = URL.createObjectURL(file)
    const family = file.name.replace(/\.(ttf|otf)$/i, '')

    const style = document.createElement('style')
    style.textContent = `@font-face { font-family: "${family}"; src: url("${url}"); }`
    document.head.appendChild(style)

    const font: FontPickerFont = { family, source: 'custom', previewUrl: url }
    setCustomFonts((prev) => [font, ...prev])
    onChange?.(font)
    onCustomUpload?.(file)
  }

  return (
    <div
      ref={ref}
      className={cn(
        'border-border-strong bg-bg-elevated w-72 overflow-hidden rounded-xl border',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {/* Search */}
      <div className="border-border-strong flex items-center gap-2 border-b px-3 py-2">
        <Search className="text-text-secondary h-4 w-4 shrink-0" />
        <input
          type="text"
          placeholder="Search fonts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-text-primary placeholder:text-text-secondary flex-1 bg-transparent text-sm outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Upload */}
      {allowCustomUpload && (
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="border-border-strong text-text-secondary hover:text-forge-orange flex w-full items-center gap-2 border-b px-3 py-2 text-sm transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload TTF / OTF
          <input
            ref={uploadRef}
            type="file"
            accept=".ttf,.otf"
            onChange={handleUpload}
            className="hidden"
          />
        </button>
      )}

      {/* Font list */}
      <ul className="max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="text-text-secondary px-3 py-6 text-center text-sm">No fonts found</li>
        )}
        {filtered.map((font) => (
          <li key={`${font.source}-${font.family}`}>
            <button
              type="button"
              onClick={() => onChange?.(font)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                value === font.family
                  ? 'bg-forge-orange/10 text-forge-orange'
                  : 'text-text-primary hover:bg-bg-surface',
              )}
            >
              <span style={{ fontFamily: `"${font.family}", sans-serif` }}>{font.family}</span>
              {font.source === 'custom' && (
                <span className="text-text-secondary text-xs">custom</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
})
