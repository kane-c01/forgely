/**
 * 轻量 URL 工具：避免依赖 node:url，确保可在 worker / edge 环境运行。
 */

export function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '')
  if (!path) return b
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

const XML_ESCAPE_RE = /[<>&'"]/g
const XML_ENTITY: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
}

export function escapeXml(s: string): string {
  return s.replace(XML_ESCAPE_RE, (c) => XML_ENTITY[c] ?? c)
}

const HTML_ESCAPE_RE = /[<>&"]/g
const HTML_ENTITY: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
}

export function escapeHtml(s: string): string {
  return s.replace(HTML_ESCAPE_RE, (c) => HTML_ENTITY[c] ?? c)
}

/** 截断文案到 maxLen，并尽可能在词边界 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const cut = text.slice(0, maxLen - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export function clampPriority(p: number | undefined): number | undefined {
  if (p === undefined) return undefined
  if (p < 0) return 0
  if (p > 1) return 1
  return Math.round(p * 10) / 10
}
