import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Btn, Pill } from '../../components/Buttons'
import { Card } from '../../components/Card'

/**
 * Stability–plasticity playground: a real (tiny) logistic-regression model
 * trained live on two conflicting 2-D tasks, sequentially. Pick the
 * continual-learning strategy and watch task A's accuracy survive or collapse.
 * All curves come from an actual seeded simulation — nothing is hand-drawn.
 */

type Strategy = 'naive' | 'ewc' | 'replay' | 'frozen'

interface Pt {
  x: number
  y: number
  label: 1 | -1
}

interface Weights {
  w1: number
  w2: number
  b: number
}

interface Snap extends Weights {
  accA: number
  accB: number
}

const STEPS_A = 240
const STEPS_B = 240
const LR = 0.5
const LAMBDA = 60
const REPLAY_FRAC = 0.1
const NOISE = 0.55
const SEED = 20170612 // the paper's arXiv date

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(rng: () => number): number {
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Two Gaussian clusters at ±(cx, cy); the +cluster is labeled +1. */
function makeTask(rng: () => number, cx: number, cy: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < 40; i++) {
    pts.push({ x: cx + gauss(rng) * NOISE, y: cy + gauss(rng) * NOISE, label: 1 })
    pts.push({ x: -cx + gauss(rng) * NOISE, y: -cy + gauss(rng) * NOISE, label: -1 })
  }
  return pts
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const score = (w: Weights, p: Pt) => w.w1 * p.x + w.w2 * p.y + w.b

function gradOf(w: Weights, data: Pt[]): Weights {
  let g1 = 0
  let g2 = 0
  let gb = 0
  for (const p of data) {
    const err = sigmoid(score(w, p)) - (p.label > 0 ? 1 : 0)
    g1 += err * p.x
    g2 += err * p.y
    gb += err
  }
  const n = data.length
  return { w1: g1 / n, w2: g2 / n, b: gb / n }
}

function accOf(w: Weights, data: Pt[]): number {
  let c = 0
  for (const p of data) if (score(w, p) > 0 === p.label > 0) c++
  return c / data.length
}

/** Diagonal Fisher information of the logistic model on task data. */
function fisherOf(w: Weights, data: Pt[]): Weights {
  let f1 = 0
  let f2 = 0
  let fb = 0
  for (const p of data) {
    const s = sigmoid(score(w, p))
    const v = s * (1 - s)
    f1 += v * p.x * p.x
    f2 += v * p.y * p.y
    fb += v
  }
  const n = data.length
  return { w1: f1 / n, w2: f2 / n, b: fb / n }
}

function simulate(strategy: Strategy, A: Pt[], B: Pt[]): Snap[] {
  let w: Weights = { w1: 0, w2: 0, b: 0 }
  const snap = (): Snap => ({ ...w, accA: accOf(w, A), accB: accOf(w, B) })
  const hist: Snap[] = [snap()]
  for (let s = 0; s < STEPS_A; s++) {
    const g = gradOf(w, A)
    w = { w1: w.w1 - LR * g.w1, w2: w.w2 - LR * g.w2, b: w.b - LR * g.b }
    hist.push(snap())
  }
  const star: Weights = { ...w }
  const F = fisherOf(w, A)
  for (let s = 0; s < STEPS_B; s++) {
    if (strategy === 'frozen') {
      hist.push(snap())
      continue
    }
    let g = gradOf(w, B)
    if (strategy === 'replay') {
      const gA = gradOf(w, A)
      g = {
        w1: (1 - REPLAY_FRAC) * g.w1 + REPLAY_FRAC * gA.w1,
        w2: (1 - REPLAY_FRAC) * g.w2 + REPLAY_FRAC * gA.w2,
        b: (1 - REPLAY_FRAC) * g.b + REPLAY_FRAC * gA.b,
      }
    } else if (strategy === 'ewc') {
      g = {
        w1: g.w1 + LAMBDA * F.w1 * (w.w1 - star.w1),
        w2: g.w2 + LAMBDA * F.w2 * (w.w2 - star.w2),
        b: g.b + LAMBDA * F.b * (w.b - star.b),
      }
    }
    w = { w1: w.w1 - LR * g.w1, w2: w.w2 - LR * g.w2, b: w.b - LR * g.b }
    hist.push(snap())
  }
  return hist
}

const STRATEGIES: { key: Strategy; label: string; desc: string }[] = [
  {
    key: 'naive',
    label: 'Naive SGD',
    desc: 'Plain gradient descent on task B. Nothing in the loss remembers task A exists.',
  },
  {
    key: 'ewc',
    label: 'EWC tether',
    desc: 'Task-B loss plus a Fisher-weighted quadratic penalty pulling every weight back toward its task-A value (λ = 60).',
  },
  {
    key: 'replay',
    label: '10% replay',
    desc: 'Every task-B gradient step mixes in 10% task-A data — the Ibrahim et al. recipe, in miniature.',
  },
  {
    key: 'frozen',
    label: 'Frozen (RAG)',
    desc: 'Weights never move. Task A is safe forever; task B never enters the weights and must ride in the context instead.',
  },
]

const monoStyle = { fontFamily: 'var(--font-mono)' } as const

/** Left panel: the two datasets plus the live decision boundary. */
function DataPanel({ A, B, cur }: { A: Pt[]; B: Pt[]; cur: Snap }) {
  const C = 150
  const S = 44
  const px = (v: number) => C + v * S
  const py = (v: number) => C - v * S

  const n2 = cur.w1 * cur.w1 + cur.w2 * cur.w2
  let boundary: { x1: number; y1: number; x2: number; y2: number } | null = null
  let plus: { x: number; y: number } | null = null
  if (n2 > 1e-4) {
    const p0x = (-cur.b * cur.w1) / n2
    const p0y = (-cur.b * cur.w2) / n2
    const inv = 1 / Math.sqrt(n2)
    const dx = -cur.w2 * inv
    const dy = cur.w1 * inv
    const L = 8
    boundary = {
      x1: px(p0x - dx * L),
      y1: py(p0y - dy * L),
      x2: px(p0x + dx * L),
      y2: py(p0y + dy * L),
    }
    plus = { x: px(p0x + cur.w1 * inv * 0.85), y: py(p0y + cur.w2 * inv * 0.85) }
  }

  return (
    <svg viewBox="0 0 300 300" className="h-auto w-full" role="img" aria-label="Two-task data with the model's current decision boundary">
      <line x1={0} y1={C} x2={300} y2={C} stroke="var(--color-linedark)" strokeWidth={1} />
      <line x1={C} y1={0} x2={C} y2={300} stroke="var(--color-linedark)" strokeWidth={1} />
      {A.map((p, i) => (
        <circle
          key={`a${i}`}
          cx={px(p.x)}
          cy={py(p.y)}
          r={3.4}
          fill={p.label > 0 ? 'var(--color-sky)' : 'none'}
          stroke="var(--color-sky)"
          strokeWidth={1.2}
          opacity={0.85}
        />
      ))}
      {B.map((p, i) => (
        <circle
          key={`b${i}`}
          cx={px(p.x)}
          cy={py(p.y)}
          r={3.4}
          fill={p.label > 0 ? 'var(--color-clay)' : 'none'}
          stroke="var(--color-clay)"
          strokeWidth={1.2}
          opacity={0.85}
        />
      ))}
      {boundary && (
        <line
          x1={boundary.x1}
          y1={boundary.y1}
          x2={boundary.x2}
          y2={boundary.y2}
          stroke="var(--color-paper)"
          strokeWidth={2}
        />
      )}
      {plus && (
        <text x={plus.x} y={plus.y} fontSize={12} fill="var(--color-stone)" style={monoStyle} textAnchor="middle">
          +
        </text>
      )}
      <text x={8} y={16} fontSize={10} fill="var(--color-stone)" style={monoStyle}>
        weight space · decision boundary
      </text>
    </svg>
  )
}

/** Right panel: accuracy-vs-step curves, drawn up to the scrub position. */
function CurvePanel({ hist, idx }: { hist: Snap[]; idx: number }) {
  const last = hist.length - 1
  const X0 = 40
  const X1 = 452
  const Y0 = 18
  const Y1 = 272
  const sx = (i: number) => X0 + (i / last) * (X1 - X0)
  const sy = (a: number) => Y1 - a * (Y1 - Y0)

  const upto = hist.slice(0, idx + 1)
  const ptsA = upto.map((h, i) => `${sx(i).toFixed(1)},${sy(h.accA).toFixed(1)}`).join(' ')
  const ptsB = upto.map((h, i) => `${sx(i).toFixed(1)},${sy(h.accB).toFixed(1)}`).join(' ')

  return (
    <svg viewBox="0 0 460 300" className="h-auto w-full" role="img" aria-label="Task A and task B accuracy over sequential training">
      {[0, 0.5, 1].map((a) => (
        <g key={a}>
          <line x1={X0} y1={sy(a)} x2={X1} y2={sy(a)} stroke="var(--color-linedark)" strokeWidth={1} />
          <text x={X0 - 6} y={sy(a) + 3.5} fontSize={10} fill="var(--color-stone)" style={monoStyle} textAnchor="end">
            {Math.round(a * 100)}%
          </text>
        </g>
      ))}
      <line
        x1={sx(STEPS_A)}
        y1={Y0 - 4}
        x2={sx(STEPS_A)}
        y2={Y1}
        stroke="var(--color-stone)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text x={sx(STEPS_A)} y={Y0 - 8} fontSize={10} fill="var(--color-stone)" style={monoStyle} textAnchor="middle">
        task switch
      </text>
      <text x={X1} y={Y1 + 16} fontSize={10} fill="var(--color-stone)" style={monoStyle} textAnchor="end">
        steps →
      </text>
      {idx > 0 && <polyline points={ptsA} fill="none" stroke="var(--color-sky)" strokeWidth={2.2} />}
      {idx > 0 && <polyline points={ptsB} fill="none" stroke="var(--color-clay)" strokeWidth={2.2} />}
      <line x1={sx(idx)} y1={Y0} x2={sx(idx)} y2={Y1} stroke="var(--color-stone)" strokeWidth={1} opacity={0.5} />
      <circle cx={sx(idx)} cy={sy(hist[idx].accA)} r={3.5} fill="var(--color-sky)" />
      <circle cx={sx(idx)} cy={sy(hist[idx].accB)} r={3.5} fill="var(--color-clay)" />
    </svg>
  )
}

export function ContinualLearningPlayground() {
  const reduced = useReducedMotion()
  const { A, B, runs } = useMemo(() => {
    const rng = mulberry32(SEED)
    const a = makeTask(rng, 1.4, 1.4)
    const b = makeTask(rng, 0.9, -1.5)
    const r: Record<Strategy, Snap[]> = {
      naive: simulate('naive', a, b),
      ewc: simulate('ewc', a, b),
      replay: simulate('replay', a, b),
      frozen: simulate('frozen', a, b),
    }
    return { A: a, B: b, runs: r }
  }, [])

  const [strategy, setStrategy] = useState<Strategy>('naive')
  const [sweep, setSweep] = useState(0)
  const hist = runs[strategy]
  const last = hist.length - 1
  const [idx, setIdx] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (reduced) {
      setIdx(last)
      return
    }
    const t0 = performance.now()
    const dur = 2400
    // read the clock directly — some embedded browsers invoke rAF callbacks
    // without the timestamp argument, which would make p NaN
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur)
      setIdx(Math.round(p * last))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    setIdx(0)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [strategy, reduced, last, sweep])

  const safeIdx = Number.isFinite(idx) ? Math.max(0, Math.min(idx, last)) : last
  const cur = hist[safeIdx]
  const meta = STRATEGIES.find((s) => s.key === strategy) ?? STRATEGIES[0]
  const pct = (a: number) => `${Math.round(a * 100)}%`
  const phase =
    safeIdx < STEPS_A ? 'training on task A' : strategy === 'frozen' ? 'weights frozen' : 'training on task B'

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {STRATEGIES.map((s) => (
          <Pill key={s.key} pressed={strategy === s.key} onClick={() => setStrategy(s.key)}>
            {s.label}
          </Pill>
        ))}
      </div>
      <p className="font-mono mt-3 max-w-[70ch] text-[12.5px] text-(--note)">{meta.desc}</p>

      <div className="mt-6 grid gap-5 md:grid-cols-[2fr_3fr]">
        <Card className="p-4">
          <DataPanel A={A} B={B} cur={cur} />
          <div className="font-mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-(--note)">
            <span className="flex items-center gap-1.5">
              <span className="bg-sky inline-block h-[8px] w-[8px] rounded-full" /> task A
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-clay inline-block h-[8px] w-[8px] rounded-full" /> task B
            </span>
            <span>filled = label&nbsp;+ · hollow = label&nbsp;−</span>
          </div>
        </Card>
        <Card className="p-4">
          <CurvePanel hist={hist} idx={safeIdx} />
          <div className="font-mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-(--note)">
            <span className="flex items-center gap-1.5">
              <span className="bg-sky inline-block h-[8px] w-[8px] rounded-full" /> task A accuracy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-clay inline-block h-[8px] w-[8px] rounded-full" /> task B accuracy
            </span>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <div className="font-display text-sky text-[clamp(1.5rem,2.6vw,2.1rem)] leading-none font-bold">
            {pct(cur.accA)}
          </div>
          <div className="font-display text-stone mt-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
            task A retained
          </div>
        </div>
        <div>
          <div className="font-display text-clay text-[clamp(1.5rem,2.6vw,2.1rem)] leading-none font-bold">
            {pct(cur.accB)}
          </div>
          <div className="font-display text-stone mt-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
            task B acquired
          </div>
        </div>
        <div className="font-mono text-[12px] text-(--note)">
          step {safeIdx} / {last} · {phase}
        </div>
        {!reduced && (
          <Btn onClick={() => setSweep((s) => s + 1)} className="ml-auto">
            Run the sweep again
          </Btn>
        )}
      </div>

      <label className="mt-5 block">
        <span className="sr-only">Scrub through training steps</span>
        <input
          type="range"
          min={0}
          max={last}
          value={safeIdx}
          onChange={(e) => {
            cancelAnimationFrame(rafRef.current)
            setIdx(Number(e.currentTarget.value))
          }}
          className="w-full cursor-pointer"
          aria-label="Training step"
        />
      </label>
    </div>
  )
}
