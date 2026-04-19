/**
 * @forgely/ai-agents — entry point.
 *
 * Sprint-0 ships the Analyzer Agent (T10).
 * CN pivot adds DeepSeek + Qwen providers.
 * Sprint-2 will add Director (T13), Planner (T14), Copywriter (T15).
 */
export {
  analyze,
  ANALYZER_CREDIT_COST,
  type AnalyzerOptions,
  type AnalyzerTelemetry,
  type AnalyzeResult,
} from './agents/analyzer'

export type {
  BrandProfile,
  BrandArchetype,
  PriceSegment,
  Tone,
  TargetCustomer,
  VisionAnalysis,
  AnalyzerStats,
} from './types/brand-profile'

export { VISUAL_DNA_IDS, type VisualDnaId } from './types/dna'

export {
  AnthropicProvider,
  DeepSeekProvider,
  MockLlmProvider,
  QwenProvider,
  resolveProvider,
  type LlmProvider,
  type LlmModel,
  type LlmResponse,
  type LlmTextRequest,
  type LlmVisionRequest,
  LlmProviderError,
} from './providers'

export {
  direct,
  type DirectorOptions,
  type DirectorScript,
  type DirectorScene,
} from './agents/director'

export {
  planSite,
  type PlannerOptions,
  type PlanResult,
} from './agents/planner'

export {
  writeCopy,
  type CopywriterOptions,
  type CopyResult,
} from './agents/copywriter'
