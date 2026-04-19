import { getHealthStatus } from '@forgely/api/health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const report = await getHealthStatus()
  return new Response(JSON.stringify(report), {
    status: report.ok ? 200 : 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
