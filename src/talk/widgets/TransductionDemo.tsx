import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

const DEMOS = [
  {
    lab: 'Machine translation',
    a: 'Der schnelle braune Fuchs springt über den faulen Hund.',
    b: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    lab: 'Speech → text',
    a: '▁▂▅▇▅▂▁▂▄▆▇▆▃▁ (16 kHz waveform)',
    b: '“attention is all you need”',
  },
  {
    lab: 'Intent → code',
    a: 'sort a list of numbers, descending',
    b: 'sorted(xs, reverse=True)',
  },
  {
    lab: 'English → parse tree (the paper’s own generalization test)',
    a: 'The cat sat.',
    b: '(S (NP The cat) (VP sat) .)',
  },
]

const TYPE_MS = 34
const ROTATE_MS = 5200

/** Blinking clay caret, steps(1)-style — only rendered when motion is allowed. */
function Caret() {
  return (
    <motion.span
      aria-hidden="true"
      className="bg-clay inline-block h-[17px] w-2 align-[-2px]"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: 'linear' }}
    />
  )
}

/**
 * Part 01 typing demo: four rotating input→output transduction pairs.
 * Output types on character-by-character; instant text when reduced motion.
 */
export function TransductionDemo() {
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [chars, setChars] = useState(0)
  const demo = DEMOS[idx % DEMOS.length]

  // Rotate demos on a fixed cadence (the original rotates even under reduced motion).
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => i + 1), ROTATE_MS)
    return () => clearInterval(t)
  }, [])

  // Type-on effect for the current demo's output.
  useEffect(() => {
    if (reduced) return
    setChars(0)
    const target = DEMOS[idx % DEMOS.length].b.length
    let k = 0
    const t = setInterval(() => {
      k++
      setChars(k)
      if (k >= target) clearInterval(t)
    }, TYPE_MS)
    return () => clearInterval(t)
  }, [idx, reduced])

  return (
    <div
      aria-live="off"
      className="text-paper min-h-[120px] rounded-xl border border-(--card-line) bg-(--card-bg) px-8 py-[30px] font-mono text-[15.5px]"
    >
      <div className="text-clay font-display mb-2.5 text-[11px] font-semibold tracking-[0.2em] uppercase">
        {demo.lab}
      </div>
      <div className="text-stone">{demo.a}</div>
      <div className="text-paper mt-2">
        {reduced ? demo.b : demo.b.slice(0, chars)}
        {!reduced && <Caret />}
      </div>
    </div>
  )
}
