/**
 * Ground-truth numbers from Vaswani et al. 2017 (arXiv:1706.03762) and
 * related sources, used across the talk. Single source of truth — do not
 * restate these as literals in components when a named constant exists.
 */
export const PAPER = {
  arxiv: 'https://arxiv.org/abs/1706.03762',
  venue: 'NeurIPS 2017',
  authors: 8,
  pages: 15,
  // data
  endeSentencePairs: '4.5M',
  endeVocab: '37k shared BPE',
  enfrSentencePairs: '36M',
  enfrVocab: '32k word-piece',
  // hardware & schedule
  gpus: '8×P100',
  gpuMemoryGB: 16,
  baseSteps: '100k',
  baseTime: '12 h',
  bigSteps: '300k',
  bigTime: '3.5 d',
  // model
  dModel: 512,
  layers: 6,
  heads: 8,
  dK: 64,
  dFF: 2048,
  paramsBase: '65M',
  paramsBig: '213M',
  // optimization
  warmupSteps: 4000,
  dropout: 0.1,
  labelSmoothing: 0.1,
  beamSize: 4,
  lengthPenalty: 0.6,
  // results
  bleuEnDe: 28.4,
  bleuEnFr: 41.8,
  // compute
  flopsBase: '3.3 × 10¹⁸',
  flopsBig: '2.3 × 10¹⁹',
} as const

export const TWOTOWER = {
  hf: 'https://huggingface.co/nvidia/Nemotron-Labs-TwoTower-30B-A3B-Base-BF16',
  name: 'Nemotron-Labs-TwoTower-30B-A3B',
  layersPerTower: 52,
  mamba2Layers: 23,
  attentionLayers: 6,
  moeLayers: 23,
  expertsRouted: 128,
  expertsActive: 6,
  expertsShared: 2,
  activeParams: '~3B',
  totalParamsPerTower: '30B',
  denoiserTrainingTokens: '~2.1T',
  contextTokens: '128K',
  throughputVsAR: '2.42×',
  qualityRetained: '98.7%',
} as const
