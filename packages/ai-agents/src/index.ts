/**
 * @forgely/ai-agents — entry point.
 *
 * Sprint 0: Analyzer (T10) + DeepSeek/Qwen providers.
 * CN pivot: T13 Director · T14 Planner · T15 Copywriter · T16 Artist.
 */

// Analyzer (T10)
export {
  analyze,
  ANALYZER_CREDIT_COST,
  type AnalyzerOptions,
  type AnalyzerTelemetry,
  type AnalyzeResult,
} from './agents/analyzer'

// Director (T13)
export {
  direct,
  DIRECTOR_CREDIT_PER_SCENE,
  type DirectorOptions,
  type DirectorScript,
  type DirectorScene,
  type MomentSlot,
  type ProductInput,
} from './agents/director'

// Planner (T14)
export {
  planSite,
  PLANNER_CREDIT_COST,
  type PlannerOptions,
  type PlannerProductInput,
  type PlanResult,
} from './agents/planner'

// Copywriter (T15)
export {
  writeCopy,
  COPYWRITER_CREDIT_COST,
  type CopywriterOptions,
  type CopyResult,
} from './agents/copywriter'

// Artist (T16)
export {
  generateAsset,
  registerProvider,
  defaultProviders,
  MockArtistProvider,
  ArtistError,
  type ArtistRequest,
  type ArtistResult,
  type ArtistOptions,
  type AssetProvider,
  type AssetType,
  type AssetRegion,
} from './agents/artist'
export {
  KlingProvider,
  ViduProvider,
  FluxProvider,
  MeshyProvider,
  autoRegisterArtistProviders,
} from './agents/artist-providers'

// Conversation orchestrator (multi-turn user dialog — drives the 3 input paths)
export {
  startConversation,
  nextAssistantTurn,
  ingestUser,
  isReadyToGenerate,
  toPipelineInput,
  CONVERSATION_OPENING_CREDITS,
  CONVERSATION_PER_TURN_CREDITS,
  CollectedInfoSchema,
  type ConversationContext,
  type ConversationStage,
  type ConversationMessage,
  type AssistantTurn,
  type CollectedInfo,
  type InputPath,
  type NextTurnOptions,
  type UserAnswer,
} from './agents/conversation'

// Brand profile types
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

// LLM providers
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
