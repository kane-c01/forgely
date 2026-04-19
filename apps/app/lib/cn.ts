/**
 * Class name composer — concatenates non-falsy strings.
 *
 * Lightweight stand-in for `clsx` / `tailwind-merge` so we stay zero-dep
 * until @forgely/ui ships its own utility. Order is preserved so callers
 * can append override classes on the right.
 */
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined }

export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const v of values) {
    if (!v && v !== 0) continue
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v))
    } else if (Array.isArray(v)) {
      const inner = cn(...v)
      if (inner) out.push(inner)
    } else if (typeof v === 'object') {
      for (const [k, on] of Object.entries(v)) {
        if (on) out.push(k)
      }
    }
  }
  return out.join(' ')
}
