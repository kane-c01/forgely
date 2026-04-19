export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'forgely-web',
      version: process.env.APP_VERSION ?? process.env.GIT_SHA ?? 'dev',
      ts: Date.now(),
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
