import type { ReactNode } from 'react'

/**
 * Chinese segment layout — overrides the root layout's `<html lang>`
 * is not possible inside a child layout, so we instead annotate the
 * subtree with `lang="zh-CN"` on a wrapping div for screen readers /
 * search bots.
 */
export default function ZhLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="zh-CN" className="contents">
      {children}
    </div>
  )
}
