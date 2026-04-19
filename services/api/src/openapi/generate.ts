/**
 * Hand-rolled OpenAPI 3.1 generator for the Forgely tRPC API.
 *
 * Why hand-rolled (vs `trpc-openapi`)?
 *   - tRPC v10's openapi extension requires per-procedure `.meta({ openapi })`
 *     decorators on every router; that's a lot of churn for an MVP.
 *   - For external integrators (MCP, Zapier, Make.com) we only need a stable
 *     summary of the public surface, not full request/response schemas.
 *
 * This generator walks the existing `appRouter` and emits an OpenAPI
 * document that lists every procedure as a POST endpoint under
 * `/api/trpc/{procedurePath}` with the canonical tRPC payload shape.
 *
 * @owner W3 (Sprint 3 — S3-6)
 */

import type { AppRouter } from '../router/index.js'

interface OpenApiDoc {
  openapi: string
  info: { title: string; version: string; description: string }
  servers: { url: string; description: string }[]
  paths: Record<string, OpenApiPath>
  components: { schemas: Record<string, unknown> }
}

interface OpenApiPath {
  post: {
    operationId: string
    tags: string[]
    summary: string
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: string }
        }
      }
    }
    responses: {
      '200': { description: string }
      '4XX': { description: string; content: { 'application/json': { schema: { $ref: string } } } }
      '5XX': { description: string }
    }
  }
}

const PUBLIC_PROCEDURES: ReadonlySet<string> = new Set([
  // public reads — no auth required.
  'auth.signup',
  'auth.signin',
  'auth.requestPasswordReset',
  'auth.confirmPasswordReset',
  'auth.verifyEmail',
  'auth.me',
  'billing.catalog',
])

/**
 * Walk the router definitions and collect procedure metadata. The router
 * shape comes from `@trpc/server` v10; we only need names + types so a
 * loose runtime walk is enough.
 */
const walkRouter = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any,
  prefix = '',
): { path: string; type: 'query' | 'mutation' | 'subscription' }[] => {
  const procedures: { path: string; type: 'query' | 'mutation' | 'subscription' }[] = []
  const def = router._def ?? router.def
  if (!def) return procedures

  // tRPC v10 legacy shape
  if (def.procedures) {
    for (const [name, proc] of Object.entries<{ _def?: { type?: string } }>(def.procedures)) {
      const type = (proc._def?.type ?? 'query') as 'query' | 'mutation' | 'subscription'
      procedures.push({ path: prefix ? `${prefix}.${name}` : name, type })
    }
  }
  // tRPC v10 nested router shape
  if (def.record) {
    for (const [name, value] of Object.entries(def.record)) {
      if (value && typeof value === 'object' && '_def' in (value as object)) {
        const nested = value as { _def?: { router?: boolean; type?: string } }
        if (nested._def?.router) {
          procedures.push(...walkRouter(value, prefix ? `${prefix}.${name}` : name))
        } else {
          const type = (nested._def?.type ?? 'query') as 'query' | 'mutation' | 'subscription'
          procedures.push({ path: prefix ? `${prefix}.${name}` : name, type })
        }
      }
    }
  }
  return procedures
}

const namespaceOf = (proc: string): string => proc.split('.')[0] ?? 'default'

const buildPath = (proc: string, type: 'query' | 'mutation' | 'subscription'): OpenApiPath => ({
  post: {
    operationId: proc.replace(/\./g, '_'),
    tags: [namespaceOf(proc)],
    summary: `tRPC ${type}: ${proc}`,
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/TrpcRequest' },
        },
      },
    },
    responses: {
      '200': { description: 'Success — payload depends on the procedure.' },
      '4XX': {
        description: 'Validation / auth error',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/TrpcError' } },
        },
      },
      '5XX': { description: 'Internal error' },
    },
  },
})

export interface BuildOpenApiOptions {
  baseUrl?: string
  version?: string
}

export const buildOpenApi = (router: AppRouter, options: BuildOpenApiOptions = {}): OpenApiDoc => {
  const procedures = walkRouter(router)
  const paths: Record<string, OpenApiPath> = {}
  for (const proc of procedures) {
    paths[`/api/trpc/${proc.path}`] = buildPath(proc.path, proc.type)
  }
  void PUBLIC_PROCEDURES // reserved for follow-up: emit `security: []` for public procs.

  return {
    openapi: '3.1.0',
    info: {
      title: 'Forgely API',
      version: options.version ?? '0.1.0',
      description:
        'Forgely backend tRPC surface. Each procedure is reachable at POST ' +
        '/api/trpc/{procedure}. The body shape is `{ "json": <input> }` (tRPC ' +
        'v10 with superjson transformer); responses are wrapped as ' +
        '`{ result: { data: { json: ... } } }`. Bearer tokens (or the ' +
        '`forgely_session` HttpOnly cookie) gate non-public procedures.',
    },
    servers: [
      {
        url: options.baseUrl ?? 'https://app.forgely.com',
        description: 'Production',
      },
      { url: 'http://localhost:3001', description: 'Local development' },
    ],
    paths,
    components: {
      schemas: {
        TrpcRequest: {
          type: 'object',
          properties: {
            json: { type: 'object', additionalProperties: true },
          },
        },
        TrpcError: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: {
                  type: 'string',
                  enum: [
                    'UNAUTHORIZED',
                    'FORBIDDEN',
                    'BAD_REQUEST',
                    'NOT_FOUND',
                    'CONFLICT',
                    'TOO_MANY_REQUESTS',
                    'INTERNAL_SERVER_ERROR',
                  ],
                },
                data: {
                  type: 'object',
                  properties: {
                    forgelyCode: { type: 'string' },
                    httpStatus: { type: 'integer' },
                    localizedMessages: {
                      type: 'object',
                      properties: {
                        en: { type: 'string' },
                        'zh-CN': { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}
