import { useInView, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { H3 } from '../../components/Type'

const ROWS = [
  { label: 'EN ↔ FR', w: 100, color: 'var(--color-clay)', val: '36M pairs' },
  { label: 'EN ↔ DE', w: 12.5, color: 'var(--color-sky)', val: '4.5M pairs' },
  { label: 'EN ↔ low-resource', w: 0.4, color: 'var(--color-olive)', val: '≪ 0.2M' },
] as const

/** Part 03 data-imbalance bars — widths animate in when the block scrolls into view. */
export function ImbalanceBars() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduced = useReducedMotion()
  const on = inView || !!reduced

  return (
    <div ref={ref} className="mt-14">
      <H3>…and the training data is highly unbalanced</H3>
      <p className="mb-5 max-w-[60ch] text-[15px] text-(--soft)">
        Translation models learn from pairs of sentences with their human translations. That data
        is a byproduct of history — abundant for a few politically and economically connected
        language pairs, scarce for the rest. The paper's own two benchmarks differ by 8×; most of
        the world's language pairs have almost none.
      </p>
      {ROWS.map((r) => (
        <div
          key={r.label}
          className="my-3 grid grid-cols-[190px_1fr_90px] items-center gap-3.5 max-[640px]:grid-cols-[110px_1fr_70px]"
        >
          <span className="font-display text-[12.5px] font-semibold tracking-[0.06em]">
            {r.label}
          </span>
          <div className="bg-paper h-[22px] overflow-hidden rounded-md border border-(--card-line)">
            <div
              className="h-full rounded-[5px]"
              style={{
                background: r.color,
                width: on ? `${r.w}%` : '0%',
                transition: reduced ? undefined : 'width 1.2s cubic-bezier(.2,.6,.2,1)',
              }}
            />
          </div>
          <span className="font-mono text-[13px] text-(--soft)">{r.val}</span>
        </div>
      ))}
    </div>
  )
}
