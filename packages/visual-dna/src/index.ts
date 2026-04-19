/**
 * @forgely/visual-dna — 10 cinematic Visual DNA presets, the matcher used
 * by the Analyzer Agent, and the prompt builder used by Director / Artist.
 * See `docs/MASTER.md` §10 and Appendix A.
 */
export * from './types'
export * from './presets'
export { matchDNA, recommendDNA } from './utils/matchDNA'
export { buildPromptFragments, buildPromptSuffix, type PromptFragments } from './utils/buildPrompt'
