import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Btn, Pill } from '../../components/Buttons'
import { Card, Tag } from '../../components/Card'
import { Note } from '../../components/Type'

/**
 * Fixed state vs growing cache — an interactive miniature of the MQAR
 * recall diagnostic. Streams key–value pairs into (a) an exact KV cache and
 * (b) a d×d linear-attention state updated by the selected recurrence:
 *
 *   additive : S ← S + v kᵀ                        (Katharopoulos 2020)
 *   decay    : S ← αS + v kᵀ                       (RetNet / Mamba-2)
 *   delta    : S ← S(I − βk kᵀ) + βv kᵀ            (DeltaNet)
 *   gated    : S ← αS(I − βk kᵀ) + βv kᵀ           (Gated DeltaNet)
 *
 * Recall quiz: for each stored key k_j, read v̂ = S·k_j and check whether the
 * nearest stored value by cosine is the true v_j.
 */

const D = 8
const MAX_PAIRS = 24
const CELL = 26
const CACHE_ROW = 12

type Rule = 'additive' | 'decay' | 'delta' | 'gated'

const RULES: { id: Rule; label: string; swatch: string }[] = [
  { id: 'additive', label: 'additive · 2020', swatch: 'var(--color-stone)' },
  { id: 'decay', label: '+ decay · RetNet', swatch: 'var(--color-sky)' },
  { id: 'delta', label: 'delta rule · DeltaNet', swatch: 'var(--color-clay)' },
  { id: 'gated', label: 'gated delta · 2025', swatch: 'var(--color-olive)' },
]

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** n random unit vectors in R^D (Box–Muller, then normalize). */
function randomUnitVectors(n: number, rand: () => number): number[][] {
  const out: number[][] = []
  for (let i = 0; i < n; i++) {
    const v: number[] = []
    while (v.length < D) {
      const u1 = Math.max(rand(), 1e-9)
      const u2 = rand()
      const r = Math.sqrt(-2 * Math.log(u1))
      v.push(r * Math.cos(2 * Math.PI * u2))
      if (v.length < D) v.push(r * Math.sin(2 * Math.PI * u2))
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
    out.push(v.map((x) => x / norm))
  }
  return out
}

interface PairRecall {
  /** cosine similarity between S·k_j and the true value v_j */
  cos: number
  /** true value is the nearest stored value to S·k_j */
  correct: boolean
}

interface Snapshot {
  S: number[] // D×D row-major
  perPair: PairRecall[]
}

function simulate(rule: Rule, alpha: number, beta: number, seed: number): Snapshot[] {
  const rand = mulberry32(seed)
  const keys = randomUnitVectors(MAX_PAIRS, rand)
  const vals = randomUnitVectors(MAX_PAIRS, rand)
  const S: number[] = new Array<number>(D * D).fill(0)
  const snaps: Snapshot[] = [{ S: [...S], perPair: [] }]

  for (let t = 0; t < MAX_PAIRS; t++) {
    const k = keys[t]
    const v = vals[t]
    const a = rule === 'decay' || rule === 'gated' ? alpha : 1
    const useDelta = rule === 'delta' || rule === 'gated'

    if (useDelta) {
      // S ← a·( S − β (S k) kᵀ ) + β v kᵀ
      const sk = new Array<number>(D).fill(0)
      for (let i = 0; i < D; i++) {
        let s = 0
        for (let j = 0; j < D; j++) s += S[i * D + j] * k[j]
        sk[i] = s
      }
      for (let i = 0; i < D; i++)
        for (let j = 0; j < D; j++)
          S[i * D + j] = a * (S[i * D + j] - beta * sk[i] * k[j]) + beta * v[i] * k[j]
    } else {
      // S ← a·S + v kᵀ
      for (let i = 0; i < D; i++)
        for (let j = 0; j < D; j++) S[i * D + j] = a * S[i * D + j] + v[i] * k[j]
    }

    // quiz every stored pair against the current state
    const perPair: PairRecall[] = []
    for (let q = 0; q <= t; q++) {
      const vh = new Array<number>(D).fill(0)
      for (let i = 0; i < D; i++) {
        let s = 0
        for (let j = 0; j < D; j++) s += S[i * D + j] * keys[q][j]
        vh[i] = s
      }
      const nh = Math.sqrt(vh.reduce((s, x) => s + x * x, 0)) || 1e-9
      let best = -1
      let bestCos = -Infinity
      let trueCos = 0
      for (let c = 0; c <= t; c++) {
        let dot = 0
        for (let i = 0; i < D; i++) dot += vh[i] * vals[c][i]
        const cos = dot / nh
        if (cos > bestCos) {
          bestCos = cos
          best = c
        }
        if (c === q) trueCos = cos
      }
      perPair.push({ cos: trueCos, correct: best === q })
    }
    snaps.push({ S: [...S], perPair })
  }
  return snaps
}

export function LinearAttentionMemory() {
  const reduced = useReducedMotion()
  const [rule, setRule] = useState<Rule>('additive')
  const [alpha, setAlpha] = useState(0.92)
  const [beta, setBeta] = useState(0.85)
  const [seed, setSeed] = useState(7)
  const [t, setT] = useState(12)
  const [playing, setPlaying] = useState(false)

  const snaps = useMemo(() => simulate(rule, alpha, beta, seed), [rule, alpha, beta, seed])
  const snap = snaps[t]

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setT((p) => Math.min(p + 1, MAX_PAIRS)), 450)
    return () => window.clearInterval(id)
  }, [playing])

  useEffect(() => {
    if (playing && t >= MAX_PAIRS) setPlaying(false)
  }, [playing, t])

  const togglePlay = () => {
    if (reduced) {
      setT(MAX_PAIRS)
      return
    }
    if (!playing && t >= MAX_PAIRS) setT(0)
    setPlaying((p) => !p)
  }

  const vmax = Math.max(1e-9, ...snap.S.map((x) => Math.abs(x)))
  const nCorrect = snap.perPair.filter((p) => p.correct).length
  const acc = t > 0 ? `${Math.round((nCorrect / t) * 100)}%` : '—'
  const usesAlpha = rule === 'decay' || rule === 'gated'
  const usesBeta = rule === 'delta' || rule === 'gated'
  const cellTransition = reduced ? undefined : { transition: 'fill-opacity 350ms ease' }

  const cacheH = 16 + MAX_PAIRS * CACHE_ROW
  const heatSize = D * CELL
  const barW = MAX_PAIRS * 13

  return (
    <div>
      {/* rule + parameter controls */}
      <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="State update rule">
        {RULES.map((r) => (
          <Pill key={r.id} pressed={rule === r.id} swatch={r.swatch} onClick={() => setRule(r.id)}>
            {r.label}
          </Pill>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
        <label
          className={`font-mono flex items-center gap-3 text-[12.5px] text-(--soft) ${usesAlpha ? '' : 'opacity-35'}`}
        >
          <span className="w-[8ch]">α = {alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.7}
            max={1}
            step={0.01}
            value={alpha}
            disabled={!usesAlpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            aria-label="Decay factor alpha"
          />
        </label>
        <label
          className={`font-mono flex items-center gap-3 text-[12.5px] text-(--soft) ${usesBeta ? '' : 'opacity-35'}`}
        >
          <span className="w-[8ch]">β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={beta}
            disabled={!usesBeta}
            onChange={(e) => setBeta(Number(e.target.value))}
            aria-label="Write strength beta"
          />
        </label>
        <label className="font-mono flex items-center gap-3 text-[12.5px] text-(--soft)">
          <span className="w-[9ch]">
            t = {t}/{MAX_PAIRS}
          </span>
          <input
            type="range"
            min={0}
            max={MAX_PAIRS}
            step={1}
            value={t}
            onChange={(e) => {
              setPlaying(false)
              setT(Number(e.target.value))
            }}
            aria-label="Key-value pairs streamed so far"
          />
        </label>
        <div className="flex gap-2.5">
          <Btn primary onClick={togglePlay}>
            {playing ? 'Pause' : 'Stream pairs'}
          </Btn>
          <Btn
            onClick={() => {
              setPlaying(false)
              setSeed((s) => s + 1)
            }}
          >
            New keys
          </Btn>
        </div>
      </div>

      {/* the two memories */}
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Card>
          <Tag accent="sky">Softmax path · KV cache</Tag>
          <svg
            viewBox={`0 0 190 ${cacheH}`}
            className="mx-auto block w-full max-w-[190px]"
            role="img"
            aria-label={`KV cache holding ${t} key-value pairs, growing with the sequence`}
          >
            <text x={44} y={10} textAnchor="middle" fontSize={9} fill="var(--note)" fontFamily="var(--font-mono)">
              keys
            </text>
            <text x={140} y={10} textAnchor="middle" fontSize={9} fill="var(--note)" fontFamily="var(--font-mono)">
              values
            </text>
            {Array.from({ length: t }, (_, i) => (
              <g key={i}>
                <rect
                  x={2}
                  y={16 + i * CACHE_ROW}
                  width={84}
                  height={CACHE_ROW - 3}
                  rx={2}
                  fill="var(--color-sky)"
                  fillOpacity={0.35 + 0.55 * ((i + 1) / MAX_PAIRS)}
                />
                <rect
                  x={98}
                  y={16 + i * CACHE_ROW}
                  width={84}
                  height={CACHE_ROW - 3}
                  rx={2}
                  fill="var(--color-clay)"
                  fillOpacity={0.35 + 0.55 * ((i + 1) / MAX_PAIRS)}
                />
              </g>
            ))}
            {t === 0 && (
              <text x={95} y={44} textAnchor="middle" fontSize={10} fill="var(--note)" fontFamily="var(--font-mono)">
                empty
              </text>
            )}
          </svg>
          <div className="font-mono mt-4 text-[12.5px] text-(--soft)">
            {t} pairs · {t * 2 * D} floats · O(n), growing
          </div>
          <div className="font-mono mt-1 text-[12.5px] text-(--soft)">
            recall {t > 0 ? '100%' : '—'} — exact lookup, always
          </div>
        </Card>

        <Card>
          <Tag accent="clay">Linear path · state S</Tag>
          <svg
            viewBox={`0 0 ${heatSize} ${heatSize}`}
            className="mx-auto block w-full max-w-[208px]"
            role="img"
            aria-label={`8 by 8 state matrix heat map after ${t} writes`}
          >
            {snap.S.map((val, idx) => {
              const i = Math.floor(idx / D)
              const j = idx % D
              return (
                <g key={idx}>
                  <rect
                    x={j * CELL + 1}
                    y={i * CELL + 1}
                    width={CELL - 2}
                    height={CELL - 2}
                    rx={3}
                    fill="var(--wire)"
                    fillOpacity={0.35}
                  />
                  <rect
                    x={j * CELL + 1}
                    y={i * CELL + 1}
                    width={CELL - 2}
                    height={CELL - 2}
                    rx={3}
                    fill={val >= 0 ? 'var(--color-clay)' : 'var(--color-sky)'}
                    fillOpacity={Math.min(1, Math.abs(val) / vmax) * 0.95}
                    style={cellTransition}
                  />
                </g>
              )
            })}
          </svg>
          <div className="font-mono mt-4 text-[12.5px] text-(--soft)">
            {D}×{D} = {D * D} floats · O(d²), forever
          </div>
          <div className="font-mono mt-1 text-[12.5px] text-(--soft)">
            recall {acc} — {nCorrect}/{t} pairs retrieved
          </div>
        </Card>
      </div>

      {/* recall quiz */}
      <Card className="mt-5">
        <Tag accent="olive">Recall quiz · does S·kⱼ still point at vⱼ?</Tag>
        <svg
          viewBox={`0 0 ${barW} 58`}
          className="block w-full max-w-[460px]"
          role="img"
          aria-label={`Per-pair recall: ${nCorrect} of ${t} stored pairs retrieved correctly`}
        >
          <line x1={0} y1={46.5} x2={barW} y2={46.5} stroke="var(--wire)" strokeWidth={1} />
          {snap.perPair.map((p, i) => {
            const h = Math.max(2, Math.max(0, Math.min(1, p.cos)) * 42)
            return (
              <rect
                key={i}
                x={i * 13 + 2}
                y={46 - h}
                width={9}
                height={h}
                rx={1.5}
                fill={p.correct ? 'var(--color-olive)' : 'var(--color-clay)'}
                style={cellTransition}
              />
            )
          })}
          <text x={2} y={57} fontSize={8} fill="var(--note)" fontFamily="var(--font-mono)">
            oldest
          </text>
          <text x={barW - 2} y={57} textAnchor="end" fontSize={8} fill="var(--note)" fontFamily="var(--font-mono)">
            newest
          </text>
        </svg>
        <div className="font-mono mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[11.5px] text-(--note)">
          <span className="flex items-center gap-2">
            <span className="inline-block h-[9px] w-[9px] rounded-[2px]" style={{ background: 'var(--color-olive)' }} />
            retrieved correctly
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-[9px] w-[9px] rounded-[2px]" style={{ background: 'var(--color-clay)' }} />
            confused with another value
          </span>
          <span>bar height = cosine to the true value</span>
        </div>
      </Card>

      <Note>
        Toy scale: keys and values are random unit vectors in 8 dimensions; retrieval picks the
        stored value nearest to S·k by cosine — a miniature MQAR. Watch the additive rule crowd
        itself once the pair count passes d; decay buys the newest pairs back by forgetting the
        oldest; the delta rule erases the old value at a key before writing the new one.
      </Note>
    </div>
  )
}
