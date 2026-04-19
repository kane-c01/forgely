import type { MomentPromptTemplate, MomentType } from '../types'

import { m01_liquid_bath } from './m01_liquid_bath'
import { m02_levitation } from './m02_levitation'
import { m03_light_sweep } from './m03_light_sweep'
import { m04_breathing_still } from './m04_breathing_still'
import { m05_droplet_ripple } from './m05_droplet_ripple'
import { m06_mist_emergence } from './m06_mist_emergence'
import { m07_fabric_drape } from './m07_fabric_drape'
import { m08_ingredient_ballet } from './m08_ingredient_ballet'
import { m09_surface_interaction } from './m09_surface_interaction'
import { m10_environmental_embed } from './m10_environmental_embed'

export const momentTemplates: MomentPromptTemplate[] = [
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
]

export const momentTemplateById: Record<MomentType, MomentPromptTemplate> = momentTemplates.reduce(
  (acc, template) => {
    acc[template.id] = template
    return acc
  },
  {} as Record<MomentType, MomentPromptTemplate>,
)

export {
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
}
