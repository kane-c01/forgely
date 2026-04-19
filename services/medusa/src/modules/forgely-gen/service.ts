import { MedusaService } from '@medusajs/framework/utils'
import { ForgelyGeneration, ForgelyGenerationStep } from './models/forgely-generation'

class ForgelyGenModuleService extends MedusaService({
  ForgelyGeneration,
  ForgelyGenerationStep,
}) {
  async listByTenant(tenantId: string) {
    return this.listForgelyGenerations({ tenant_id: tenantId })
  }

  async getLatestForSite(siteId: string) {
    const gens = await this.listForgelyGenerations(
      { site_id: siteId },
      { order: { created_at: 'DESC' }, take: 1 },
    )
    return gens[0] ?? null
  }

  async updateStepStatus(
    stepId: string,
    status: 'running' | 'completed' | 'failed' | 'skipped',
    extra?: { error_message?: string; output_snapshot?: unknown; credits_consumed?: number },
  ) {
    const now = new Date()
    await this.updateForgelyGenerationSteps({
      id: stepId,
      status,
      ...(status === 'running' ? { started_at: now } : {}),
      ...(['completed', 'failed'].includes(status) ? { completed_at: now } : {}),
      ...extra,
    })
  }
}

export default ForgelyGenModuleService
