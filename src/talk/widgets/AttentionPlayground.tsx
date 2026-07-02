import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Btn, Pill } from '../../components/Buttons'
import { Note } from '../../components/Type'

type Adjective = 'tired' | 'wide'

/** First ten tokens are fixed; the eleventh is the swappable adjective. */
const BASE = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too']

/** Stroke color per head, matching the pill swatches. */
const ACC = ['var(--color-clay)', 'var(--color-sky)', 'var(--color-olive)']

const HEADS = [
  { label: 'head: local syntax', swatch: 'var(--color-clay)' },
  { label: 'head: coreference', swatch: 'var(--color-sky)' },
  { label: 'head: long-range', swatch: 'var(--color-olive)' },
]

type WeightMap = Record<number, Record<number, number>>

/** Attention weights of head `h` from token `i` to every token, normalized. */
function headWeights(h: number, i: number, adjective: Adjective): number[] {
  const n = BASE.length + 1
  const w = new Array<number>(n).fill(0)
  if (h === 0) {
    // local syntax
    for (let j = 0; j < n; j++) {
      if (j === i) continue
      w[j] = Math.exp(-1.15 * Math.abs(i - j))
    }
  } else if (h === 1) {
    // coreference / dependency
    const M: WeightMap = {
      0: { 1: 0.9 },
      1: { 7: 0.55, 0: 0.25 },
      2: { 3: 0.75 },
      3: { 5: 0.55, 2: 0.3 },
      4: { 5: 0.9 },
      5: { 7: 0.35, 4: 0.35 },
      6: { 10: 0.5, 3: 0.3 },
      8: { 7: 0.5, 10: 0.35 },
      9: { 10: 0.85 },
      10: { 7: 0.55 },
    }
    const itMap: Record<number, number> =
      adjective === 'tired' ? { 1: 0.8, 5: 0.14 } : { 5: 0.8, 1: 0.14 }
    const m = i === 7 ? itMap : (M[i] ?? {})
    for (const [j, v] of Object.entries(m)) w[+j] = v
    if (i === 10) w[adjective === 'tired' ? 1 : 5] = 0.3
  } else {
    // long-range semantics
    const M: WeightMap = {
      1: { 10: 0.5, 3: 0.3 },
      2: { 10: 0.4 },
      3: { 1: 0.35, 5: 0.45 },
      5: { 3: 0.5 },
      6: { 2: 0.3, 10: 0.45 },
      8: { 1: 0.3, 5: 0.2 },
      9: { 6: 0.3 },
      10: { 6: 0.4 },
    }
    const itMap: Record<number, number> =
      adjective === 'tired' ? { 10: 0.45, 1: 0.3, 3: 0.2 } : { 10: 0.45, 5: 0.3, 3: 0.2 }
    const m = i === 7 ? itMap : (M[i] ?? {})
    for (const [j, v] of Object.entries(m)) w[+j] = v
  }
  const s = w.reduce((a, b) => a + b, 0) || 1
  return w.map((v) => v / s)
}

/**
 * The paper's Figure 8, live: click a token, watch three attention heads
 * draw their arcs; swap the adjective and "it" changes its referent.
 */
export function AttentionPlayground() {
  const [adjective, setAdjective] = useState<Adjective>('tired')
  const [selIdx, setSelIdx] = useState(7)
  const [heads, setHeads] = useState<boolean[]>([true, true, false])

  const boxRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tokens = [...BASE, adjective]

  const drawArcs = useCallback(() => {
    const box = boxRef.current
    const svg = svgRef.current
    if (!box || !svg) return
    const rect = box.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${rect.width} 150`)
    svg.setAttribute('width', String(rect.width))
    svg.setAttribute('height', '150')
    // Per-token anchors from live layout, so arcs stay correct on wrapped rows.
    const anchor = (k: number) => {
      const el = btnRefs.current[k]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top - 4 }
    }
    let s = ''
    ;[0, 1, 2].forEach((h) => {
      if (!heads[h]) return
      const W = headWeights(h, selIdx, adjective)
      W.forEach((w, j) => {
        if (w < 0.05 || j === selIdx) return
        const a = anchor(selIdx)
        const b = anchor(j)
        if (!a || !b) return
        const lift =
          Math.max(22, Math.abs(b.x - a.x) * 0.34) + h * 8 + Math.abs(b.y - a.y) * 0.22
        const top = Math.min(a.y, b.y) - lift
        s += `<path d="M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${top} ${b.x} ${b.y}" fill="none" stroke-linecap="round" style="stroke:${ACC[h]}" stroke-width="${(1 + 7 * w).toFixed(1)}" opacity="${(0.25 + 0.6 * w).toFixed(2)}"/>`
      })
    })
    svg.innerHTML = s
  }, [heads, selIdx, adjective])

  // Redraw after every render that changes selection/heads/adjective…
  useLayoutEffect(() => {
    drawArcs()
  }, [drawArcs])

  // …and on resize (token rows re-wrap).
  useEffect(() => {
    const onResize = () => drawArcs()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [drawArcs])

  const ref = adjective === 'tired' ? 'animal' : 'street'

  return (
    <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] pt-[34px] pb-7 max-sm:px-5">
      <div ref={boxRef} className="relative pt-[150px] max-[640px]:pt-[70px]">
        <svg
          ref={svgRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-[150px] w-full overflow-visible"
        />
        <div
          role="group"
          aria-label="Click a token to see its attention"
          className="relative z-[2] flex flex-wrap gap-[7px]"
        >
          {tokens.map((t, i) => {
            const sel = i === selIdx
            return (
              <button
                key={i}
                type="button"
                ref={(el) => {
                  btnRefs.current[i] = el
                }}
                onClick={() => setSelIdx(i)}
                onMouseEnter={() => setSelIdx(i)}
                className={`font-mono bg-carddark cursor-pointer rounded-lg border-[1.5px] px-[13px] py-[9px] text-[15px] transition-colors ${
                  sel ? 'border-clay text-clay' : 'border-linedark text-paper hover:border-stone'
                }`}
                style={
                  sel
                    ? { background: 'color-mix(in srgb, var(--color-clay) 12%, var(--color-carddark))' }
                    : undefined
                }
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-[26px] flex flex-wrap items-center gap-2.5">
        {HEADS.map((h, i) => (
          <Pill
            key={h.label}
            pressed={heads[i]}
            swatch={h.swatch}
            onClick={() => setHeads((prev) => prev.map((v, j) => (j === i ? !v : v)))}
          >
            {h.label}
          </Pill>
        ))}
        <span className="flex-1" />
        <Btn
          primary
          onClick={() => {
            setAdjective((a) => (a === 'tired' ? 'wide' : 'tired'))
            setSelIdx(7)
          }}
        >
          {adjective === 'tired' ? 'swap “tired” ⇄ “wide”' : 'swap “wide” ⇄ “tired”'}
        </Btn>
      </div>

      <Note className="text-[14px]">
        {selIdx === 7 ? (
          <>
            “it” attends to <strong>{ref}</strong> — because the{' '}
            {adjective === 'tired' ? 'animal is tired' : 'street is wide'}. One weight matrix,
            doing coreference on the fly.
          </>
        ) : (
          <>
            showing what “{tokens[selIdx]}” attends to — hover other tokens, or click “it” for
            the famous one.
          </>
        )}
      </Note>
    </div>
  )
}
