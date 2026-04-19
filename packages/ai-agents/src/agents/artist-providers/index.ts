export { KlingProvider } from './kling'
export { ViduProvider } from './vidu'
export { FluxProvider } from './flux'
export { MeshyProvider } from './meshy'

import { type AssetProvider, registerProvider } from '../artist'
import { KlingProvider } from './kling'
import { ViduProvider } from './vidu'
import { FluxProvider } from './flux'
import { MeshyProvider } from './meshy'

/**
 * Auto-register all providers with API keys present in env.
 * Call once at boot (e.g. from `services/worker`).
 */
export function autoRegisterArtistProviders(): AssetProvider[] {
  const list: AssetProvider[] = []
  if (process.env.KLING_API_KEY) {
    const p = new KlingProvider({ apiKey: process.env.KLING_API_KEY })
    registerProvider(p)
    list.push(p)
  }
  if (process.env.VIDU_API_KEY) {
    const p = new ViduProvider({ apiKey: process.env.VIDU_API_KEY })
    registerProvider(p)
    list.push(p)
  }
  if (process.env.FAL_API_KEY) {
    const p = new FluxProvider({ apiKey: process.env.FAL_API_KEY })
    registerProvider(p)
    list.push(p)
  }
  if (process.env.MESHY_API_KEY) {
    const p = new MeshyProvider({ apiKey: process.env.MESHY_API_KEY })
    registerProvider(p)
    list.push(p)
  }
  return list
}
