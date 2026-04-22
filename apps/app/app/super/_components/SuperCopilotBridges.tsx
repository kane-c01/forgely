'use client'

/**
 * 挂在 /super/layout 里的合并 Bridge —— 无论在 /super 下哪个子页
 * 都会让 Copilot 看到全部 super_* 工具。
 *
 * @owner W5 — docs/SPRINT-3-DISPATCH.md
 */
import {
  SuperFinanceCopilotBridge,
  SuperMarketingCopilotBridge,
  SuperPluginsCopilotBridge,
  SuperSitesCopilotBridge,
  SuperUsersCopilotBridge,
} from '@/components/copilot/bridges'

export function SuperCopilotBridges() {
  return (
    <>
      <SuperUsersCopilotBridge />
      <SuperFinanceCopilotBridge />
      <SuperSitesCopilotBridge />
      <SuperPluginsCopilotBridge />
      <SuperMarketingCopilotBridge />
    </>
  )
}
