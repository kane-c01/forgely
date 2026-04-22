/**
 * Demo / mock fallbacks for the dashboard (see `selectDataSource`, generation SSE).
 *
 * Set `NEXT_PUBLIC_FORGELY_DEMO_FALLBACK=false` (or `0` / `off` / `no`) to disable:
 * - in-memory catalog/order/customer/site mocks when tRPC fails or is still loading
 * - scripted fake timer on `/sites/.../generating` when the EventSource stream is unavailable
 *
 * Default is **enabled** so local dev works without API + DB.
 */
export function isDemoFallbackEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_FORGELY_DEMO_FALLBACK
  if (v === undefined || v === '') return true
  const s = String(v).toLowerCase().trim()
  return s !== '0' && s !== 'false' && s !== 'off' && s !== 'no'
}
