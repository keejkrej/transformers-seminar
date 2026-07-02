import { motion, useReducedMotion } from 'motion/react'
import { PAPER } from '../../data/paper'

interface Rung {
  label: string
  /** bar width in % of track — position on the log axis */
  w: number
  fill: string
  value: string
}

const RUNGS: Rung[] = [
  { label: 'Transformer base · 2017', w: 15, fill: 'bg-olive', value: PAPER.flopsBase },
  { label: 'Transformer big · 2017', w: 24, fill: 'bg-sky', value: PAPER.flopsBig },
  { label: 'GPT-3 · 2020', w: 66, fill: 'bg-stone', value: '3.1 × 10²³' },
  { label: 'Frontier run · ~2025', w: 97, fill: 'bg-clay', value: '~10²⁶' },
]

/** Log-scale training-compute ladder; bars sweep to width when scrolled into view. */
export function ComputeLadder() {
  const reduced = useReducedMotion()
  return (
    <div>
      {RUNGS.map((r) => (
        <div
          key={r.label}
          className="my-3.5 grid grid-cols-[110px_1fr] items-center gap-4 min-[640px]:grid-cols-[210px_1fr]"
        >
          <span className="font-display text-[12.5px] font-semibold tracking-[0.04em]">
            {r.label}
          </span>
          <div className="bg-paper relative h-[26px] rounded-md border border-(--card-line)">
            {reduced ? (
              <div
                className={`absolute inset-y-0 left-0 rounded-[5px] ${r.fill}`}
                style={{ width: `${r.w}%` }}
              />
            ) : (
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-[5px] ${r.fill}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${r.w}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.3, ease: [0.2, 0.6, 0.2, 1] }}
              />
            )}
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[12.5px] text-(--soft)">
              {r.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
