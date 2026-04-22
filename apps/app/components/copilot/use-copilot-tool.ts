'use client'

/**
 * `useCopilotTool` —— useRegisterCopilotTool 的高阶封装。
 *
 * 在 editor 里我们直接用 useRegisterCopilotTool 是因为 editor-store 是纯
 * client state，没 DB 副作用。但 W5 里 15 个页面注册的 40+ 个 tool 几乎
 * 每个都要：
 *   1. 调真 tRPC mutation 改 DB
 *   2. 写 AuditLog `copilot.tool.executed`（失败→`copilot.tool.failed`）
 *   3. 捕获错误并返回人类可读的错误消息给 Copilot drawer
 *
 * 让每个 bridge 重复这套 try/catch + 审计写入非常啰嗦。
 * `useCopilotTool` 把它们封装掉：你只负责 `run` 里调 mutation。
 *
 * @owner W5 — docs/SPRINT-3-DISPATCH.md
 */
import { trpc } from '@/lib/trpc'

import { useRegisterCopilotTool } from './copilot-provider'
import type { CopilotPageContext, ToolName } from './types'

export interface CopilotToolConfig {
  /** 执行真正的副作用；返回的字符串会作为 tool_result 回显到 drawer 里。 */
  run: (args: Record<string, unknown>) => Promise<string> | string
  /**
   * 用于 AuditLog 的 target 标识（默认 `{ type: 'copilot', id: 'n/a' }`）。
   * 对于改商品：`{ type: 'product', id: args.productId }`
   */
  auditTarget?: (args: Record<string, unknown>) => { type: string; id: string }
  /** 页面上下文（路由 kind + 关键 id），一起写进 AuditLog。 */
  pageContext?: CopilotPageContext | (() => CopilotPageContext)
}

export function useCopilotTool(name: ToolName, config: CopilotToolConfig): void {
  const recordToolUse = trpc.copilot.recordToolUse.useMutation()

  useRegisterCopilotTool(name, async (args) => {
    const target = config.auditTarget?.(args) ?? { type: 'copilot', id: 'n/a' }
    const pageContext =
      typeof config.pageContext === 'function' ? config.pageContext() : config.pageContext

    try {
      const message = await Promise.resolve(config.run(args))
      const result = typeof message === 'string' && message.length > 0 ? message : '已执行。'

      recordToolUse
        .mutateAsync({
          tool: name,
          outcome: 'success',
          targetType: target.type,
          targetId: target.id,
          arguments: args,
          result,
          pageContext: pageContext as Record<string, unknown> | undefined,
        })
        .catch(() => undefined)

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      recordToolUse
        .mutateAsync({
          tool: name,
          outcome: 'failed',
          targetType: target.type,
          targetId: target.id,
          arguments: args,
          error: message,
          pageContext: pageContext as Record<string, unknown> | undefined,
        })
        .catch(() => undefined)
      throw err
    }
  })
}
