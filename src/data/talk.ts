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
  { id: 'impact', label: '07 Blast radius', dark: false },
  { id: 'debt', label: '08 The bills', dark: true },
  { id: 'close', label: '09 Coda', dark: true },
]
