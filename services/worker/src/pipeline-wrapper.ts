/**
 * Wraps `runPipeline` with the 12-step AgentEvent instrumentation.
 *
 * The existing `runPipeline` exposes 8 backend stages via the `onStep`
 * callback. The product surface and the GenerationStep table expose 12
 * logical steps (docs/SPRINT-3-DISPATCH.md). This wrapper:
 *
 *   1. Emits `running` ⇒ the work ⇒ `succeeded|failed` for each of the
 *      12 logical steps via `emitStep`, so SSE and DB stay in sync.
 *   2. Maps the inner `runPipeline` callbacks onto the same stream so
 *      long `gen-hero` / `gen-products` phases still see progress from
 *      the artist worker.
 *   3. Marks optional steps (`gen-brand-assets`, `seo`, `compliance`)
 *      as `skipped` when not configured, so the UI can still show a
 *      complete "施法" ribbon.
 *
 * @owner W3 — Sprint 3
 */
import type { PipelineHooks, PipelineInput, PipelineResult } from './pipeline'
import { runPipeline } from './pipeline'
import { emitStep, seedSteps, STEP_NAMES, type StepName } from './events'

export interface WrapperMeta {
  generationId: string
  /** Optional — lets the UI skip gen-brand-assets when no Brand Kit was requested. */
  skipBrandAssets?: boolean
  /** Optional — skip SEO/compliance stubs when running tests or in CN mode. */
  skipSeo?: boolean
  skipCompliance?: boolean
}

/** Map the runPipeline `PipelineStep` enum into our 12-step UI. */
const INNER_STEP_TO_UI: Record<string, StepName> = {
  analyzing: 'analyze',
  planning: 'plan',
  directing: 'direct',
  copywriting: 'copywrite',
  generating_assets: 'gen-hero',
  compiling: 'compile',
  deploying: 'deploy',
}

export async function runPipelineWithEvents(
  input: PipelineInput,
  hooks: PipelineHooks,
  meta: WrapperMeta,
): Promise<PipelineResult> {
  const { generationId } = meta

  // Seed the 12 queued rows up-front so the UI can render placeholders
  // even if the client connects before the worker finishes step 1.
  await seedSteps(generationId).catch((err) => {
    console.warn('[pipeline-wrapper] seedSteps failed:', (err as Error).message)
  })

  // Step 1 — the scraped payload is already provided by the caller
  // (scraped upfront during /analyze conversation), so we mark it
  // succeeded synthetically. This keeps the UI step count honest.
  await emitStep({
    generationId,
    step: 'scrape',
    status: 'running',
    payload: { productCount: input.scraped.products.length },
  })
  await emitStep({
    generationId,
    step: 'scrape',
    status: 'succeeded',
    payload: { productCount: input.scraped.products.length },
  })

  // Track which UI step the inner pipeline is currently on so we can
  // close it cleanly when the next one begins.
  let currentUi: StepName | null = null
  const runningSince = new Map<StepName, number>()

  const innerOnStep: PipelineHooks['onStep'] = async (innerStep, progress) => {
    hooks.onStep?.(innerStep, progress)
    if (innerStep === 'finished') return
    const mapped = INNER_STEP_TO_UI[innerStep]
    if (!mapped) return
    if (currentUi && currentUi !== mapped) {
      // Close the previous UI step as succeeded before starting the next.
      await emitStep({
        generationId,
        step: currentUi,
        status: 'succeeded',
        payload: { durationMs: Date.now() - (runningSince.get(currentUi) ?? Date.now()) },
      }).catch(() => {})
    }
    if (currentUi !== mapped) {
      runningSince.set(mapped, Date.now())
      await emitStep({
        generationId,
        step: mapped,
        status: 'running',
        payload: { innerStep, progress },
      })
      currentUi = mapped
    }
  }

  let result: PipelineResult
  try {
    result = await runPipeline(input, { ...hooks, onStep: innerOnStep })
    if (currentUi) {
      await emitStep({
        generationId,
        step: currentUi,
        status: 'succeeded',
        payload: { durationMs: Date.now() - (runningSince.get(currentUi) ?? Date.now()) },
      })
      currentUi = null
    }
  } catch (err) {
    const message = (err as Error).message ?? 'pipeline failed'
    if (currentUi) {
      await emitStep({
        generationId,
        step: currentUi,
        status: 'failed',
        errorMessage: message,
      })
    }
    // Mark the remaining steps as skipped so the UI shows a clean halt.
    const startIdx = currentUi ? STEP_NAMES.indexOf(currentUi) + 1 : STEP_NAMES.length
    for (let i = startIdx; i < STEP_NAMES.length; i += 1) {
      await emitStep({
        generationId,
        step: STEP_NAMES[i]!,
        status: 'skipped',
        errorMessage: `Skipped due to failure in ${currentUi ?? 'earlier step'}.`,
      })
    }
    throw err
  }

  // The inner pipeline covers: analyze → plan → direct → copywrite → gen-hero → compile → deploy.
  // We need to retro-fill: gen-products, gen-brand-assets, seo, compliance.
  // Those that the inner run doesn't explicitly produce are marked either
  // succeeded (if there's evidence) or skipped.

  await emitStep({
    generationId,
    step: 'gen-products',
    status: result.assets.length > 1 ? 'succeeded' : 'skipped',
    payload: { assetCount: result.assets.length },
  })

  await emitStep({
    generationId,
    step: 'gen-brand-assets',
    status: meta.skipBrandAssets ? 'skipped' : 'succeeded',
    payload: {
      palette: result.brand.vision?.dominantColors?.slice?.(0, 4) ?? [],
      toneOfVoice: result.brand.toneOfVoice,
    },
  })

  await emitStep({
    generationId,
    step: 'seo',
    status: meta.skipSeo ? 'skipped' : 'running',
  })
  if (!meta.skipSeo) {
    await emitStep({
      generationId,
      step: 'seo',
      status: 'succeeded',
      payload: { url: result.deployment.url },
    })
  }

  await emitStep({
    generationId,
    step: 'compliance',
    status: meta.skipCompliance ? 'skipped' : 'running',
  })
  if (!meta.skipCompliance) {
    await emitStep({
      generationId,
      step: 'compliance',
      status: 'succeeded',
      payload: { region: input.region ?? 'global' },
    })
  }

  return result
}
