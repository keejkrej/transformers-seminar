import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Btn } from '../../components/Buttons'

/** Tokens each lane must generate. */
const L = 48
const PITCH = 20
const CELL_W = 17
const CELL_H = 24
const AR_Y = 20
const TT_Y = 116
const VIEW_W = L * PITCH
const VIEW_H = 176

/** Deterministic per-token jitter in [0,1) — every run is reproducible. */
function jitter(i: number): number {
  const x = Math.sin((i + 1) * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface CellPlan {
  /** race tick at which this token commits in the TwoTower lane */
  commitTick: number
  /** denoise step within its block at which it crossed the threshold */
  step: number
  block: number
}

interface Schedule {
  cells: CellPlan[]
  blockStart: number[]
  blockSteps: number[]
  ttTotal: number
  nBlocks: number
}

/**
 * Toy denoising schedule. Cell j of a block crosses the confidence
 * threshold γ after a step count that grows with in-block position plus
 * jitter — reproducing the paper's "autoregressive upper-left triangular"
 * commit pattern. One tick = one forward pass in either lane.
 */
function buildSchedule(S: number, gamma: number): Schedule {
  const nBlocks = Math.ceil(L / S)
  const cells: CellPlan[] = []
  const blockStart: number[] = []
  const blockSteps: number[] = []
  let start = 0
  for (let b = 0; b < nBlocks; b++) {
    const lo = b * S
    const hi = Math.min(L, lo + S)
    const need: number[] = []
    let maxStep = 1
    for (let g = lo; g < hi; g++) {
      const j = g - lo
      const raw = Math.ceil((gamma - 0.35 + j * 0.07 + jitter(g) * 0.25) / 0.25)
      const n = Math.min(S, Math.max(1, raw))
      need.push(n)
      if (n > maxStep) maxStep = n
    }
    blockStart.push(start)
    for (let g = lo; g < hi; g++) {
      cells.push({ commitTick: start + need[g - lo], step: need[g - lo], block: b })
    }
    start += maxStep
    blockSteps.push(maxStep)
  }
  return { cells, blockStart, blockSteps, ttTotal: start, nBlocks }
}

function Counter({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-[88px]">
      <div className={`font-display text-[20px] leading-none font-bold ${tone}`}>{value}</div>
      <div className="font-display text-stone mt-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
        {label}
      </div>
    </div>
  )
}

function Swatch({ color, dashed = false }: { color?: string; dashed?: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-[3px] ${dashed ? 'border border-dashed border-(--card-line)' : ''}`}
      style={color ? { background: color } : undefined}
    />
  )
}

/**
 * "Decode race": AR baseline (one token per forward pass) vs TwoTower
 * block diffusion (S tokens denoised in parallel, committed once each
 * position's confidence crosses γ). Reduced-motion users get manual
 * stepping instead of an autoplaying interval.
 */
export function TwoTowerDecodeRace() {
  const reduced = useReducedMotion()
  const [s, setS] = useState(16)
  const [gamma, setGamma] = useState(0.8)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)

  const sched = useMemo(() => buildSchedule(s, gamma), [s, gamma])
  const maxTick = Math.max(L, sched.ttTotal)

  useEffect(() => {
    if (!playing || reduced) return
    const id = window.setInterval(() => setTick((t) => Math.min(t + 1, maxTick)), 170)
    return () => window.clearInterval(id)
  }, [playing, reduced, maxTick])

  useEffect(() => {
    if (playing && tick >= maxTick) setPlaying(false)
  }, [playing, tick, maxTick])

  const arDone = Math.min(tick, L)
  const ttDone = sched.cells.reduce((n, c) => (c.commitTick <= tick ? n + 1 : n), 0)
  const activeBlock = sched.blockStart.findIndex(
    (st, b) => st <= tick && tick < st + sched.blockSteps[b],
  )

  let ttCached = 0
  for (let b = 0; b < sched.nBlocks; b++) {
    if (sched.blockStart[b] + sched.blockSteps[b] <= tick) {
      ttCached += Math.min(L, (b + 1) * s) - b * s
    }
  }

  const resetTo = (fn?: () => void) => {
    if (fn) fn()
    setTick(0)
    setPlaying(false)
  }

  return (
    <div className="rounded-[10px] border border-(--card-line) bg-(--card-bg) p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        {reduced ? (
          <>
            <Btn primary onClick={() => setTick((t) => Math.min(t + 1, maxTick))}>
              Step +1
            </Btn>
            <Btn onClick={() => setTick(maxTick)}>Run to end</Btn>
          </>
        ) : (
          <Btn
            primary
            onClick={() => {
              if (tick >= maxTick) setTick(0)
              setPlaying((p) => !p)
            }}
          >
            {playing
              ? 'Pause'
              : tick === 0
                ? 'Start the race'
                : tick >= maxTick
                  ? 'Race again'
                  : 'Resume'}
          </Btn>
        )}
        <Btn onClick={() => resetTo()}>Reset</Btn>
        <label className="font-mono flex items-center gap-2.5 text-[12px] text-(--soft)">
          S&nbsp;=&nbsp;{s}
          <input
            type="range"
            min={8}
            max={32}
            step={8}
            value={s}
            aria-label="block size S"
            className="w-28"
            onChange={(e) => resetTo(() => setS(Number(e.target.value)))}
          />
        </label>
        <label className="font-mono flex items-center gap-2.5 text-[12px] text-(--soft)">
          γ&nbsp;=&nbsp;{gamma.toFixed(2)}
          <input
            type="range"
            min={0.5}
            max={0.95}
            step={0.05}
            value={gamma}
            aria-label="confidence threshold gamma"
            className="w-28"
            onChange={(e) => resetTo(() => setGamma(Number(e.target.value)))}
          />
        </label>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label="Decode race: an autoregressive lane committing one token per forward pass versus a TwoTower lane committing whole blocks after a few parallel denoising steps"
      >
        {/* ——— AR lane ——— */}
        <text x={0} y={12} fontSize={11} fontFamily="var(--font-mono)" fill="var(--note)">
          AR baseline — 1 token per forward pass
        </text>
        <text
          x={VIEW_W}
          y={12}
          textAnchor="end"
          fontSize={11}
          fontFamily="var(--font-mono)"
          fill="var(--soft)"
        >
          {arDone}/{L} tok{arDone === L ? ` · done in ${L} passes` : ''}
        </text>
        {Array.from({ length: L }, (_, g) => (
          <rect
            key={g}
            x={g * PITCH + 1}
            y={AR_Y}
            width={CELL_W}
            height={CELL_H}
            rx={3}
            fill={g < arDone ? 'var(--color-sky)' : 'var(--card-bg)'}
            stroke={g < arDone ? 'none' : 'var(--card-line)'}
          />
        ))}
        <rect
          x={0}
          y={AR_Y + CELL_H + 9}
          width={VIEW_W}
          height={5}
          rx={2.5}
          fill="none"
          stroke="var(--card-line)"
        />
        <rect
          x={0}
          y={AR_Y + CELL_H + 9}
          width={(arDone / L) * VIEW_W}
          height={5}
          rx={2.5}
          fill="var(--color-olive)"
        />
        <text
          x={0}
          y={AR_Y + CELL_H + 28}
          fontSize={9.5}
          fontFamily="var(--font-mono)"
          fill="var(--note)"
        >
          KV cache — grows on every single token
        </text>

        {/* ——— TwoTower lane ——— */}
        <text x={0} y={TT_Y - 12} fontSize={11} fontFamily="var(--font-mono)" fill="var(--note)">
          TwoTower — S-token blocks, parallel denoise, commit at γ
        </text>
        <text
          x={VIEW_W}
          y={TT_Y - 12}
          textAnchor="end"
          fontSize={11}
          fontFamily="var(--font-mono)"
          fill="var(--soft)"
        >
          {ttDone}/{L} tok{tick >= sched.ttTotal ? ` · done in ${sched.ttTotal} passes` : ''}
        </text>
        {Array.from({ length: sched.nBlocks }, (_, b) => {
          const lo = b * s
          const hi = Math.min(L, lo + s)
          const active = b === activeBlock
          return (
            <rect
              key={b}
              x={lo * PITCH + 0.5}
              y={TT_Y - 3.5}
              width={(hi - lo) * PITCH - 2}
              height={CELL_H + 7}
              rx={5}
              fill="none"
              stroke={active ? 'var(--color-clay)' : 'var(--card-line)'}
              strokeOpacity={active ? 0.9 : 0.55}
              strokeDasharray={active ? undefined : '2 3'}
            />
          )
        })}
        {sched.cells.map((c, g) => {
          const committed = c.commitTick <= tick
          const blockMax = sched.blockSteps[c.block]
          const op = committed ? 1 - 0.6 * ((c.step - 1) / Math.max(1, blockMax - 1)) : 1
          const inFlight = c.block === activeBlock && !committed
          const conf = inFlight
            ? Math.min(0.92, Math.max(0, (tick - sched.blockStart[c.block]) / c.step))
            : 0
          return (
            <g key={g}>
              <rect
                x={g * PITCH + 1}
                y={TT_Y}
                width={CELL_W}
                height={CELL_H}
                rx={3}
                fill={committed ? 'var(--color-clay)' : 'var(--card-bg)'}
                fillOpacity={committed ? op : 1}
                stroke={committed ? 'none' : 'var(--card-line)'}
              />
              {conf > 0 && (
                <rect
                  x={g * PITCH + 1}
                  y={TT_Y + CELL_H * (1 - conf)}
                  width={CELL_W}
                  height={CELL_H * conf}
                  rx={2}
                  fill="var(--color-clay)"
                  fillOpacity={0.3}
                />
              )}
            </g>
          )
        })}
        <rect
          x={0}
          y={TT_Y + CELL_H + 12}
          width={VIEW_W}
          height={5}
          rx={2.5}
          fill="none"
          stroke="var(--card-line)"
        />
        <rect
          x={0}
          y={TT_Y + CELL_H + 12}
          width={(ttCached / L) * VIEW_W}
          height={5}
          rx={2.5}
          fill="var(--color-olive)"
        />
        <text
          x={0}
          y={TT_Y + CELL_H + 31}
          fontSize={9.5}
          fontFamily="var(--font-mono)"
          fill="var(--note)"
        >
          frozen context-tower KV + Mamba cache — grows only when a block commits
        </text>
      </svg>

      <div className="font-mono mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-(--note)">
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--color-sky)" /> AR token
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--color-clay)" /> TwoTower token (darker = earlier commit)
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch dashed /> block being denoised
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--color-olive)" /> context-tower cache
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-9 gap-y-4">
        <Counter label="forward passes" value={String(tick)} />
        <Counter label="AR tokens" value={`${arDone}/${L}`} tone="text-sky" />
        <Counter label="TwoTower tokens" value={`${ttDone}/${L}`} tone="text-clay" />
        <Counter label="avg passes / block" value={(sched.ttTotal / sched.nBlocks).toFixed(1)} />
        <Counter label="toy speedup" value={`${(L / sched.ttTotal).toFixed(2)}×`} tone="text-olive" />
      </div>
    </div>
  )
}
