/**
 * @forgely/product-moments — 10 Moment templates, the rule-based selector,
 * and the Kling prompt builder. See `docs/MASTER.md` §11 and Appendix B.
 */
export * from './types'
export {
  momentTemplates,
  momentTemplateById,
  m01_liquid_bath,
  m02_levitation,
  m03_light_sweep,
  m04_breathing_still,
  m05_droplet_ripple,
  m06_mist_emergence,
  m07_fabric_drape,
  m08_ingredient_ballet,
  m09_surface_interaction,
  m10_environmental_embed,
} from './templates'
export { selectMoment, selectMomentTemplate } from './utils/selectMoment'
export {
  buildKlingPrompt,
  type BuildKlingPromptInput,
  type KlingPromptPayload,
} from './utils/buildKlingPrompt'
