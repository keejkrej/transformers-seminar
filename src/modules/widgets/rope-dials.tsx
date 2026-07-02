import { useState } from 'react'
import { Btn } from '../../components/Buttons'

/**
 * RoPE rotation explorer. Eight frequency pairs of a d=16 rotary embedding,
 * drawn as dials: the clay hand is the query at position m, the sky hand the
 * key at position n, each rotated by (position × θⱼ) with the geometric
 * spectrum θⱼ = 10000^(−j/8). Below, the attention logit for fixed content
 * vectors — score(Δ) = (1/8) Σⱼ cos(Δ·θⱼ) — as a function of the gap, with the
 * current gap marked. Shifting both positions together spins every dial but
 * leaves the score untouched: the demonstration that RoPE attention depends
 * only on relative offset.
 */

const N_DIALS = 8
const MAX_POS = 48
const THETAS = Array.from({ length: N_DIALS }, (_, j) => Math.pow(10000, -j / N_DIALS))

/** Mean cosine across frequency pairs — the logit for unit content vectors. */
function score(gap: number): number {
  let s = 0
  for (const t of THETAS) s += Math.cos(gap * t)
  return s / N_DIALS
}

const DIAL_R = 26
const DIAL_BOX = 68

function Dial({ j, m, n }: { j: number; m: number; n: number }) {
  const cx = DIAL_BOX / 2
  const cy = DIAL_BOX / 2
  const hand = (pos: number) => {
    const a = pos * THETAS[j]
    return { x: cx + DIAL_R * Math.cos(-a), y: cy + DIAL_R * Math.sin(-a) }
  }
  const q = hand(m)
  const k = hand(n)
  return (
    <svg viewBox={`0 0 ${DIAL_BOX} ${DIAL_BOX + 16}`} className="w-full">
      <circle cx={cx} cy={cy} r={DIAL_R} fill="none" stroke="var(--color-stone)" strokeWidth={1} opacity={0.6} />
      <line x1={cx} y1={cy} x2={q.x} y2={q.y} stroke="var(--color-clay)" strokeWidth={2.2} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={k.x} y2={k.y} stroke="var(--color-sky)" strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={2.2} fill="var(--color-stone)" />
      <text
        x={cx}
        y={DIAL_BOX + 11}
        textAnchor="middle"
        fontSize={9.5}
        style={{ fontFamily: 'var(--font-mono)' }}
        fill="var(--color-note, var(--color-stone))"
      >
        θ{j === 0 ? '₀' : String.fromCharCode(0x2080 + j)}
      </text>
    </svg>
  )
}

/** Score-vs-gap curve, current gap marked. */
function Curve({ gap }: { gap: number }) {
  const W = 640
  const H = 150
  const PAD = 34
  const x = (g: number) => PAD + ((W - 2 * PAD) * g) / MAX_POS
  const y = (s: number) => H - 24 - ((H - 44) * (s + 0.4)) / 1.4
  const pts = Array.from({ length: MAX_POS * 2 + 1 }, (_, i) => {
    const g = i / 2
    return `${x(g)},${y(score(g))}`
  }).join(' ')
  const g = Math.abs(gap)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full" role="img" aria-label="Attention score as a function of the position gap: high at zero, decaying with oscillation as the gap grows.">
      <line x1={PAD} y1={y(0)} x2={W - PAD} y2={y(0)} stroke="var(--color-stone)" strokeWidth={1} opacity={0.5} strokeDasharray="3 4" />
      <polyline points={pts} fill="none" stroke="var(--color-olive)" strokeWidth={2} />
      <circle cx={x(g)} cy={y(score(g))} r={5} fill="var(--color-clay)" />
      <text x={PAD} y={14} fontSize={11} style={{ fontFamily: 'var(--font-mono)' }} fill="var(--color-note, var(--color-stone))">
        score(Δ) — fixed content, varying gap
      </text>
      <text x={W - PAD} y={H - 6} textAnchor="end" fontSize={11} style={{ fontFamily: 'var(--font-mono)' }} fill="var(--color-note, var(--color-stone))">
        Δ = {g}
      </text>
    </svg>
  )
}

export default function RopeDials() {
  const [m, setM] = useState(14)
  const [n, setN] = useState(6)
  const gap = m - n

  const shift = (by: number) => {
    const d = Math.max(-Math.min(m, n), Math.min(by, MAX_POS - Math.max(m, n)))
    setM(m + d)
    setN(n + d)
  }

  return (
    <div className="rounded-xl border border-(--card-line) bg-(--card-bg) px-7 py-[30px]">
      <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
        <label className="block">
          <span className="font-display text-[12px] font-semibold tracking-[0.1em] uppercase text-(--note)">
            query position m = <strong className="text-clay">{m}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={MAX_POS}
            value={m}
            onChange={(e) => setM(Number(e.target.value))}
            className="mt-1 w-full"
            aria-label="Query position m"
          />
        </label>
        <label className="block">
          <span className="font-display text-[12px] font-semibold tracking-[0.1em] uppercase text-(--note)">
            key position n = <strong className="text-sky">{n}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={MAX_POS}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="mt-1 w-full"
            aria-label="Key position n"
          />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {THETAS.map((_, j) => (
          <Dial key={j} j={j} m={m} n={n} />
        ))}
      </div>
      <p className="mt-1 text-[13px] text-(--note)">
        Eight frequency pairs of a d = 16 rotary embedding — fast dials on the left, nearly frozen
        on the right. <span className="text-clay">Clay hand</span>: query rotated to position m.{' '}
        <span className="text-sky">Sky hand</span>: key at position n. The score depends only on
        the angles <em>between</em> hands.
      </p>

      <Curve gap={gap} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Btn onClick={() => shift(8)}>Shift both +8</Btn>
        <Btn onClick={() => shift(-8)}>Shift both −8</Btn>
        <span className="font-mono text-[13.5px] text-(--soft)">
          gap Δ = {gap} · score = {score(Math.abs(gap)).toFixed(3)}
        </span>
      </div>
      <p className="mt-3 max-w-[64ch] text-[13px] text-(--note)">
        Shift both positions together: every dial turns, yet the score does not move — the
        rotations cancel in the dot product. Only changing the gap changes the score. That is the
        relative-position property, enforced by geometry rather than learned.
      </p>
    </div>
  )
}
