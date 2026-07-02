import { useMemo } from 'react'
import { PAPER } from '../../data/paper'

const W = 440
const H = 170
const P = 18
const MAXS = 40000
const SAMPLES = 200

/**
 * The Adam schedule from §5.3: lr(s) = d_model^-0.5 · min(s^-0.5, s · warmup^-1.5).
 * Linear warmup to step 4,000, then inverse-square-root decay.
 */
export function LRChart() {
  const { path, xWarm } = useMemo(() => {
    const lr = (s: number) =>
      Math.pow(PAPER.dModel, -0.5) *
      Math.min(Math.pow(s, -0.5), s * Math.pow(PAPER.warmupSteps, -1.5))
    const peak = lr(PAPER.warmupSteps)
    let d = ''
    for (let i = 1; i <= SAMPLES; i++) {
      const s = (i / SAMPLES) * MAXS
      const x = P + (W - 2 * P) * (s / MAXS)
      const y = H - P - (H - 2 * P) * (lr(s) / peak)
      d += (i === 1 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
    }
    return { path: d.trim(), xWarm: P + (W - 2 * P) * (PAPER.warmupSteps / MAXS) }
  }, [])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Learning rate warmup then decay"
      className="mt-2.5 block h-auto w-full"
    >
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="var(--wire)" strokeWidth={1.5} />
      <line
        x1={xWarm}
        y1={P}
        x2={xWarm}
        y2={H - P}
        stroke="var(--color-stone)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text
        x={xWarm + 6}
        y={P + 10}
        fontSize={10.5}
        fill="var(--color-stone)"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {PAPER.warmupSteps.toLocaleString('en-US')} warmup steps
      </text>
      <path d={path} fill="none" stroke="var(--color-clay)" strokeWidth={2.4} />
      <text
        x={W - P}
        y={H - 4}
        textAnchor="end"
        fontSize={10.5}
        fill="var(--color-stone)"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        training steps →
      </text>
    </svg>
  )
}
