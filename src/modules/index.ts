import type { ComponentType } from 'react'
import KVCompression from './KVCompression'
import LinearAttention from './LinearAttention'
import StateSpaceModels from './StateSpaceModels'
import TwoTower from './TwoTower'
import ContinualLearning from './ContinualLearning'
import EngramCartridges from './EngramCartridges'

/**
 * Extension-module components, keyed by slug (must match src/data/modules.ts).
 * Rendered inline in the talk scroll, so they are imported eagerly.
 */
export const MODULE_COMPONENTS: Record<string, ComponentType> = {
  'kv-compression': KVCompression,
  'linear-attention': LinearAttention,
  'state-space-models': StateSpaceModels,
  twotower: TwoTower,
  'continual-learning': ContinualLearning,
  'engram-cartridges': EngramCartridges,
}
