import { useInView, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Btn } from '../../components/Buttons'
import { H3 } from '../../components/Type'

const NC = 12
const CELLS = Array.from({ length: NC }, (_, i) => i)

function RaceRow({
  name,
  litCount,
  litClass,
  label,
}: {
  name: string
  litCount: number
  litClass: string
  label: string
}) {
  return (
    <div className="my-4 flex items-center gap-3.5">
      <span className="font-display w-[120px] flex-none text-xs font-semibold tracking-[0.12em] uppercase max-sm:w-20 max-sm:text-[10.5px]">
        {name}
      </span>
      <div className="flex flex-wrap gap-[5px]">
        {CELLS.map((i) => (
          <div
            key={i}
            className={`h-[26px] w-[26px] rounded-[6px] border-[1.5px] transition-colors duration-[250ms] ${
              i < litCount ? litClass : 'border-stone'
            }`}
          />
        ))}
      </div>
      <span className="font-mono w-[110px] flex-none text-right text-[13px] text-(--soft) max-sm:hidden">
        {label}
      </span>
    </div>
  )
}

/**
 * The parallelism race: an RNN row lights its 12 cells one-by-one while the
 * Transformer row lights all of them in a single step. Auto-runs on first
 * view; "Run again" replays it.
 */
export function RaceWidget() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const timers = useRef<number[]>([])
  const autoRan = useRef(false)

  const [seqLit, setSeqLit] = useState(0)
  const [parLit, setParLit] = useState(false)
  const [seqLabel, setSeqLabel] = useState('t = 0')
  const [parLabel, setParLabel] = useState('t = 0')

  const runRace = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current.length = 0
    setSeqLit(0)
    setParLit(false)
    setSeqLabel('t = 0')
    setParLabel('t = 0')
    if (reduced) {
      setSeqLit(NC)
      setParLit(true)
      setSeqLabel(`t = ${NC} steps`)
      setParLabel('t = 1 step')
      return
    }
    timers.current.push(
      window.setTimeout(() => {
        setParLit(true)
        setParLabel('t = 1 step ✓')
      }, 420),
    )
    for (let i = 0; i < NC; i++) {
      timers.current.push(
        window.setTimeout(
          () => {
            setSeqLit(i + 1)
            setSeqLabel(`t = ${i + 1}${i === NC - 1 ? ' steps ✓' : ''}`)
          },
          420 + i * 300,
        ),
      )
    }
  }, [reduced])

  useEffect(() => {
    if (inView && !autoRan.current) {
      autoRan.current = true
      runRace()
    }
  }, [inView, runRace])

  useEffect(() => {
    const pending = timers.current
    return () => {
      // `pending` is the same array for the component's whole life — runRace
      // clears it in place rather than reassigning — so this sees every
      // timeout still outstanding at unmount.
      pending.forEach((t) => window.clearTimeout(t))
      pending.length = 0
    }
  }, [])

  return (
    <div
      ref={ref}
      className="mt-[50px] rounded-xl border border-(--card-line) bg-(--card-bg) px-7 py-[30px]"
    >
      <H3>The parallelism problem</H3>
      <p className="max-w-[60ch] text-[15px] text-(--soft)">
        Step <span className="font-mono text-[0.85em]">t</span> needs the hidden state of step{' '}
        <span className="font-mono text-[0.85em]">t−1</span>. Within one training example, a
        recurrent net cannot be parallelized — no matter how many chips you own.
      </p>
      <RaceRow name="RNN / LSTM" litCount={seqLit} litClass="border-sky bg-sky" label={seqLabel} />
      <RaceRow
        name="Transformer"
        litCount={parLit ? NC : 0}
        litClass="border-clay bg-clay"
        label={parLabel}
      />
      <div className="mt-[18px]">
        <Btn onClick={runRace}>Run again</Btn>
      </div>
    </div>
  )
}
