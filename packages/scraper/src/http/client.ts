import {
  BlockedError,
  NetworkError,
  NotFoundError,
  RateLimitedError,
  TimeoutError,
  UnauthorizedError,
} from '../errors.js'

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: BodyInit | null
  timeoutMs?: number
  signal?: AbortSignal
  /** Number of retries for transient errors. Default: 2. */
  retries?: number
  /** Linear backoff base in ms. Default: 500. */
  backoffMs?: number
  /** Custom fetch impl (used by tests). */
  fetchImpl?: typeof fetch
  /** When true, treat 404 as `null` instead of throwing. */
  allowNotFound?: boolean
}

export interface HttpResponse<T = unknown> {
  status: number
  headers: Headers
  url: string
  data: T
}

const DEFAULT_TIMEOUT_MS = 30_000

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
]

function pickUa(seed: number): string {
  const ua = USER_AGENTS[seed % USER_AGENTS.length]
  return ua ?? USER_AGENTS[0]!
}

function isCloudflareChallenge(text: string): boolean {
  const sample = text.slice(0, 4000).toLowerCase()
  return (
    sample.includes('cloudflare') &&
    (sample.includes('attention required') ||
      sample.includes('ray id') ||
      sample.includes('cf-chl-bypass'))
  )
}

async function readBody(res: Response): Promise<{ text: string; json: unknown }> {
  const text = await res.text()
  let json: unknown = undefined
  if (text.length > 0) {
    try {
      json = JSON.parse(text)
    } catch {
      json = undefined
    }
  }
  return { text, json }
}

async function performOnce(
  url: string,
  attempt: number,
  options: HttpRequestOptions,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const fetchImpl = options.fetchImpl ?? fetch

  const externalSignal = options.signal
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    return await fetchImpl(url, {
      method: options.method ?? 'GET',
      headers: {
        'User-Agent': pickUa(attempt),
        Accept: 'application/json, text/html;q=0.9, */*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(options.headers ?? {}),
      },
      body: options.body ?? null,
      signal: controller.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`)
    }
    throw new NetworkError(`Network failure for ${url}: ${(err as Error).message}`, err)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch wrapper with retries, UA rotation, timeout and unified error mapping.
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<T>> {
  const retries = options.retries ?? 2
  const backoff = options.backoffMs ?? 500

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await performOnce(url, attempt, options)

      if (res.status === 401 || res.status === 403) {
        const { text } = await readBody(res)
        if (isCloudflareChallenge(text)) {
          throw new BlockedError(`Cloudflare challenge served at ${url}`)
        }
        throw new UnauthorizedError(`Unauthorized (${res.status}) for ${url}`, {
          url,
          status: res.status,
        })
      }

      if (res.status === 404) {
        if (options.allowNotFound) {
          const { json } = await readBody(res)
          return {
            status: res.status,
            headers: res.headers,
            url: res.url,
            data: json as T,
          }
        }
        throw new NotFoundError(`Not found (404) at ${url}`, { url })
      }

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after') ?? 1)
        const retryAfterMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : backoff
        if (attempt < retries) {
          await sleep(retryAfterMs)
          continue
        }
        throw new RateLimitedError(retryAfterMs)
      }

      if (res.status >= 500) {
        const lastError = new NetworkError(`Upstream ${res.status} at ${url}`)
        if (attempt < retries) {
          lastErr = lastError
          await sleep(backoff * (attempt + 1))
          continue
        }
        throw lastError
      }

      const { text, json } = await readBody(res)
      // ASCII heuristic for surreptitious WAF pages with 200.
      if (json === undefined && isCloudflareChallenge(text)) {
        throw new BlockedError(`Cloudflare challenge served at ${url} with status 200`)
      }

      const data = (json ?? text) as T
      return { status: res.status, headers: res.headers, url: res.url, data }
    } catch (err) {
      lastErr = err
      if (
        err instanceof UnauthorizedError ||
        err instanceof NotFoundError ||
        err instanceof BlockedError
      ) {
        throw err
      }
      if (attempt >= retries) {
        throw err
      }
      await sleep(backoff * (attempt + 1))
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new NetworkError(`Failed to fetch ${url} after ${retries + 1} attempts`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
