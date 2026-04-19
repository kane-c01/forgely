/**
 * Lightweight fetch mock for adapter tests where wiring up MSW would be
 * overkill (e.g. probing `canHandle`).
 */
export interface FetchRoute {
  match: (url: string, init?: RequestInit) => boolean
  respond: (url: string, init?: RequestInit) => Response | Promise<Response>
}

export interface CreateMockFetchOptions {
  unhandled?: 'throw' | 'empty404'
}

export function createMockFetch(
  routes: FetchRoute[],
  options: CreateMockFetchOptions = { unhandled: 'throw' },
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    for (const route of routes) {
      if (route.match(url, init)) {
        return route.respond(url, init)
      }
    }
    if (options.unhandled === 'empty404') {
      return new Response('not found', { status: 404 })
    }
    throw new Error(`Unhandled mock fetch: ${url}`)
  }) as typeof fetch
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  })
}

export function text(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: init.status ?? 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...(init.headers as Record<string, string> | undefined),
    },
  })
}

export function notFound(): Response {
  return new Response('not found', { status: 404 })
}

export function rawError(status: number, body = 'upstream error'): Response {
  return new Response(body, { status })
}
