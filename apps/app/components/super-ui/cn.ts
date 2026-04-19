/**
 * Tiny className combiner — keeps the /super module dependency-free until
 * the shared `@forgely/ui` package (T03) lands. Replace with `clsx` when
 * available.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
