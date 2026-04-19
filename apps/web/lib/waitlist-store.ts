import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { WaitlistInput, WaitlistRecord } from './waitlist'

/**
 * Local JSON-backed waitlist store.
 * Used until W3 (T05/T06) lands the Prisma `Waitlist` model and exposes
 * a tRPC mutation we can switch to.
 *
 * Storage path is overridable via `FORGELY_WAITLIST_PATH` for tests / serverless.
 */
const DEFAULT_PATH = path.join(process.cwd(), 'data', 'waitlist.json')

function storePath(): string {
  return process.env.FORGELY_WAITLIST_PATH ?? DEFAULT_PATH
}

async function ensureFile(file: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  try {
    await fs.access(file)
  } catch {
    await fs.writeFile(file, '[]', 'utf8')
  }
}

async function readAll(file: string): Promise<WaitlistRecord[]> {
  await ensureFile(file)
  const raw = await fs.readFile(file, 'utf8')
  try {
    const parsed = JSON.parse(raw) as WaitlistRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined
  const salt = process.env.FORGELY_HASH_SALT ?? 'forgely-mvp-salt'
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24)
}

export interface AppendOptions {
  ip?: string | undefined
  userAgent?: string | undefined
}

export async function appendWaitlist(
  input: WaitlistInput,
  options: AppendOptions = {},
): Promise<{ created: boolean; record: WaitlistRecord }> {
  const file = storePath()
  const all = await readAll(file)

  const existing = all.find((r) => r.email.toLowerCase() === input.email.toLowerCase())
  if (existing) {
    return { created: false, record: existing }
  }

  const record: WaitlistRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ipHash: hashIp(options.ip),
    userAgent: options.userAgent,
    source: 'web',
  }
  all.push(record)
  await fs.writeFile(file, JSON.stringify(all, null, 2), 'utf8')
  return { created: true, record }
}

export async function countWaitlist(): Promise<number> {
  const all = await readAll(storePath())
  return all.length
}
