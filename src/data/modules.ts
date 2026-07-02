export type Accent = 'clay' | 'sky' | 'olive'

export interface ModuleMeta {
  slug: string
  num: string
  title: string
  tagline: string
  accent: Accent
  /** which Part 08 debt this module pays down */
  debt: 'memory' | 'compute' | 'sequential' | 'staleness'
}

export const MODULES: ModuleMeta[] = [
  {
    slug: 'kv-compression',
    num: 'M1',
    title: 'KV-cache compression',
    tagline: 'MQA, GQA, MLA — shrinking attention’s memory rent',
    accent: 'sky',
    debt: 'memory',
  },
  {
    slug: 'linear-attention',
    num: 'M2',
    title: 'Linear attention',
    tagline: 'Kernels, gates, and the RNN that attention secretly was',
    accent: 'olive',
    debt: 'compute',
  },
  {
    slug: 'state-space-models',
    num: 'M3',
    title: 'State-space models',
    tagline: 'S4 → Mamba → hybrids: recurrence, reborn with better parenting',
    accent: 'olive',
    debt: 'compute',
  },
  {
    slug: 'twotower',
    num: 'M4',
    title: 'Nemotron TwoTower',
    tagline: 'Block-diffusion decoding on a hybrid MoE backbone',
    accent: 'clay',
    debt: 'sequential',
  },
  {
    slug: 'continual-learning',
    num: 'M5',
    title: 'Continual learning',
    tagline: 'Models that keep learning after training ends',
    accent: 'sky',
    debt: 'staleness',
  },
  {
    slug: 'engram-cartridges',
    num: 'M6',
    title: 'Engrams & cartridges',
    tagline: 'New memory tiers between weights and context',
    accent: 'clay',
    debt: 'staleness',
  },
]

export function moduleBySlug(slug: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.slug === slug)
}

export function moduleNeighbors(slug: string): { prev?: ModuleMeta; next?: ModuleMeta } {
  const i = MODULES.findIndex((m) => m.slug === slug)
  if (i < 0) return {}
  return { prev: MODULES[i - 1], next: MODULES[i + 1] }
}
