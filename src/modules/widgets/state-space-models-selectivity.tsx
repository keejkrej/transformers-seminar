import { useMemo, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { Btn, Pill } from '../../components/Buttons'
import { Card, Tag } from '../../components/Card'
import { Math as TeX } from '../../components/Math'

/**
 * Selectivity sandbox — draws the 1-semiseparable decay mask L ∘ (CBᵀ) of a
 * scalar-gated selective SSM next to a causal attention mask. Cell (t, j) is
 * (1 − a_j) · a_{j+1} ⋯ a_t with a_k = exp(−Δ_k): how much of token j is
 * still legible in the state at step t. Clicking Δ gates flips per-token
 * selectivity (Mamba); the LTI mode uses one uniform Δ (S4).
 */

const T = 20
const CELL = 22
const PAD = 34
const GATE_Y = 12
const GRID_Y = 48
const VW = PAD + T * CELL + 8
const VH = GRID_Y + T * CELL + 40

const OPEN_DELTA = 2.2
const CLOSED_DELTA = 0.06
const DEFAULT_GATES = Array.from({ length: T }, (_, i) => i === 0 || i === 8 || i === 15)

type Mode = 'selective' | 'lti'

/** perceptual boost so faint-but-real memory stays visible */
function opacityFor(v: number): number {
  return Math.min(1, Math.pow(v, 0.6) * 1.05)
}

function axisTicks(): ReactNode[] {
  const els: ReactNode[] = [0, 5, 10, 15, 19].map((j) => (
    <text
      key={`tick-${j}`}
      x={PAD + j * CELL + (CELL - 2) / 2}
      y={GRID_Y + T * CELL + 15}
      textAnchor="middle"
      fontSize={10}
      fill="var(--color-stone)"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {j}
    </text>
  ))
  els.push(
    <text
      key="x-axis"
      x={PAD + (T * CELL) / 2}
      y={GRID_Y + T * CELL + 32}
      textAnchor="middle"
      fontSize={10.5}
      fill="var(--color-stone)"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      past token j →
    </text>,
  )
  els.push(
    <text
      key="y-axis"
      x={12}
      y={GRID_Y + (T * CELL) / 2}
      transform={`rotate(-90 12 ${GRID_Y + (T * CELL) / 2})`}
      textAnchor="middle"
      fontSize={10.5}
      fill="var(--color-stone)"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      ← step t
    </text>,
  )
  return els
}

export function SelectivitySandbox() {
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<Mode>('selective')
  const [gates, setGates] = useState<boolean[]>(DEFAULT_GATES)
  const [ltiLevel, setLtiLevel] = useState(35)

  // slider maps log-scale from Δ ≈ 0.03 (a ≈ 0.97, long memory) to Δ = 1.8 (a ≈ 0.17)
  const ltiDelta = 0.03 * Math.pow(60, ltiLevel / 100)

  const deltas = useMemo<number[]>(
    () =>
      mode === 'lti'
        ? Array.from({ length: T }, () => ltiDelta)
        : gates.map((g) => (g ? OPEN_DELTA : CLOSED_DELTA)),
    [mode, ltiDelta, gates],
  )

  const mask = useMemo<number[][]>(() => {
    const a = deltas.map((d) => Math.exp(-d))
    const rows: number[][] = []
    for (let t = 0; t < T; t++) {
      const row: number[] = []
      for (let j = 0; j <= t; j++) {
        let v = 1 - a[j] // write strength of token j (≈ Δ_j B)
        for (let k = j + 1; k <= t; k++) v *= a[k] // survival through later steps
        row.push(v)
      }
      rows.push(row)
    }
    return rows
  }, [deltas])

  const remembered = mask[T - 1].filter((v) => v >= 0.05).length
  const fade = reduced ? undefined : { transition: 'fill-opacity 260ms ease' }

  function toggleGate(j: number) {
    setGates((prev) => prev.map((g, k) => (k === j ? !g : g)))
    if (mode !== 'selective') setMode('selective')
  }

  function setAll(open: boolean) {
    setMode('selective')
    setGates(Array.from({ length: T }, () => open))
  }

  function reset() {
    setMode('selective')
    setGates(DEFAULT_GATES)
    setLtiLevel(35)
  }

  const ssmCells: ReactNode[] = []
  const attnCells: ReactNode[] = []
  for (let t = 0; t < T; t++) {
    for (let j = 0; j <= t; j++) {
      const x = PAD + j * CELL
      const y = GRID_Y + t * CELL
      ssmCells.push(
        <rect
          key={`b${t}-${j}`}
          x={x}
          y={y}
          width={CELL - 2}
          height={CELL - 2}
          rx={2}
          fill="var(--card-line)"
          fillOpacity={0.28}
        />,
      )
      const op = opacityFor(mask[t][j])
      if (op > 0.02) {
        ssmCells.push(
          <rect
            key={`v${t}-${j}`}
            x={x}
            y={y}
            width={CELL - 2}
            height={CELL - 2}
            rx={2}
            fill="var(--color-olive)"
            fillOpacity={op}
            style={fade}
          />,
        )
      }
      attnCells.push(
        <rect
          key={`a${t}-${j}`}
          x={x}
          y={y}
          width={CELL - 2}
          height={CELL - 2}
          rx={2}
          fill="var(--color-sky)"
          fillOpacity={0.5}
        />,
      )
    }
  }

  const gateRects = Array.from({ length: T }, (_, j) => {
    const open = mode === 'selective' && gates[j]
    const strength = Math.min(1, deltas[j] / OPEN_DELTA)
    const label =
      mode === 'lti'
        ? `gate ${j}: uniform Δ (time-invariant) — activate to switch to selective mode`
        : `gate ${j}: ${gates[j] ? 'open — flush history, write this token' : 'closed — hold history'}`
    return (
      <rect
        key={`g${j}`}
        x={PAD + j * CELL}
        y={GATE_Y}
        width={CELL - 2}
        height={20}
        rx={4}
        fill="var(--color-clay)"
        fillOpacity={0.1 + 0.9 * strength}
        stroke={open ? 'var(--color-clay)' : 'var(--card-line)'}
        strokeWidth={1}
        role="button"
        tabIndex={0}
        aria-pressed={open}
        aria-label={label}
        style={{ cursor: 'pointer', ...(fade ?? {}) }}
        onClick={() => toggleGate(j)}
        onKeyDown={(e: KeyboardEvent<SVGRectElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleGate(j)
          }
        }}
      />
    )
  })

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Pill
          pressed={mode === 'selective'}
          swatch="var(--color-clay)"
          onClick={() => setMode('selective')}
        >
          Selective · Mamba
        </Pill>
        <Pill pressed={mode === 'lti'} swatch="var(--color-olive)" onClick={() => setMode('lti')}>
          Time-invariant · S4
        </Pill>
        {mode === 'lti' && (
          <label className="font-mono flex items-center gap-2.5 text-[12px] text-(--note)">
            Δ
            <input
              type="range"
              min={0}
              max={100}
              value={ltiLevel}
              onChange={(e) => setLtiLevel(Number(e.target.value))}
              aria-label="uniform timescale Δ"
              className="w-36"
            />
            <span className="inline-block w-10">{ltiDelta.toFixed(2)}</span>
          </label>
        )}
        <span className="grow" />
        <Btn onClick={() => setAll(false)}>All hold</Btn>
        <Btn onClick={() => setAll(true)}>All flush</Btn>
        <Btn onClick={reset}>Reset</Btn>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <Tag accent="olive">Selective SSM — decay mask L</Tag>
          <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full">
            <text
              x={PAD - 6}
              y={GATE_Y + 14}
              textAnchor="end"
              fontSize={10.5}
              fill="var(--color-stone)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Δ
            </text>
            {gateRects}
            {ssmCells}
            {axisTicks()}
          </svg>
          <div className="font-mono mt-3 text-[12px] text-(--note)">
            state at t=19 keeps ≥5% of{' '}
            <span className="text-olive font-semibold">{remembered} / 20</span> tokens — in O(N·d)
            memory
          </div>
        </Card>

        <Card>
          <Tag accent="sky">Causal attention — lossless cache</Tag>
          <svg
            role="img"
            aria-label="Causal attention mask: every past token fully retained at every step"
            viewBox={`0 0 ${VW} ${VH}`}
            className="h-auto w-full"
          >
            <text
              x={PAD + (T * CELL) / 2}
              y={GATE_Y + 14}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--color-stone)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              no gates — every token cached verbatim
            </text>
            {attnCells}
            {axisTicks()}
          </svg>
          <div className="font-mono mt-3 text-[12px] text-(--note)">
            cache at t=19 keeps <span className="text-sky font-semibold">20 / 20</span> tokens —
            exact, but memory grows with t
          </div>
        </Card>
      </div>

      <div className="font-mono mt-4 text-[12px] text-(--note)">
        mask value{' '}
        <TeX>{String.raw`(1-a_j)\,\textstyle\prod_{k=j+1}^{t} a_k,\;\; a_k = e^{-\Delta_k}`}</TeX>{' '}
        — row t reads “what step t still knows about token j.” Click the Δ strip to open (clay) or
        close a gate.
      </div>
    </div>
  )
}
