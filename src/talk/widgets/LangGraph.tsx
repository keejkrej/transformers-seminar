import { useMemo, useState } from 'react'
import { Reveal } from '../../components/Reveal'
import { Body } from '../../components/Type'

const ACC = ['var(--color-clay)', 'var(--color-sky)', 'var(--color-olive)'] as const

interface Edge {
  x1: number
  y1: number
  x2: number
  y2: number
  o: number
}

/** Complete graph over n language nodes; all edges when small, 1100 sampled when large. */
function buildGraph(n: number) {
  const cx = 190
  const cy = 190
  const R = 158
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) })
  }
  const total = (n * (n - 1)) / 2
  const MAX = 1100
  const edges: Edge[] = []
  if (total <= MAX) {
    const o = Math.max(0.05, 0.5 - n * 0.008)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        edges.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y, o })
      }
    }
  } else {
    for (let k = 0; k < MAX; k++) {
      const i = Math.floor(Math.random() * n)
      let j = Math.floor(Math.random() * n)
      if (i === j) j = (j + 1) % n
      edges.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y, o: 0.05 })
    }
  }
  return { pts, edges }
}

/** Part 03 lab: slider n = 2..103, circle of language nodes, live n(n−1) pair count. */
export function LangGraph() {
  const [n, setN] = useState(24)
  const { pts, edges } = useMemo(() => buildGraph(n), [n])

  return (
    <div className="mt-12 grid grid-cols-[380px_1fr] items-center gap-11 max-[860px]:grid-cols-1">
      <svg
        viewBox="0 0 380 380"
        role="img"
        aria-label="Complete graph of language pairs"
        className="block h-auto w-full"
      >
        {edges.map((e, k) => (
          <line
            key={k}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="var(--color-fog)"
            strokeOpacity={e.o}
            strokeWidth={1}
          />
        ))}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={ACC[i % 3]} />
        ))}
      </svg>

      <Reveal>
        <label htmlFor="langRange" className="font-mono text-[13px]">
          languages n = <strong>{n}</strong>
        </label>
        <input
          id="langRange"
          type="range"
          min={2}
          max={103}
          value={n}
          aria-label="Number of languages"
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full"
        />
        <div className="font-display text-clay text-[clamp(2.4rem,5vw,4rem)] leading-none font-bold tracking-[-0.02em]">
          {(n * (n - 1)).toLocaleString('en-US')}
        </div>
        <p className="font-display text-stone mt-1.5 text-[12px] font-semibold tracking-[0.14em] uppercase">
          directed translation pairs · n(n−1)
        </p>
        <Body>
          Pairs grow <strong>quadratically</strong>. At 103 languages that's{' '}
          <strong>10,506</strong> directions — you cannot train, store, or serve one bespoke model
          per pair. You need shared, general language representations. And a model cheap enough to
          retrain constantly.
        </Body>
      </Reveal>
    </div>
  )
}
