import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * Module page registry, keyed by slug (must match src/data/modules.ts).
 * Each page is a default-exported component, lazy-loaded per route.
 */
export const MODULE_PAGES: Record<string, LazyExoticComponent<ComponentType>> = {
  'kv-compression': lazy(() => import('./KVCompression')),
  'linear-attention': lazy(() => import('./LinearAttention')),
  'state-space-models': lazy(() => import('./StateSpaceModels')),
  twotower: lazy(() => import('./TwoTower')),
  'continual-learning': lazy(() => import('./ContinualLearning')),
  'engram-cartridges': lazy(() => import('./EngramCartridges')),
}
