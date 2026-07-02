export interface TalkSection {
  id: string
  label: string
  dark: boolean
}

/** Section order of the talk — Rail and keyboard nav are driven by this. */
export const TALK_SECTIONS: TalkSection[] = [
  { id: 'hero', label: '00 Opening', dark: true },
  { id: 'task', label: '01 The task', dark: false },
  { id: 'before', label: '02 Before', dark: false },
  { id: 'google', label: '03 Why Google', dark: false },
  { id: 'lineage', label: '04 Lineage', dark: false },
  { id: 'new', label: '05 The idea', dark: true },
  { id: 'training', label: '06 The recipe', dark: false },
  { id: 'impact', label: '07 Impact', dark: false },
  { id: 'debt', label: '08 The costs', dark: true },
  { id: 'kv-compression', label: 'M1 KV cache', dark: true },
  { id: 'linear-attention', label: 'M2 Linear attn', dark: true },
  { id: 'state-space-models', label: 'M3 State space', dark: true },
  { id: 'twotower', label: 'M4 TwoTower', dark: true },
  { id: 'continual-learning', label: 'M5 Continual', dark: true },
  { id: 'engram-cartridges', label: 'M6 Engrams', dark: true },
  { id: 'close', label: '09 Coda', dark: true },
]
