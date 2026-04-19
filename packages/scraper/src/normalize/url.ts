/**
 * Resolve a possibly-relative URL against a base. Returns null if the input
 * is empty or completely unparseable.
 */
export function absoluteUrl(input: string | null | undefined, base: string): string | null {
  if (input == null) return null
  const trimmed = input.trim()
  if (trimmed.length === 0) return null
  try {
    return new URL(trimmed, base).toString()
  } catch {
    return null
  }
}

/**
 * Strip query-string and fragment for canonicalisation (used as image storage key).
 */
export function urlPathOnly(input: string): string {
  try {
    const u = new URL(input)
    return `${u.origin}${u.pathname}`
  } catch {
    return input
  }
}

/** Get the apex hostname (without `www.`). */
export function apexHostname(input: string): string {
  try {
    const u = new URL(input)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return input
  }
}

/** Slugify a string into a URL-safe handle. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item'
}
