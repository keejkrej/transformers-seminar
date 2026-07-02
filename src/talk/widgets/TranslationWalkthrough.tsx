import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Btn } from '../../components/Buttons'
import { Note } from '../../components/Type'

/**
 * Source sentence — trimmed from Bahdanau et al.'s 2014 alignment figure.
 * Per the reference implementation, the source carries a trailing ‹/s›
 * (an explicit end marker for the decoder to consult) but no start token.
 */
const SRC = ['The', 'agreement', 'was', 'signed', 'in', 'August', '1992', '.', '‹/s›']
const SRC_EOS = SRC.length - 1

interface DecodeStep {
  /** Token the decoder emits at this step. */
  out: string
  /** Cross-attention over SRC while producing it (normalized in code). */
  attn: Record<number, number>
  /** Top of the softmax distribution the token was chosen from. */
  alts: [string, number][]
  note: string
}

const STEPS: DecodeStep[] = [
  {
    out: 'Das',
    attn: { 0: 0.7, 1: 0.2, 7: 0.03 },
    alts: [
      ['Das', 0.81],
      ['Die', 0.07],
      ['Der', 0.05],
    ],
    note: 'The very first query comes from ‹s› alone. Cross-attention finds the subject “The agreement”, and German grammar picks the neuter article “Das”.',
  },
  {
    out: 'Abkommen',
    attn: { 1: 0.8, 0: 0.07, 2: 0.06 },
    alts: [
      ['Abkommen', 0.86],
      ['Übereinkommen', 0.06],
      ['Vereinbarung', 0.04],
    ],
    note: 'A near-copy: the noun aligns one-to-one, so nearly all the attention mass lands on “agreement”.',
  },
  {
    out: 'wurde',
    attn: { 2: 0.58, 3: 0.28, 1: 0.06 },
    alts: [
      ['wurde', 0.74],
      ['ist', 0.11],
      ['war', 0.06],
    ],
    note: '“wurde” opens the German passive — it reads “was” but already peeks at “signed”, whose content it will deliver much later.',
  },
  {
    out: 'im',
    attn: { 4: 0.68, 5: 0.18, 3: 0.05 },
    alts: [
      ['im', 0.77],
      ['in', 0.13],
      ['am', 0.04],
    ],
    note: '“in dem” contracts to “im” — two source cues, one target token. The alignment is latent; nothing forces it to be one-to-one.',
  },
  {
    out: 'August',
    attn: { 5: 0.85, 6: 0.07, 4: 0.04 },
    alts: [
      ['August', 0.94],
      ['Monat', 0.02],
      ['Aug', 0.01],
    ],
    note: 'Dates and names are the sharpest, most literal alignments in the whole map — the model effectively copies.',
  },
  {
    out: '1992',
    attn: { 6: 0.9, 5: 0.05 },
    alts: [
      ['1992', 0.96],
      ['92', 0.02],
      ['Jahre', 0.01],
    ],
    note: 'Same again — “1992” crosses the language boundary untouched.',
  },
  {
    out: 'unterzeichnet',
    attn: { 3: 0.74, 2: 0.12, 7: 0.05 },
    alts: [
      ['unterzeichnet', 0.84],
      ['signiert', 0.07],
      ['abgeschlossen', 0.05],
    ],
    note: 'The payoff step: German pushes the participle to the very end, and cross-attention reaches back to “signed” — the long-range link RNNs struggled to hold.',
  },
  {
    out: '.',
    attn: { 7: 0.72, 8: 0.15 },
    alts: [
      ['.', 0.91],
      ['!', 0.02],
      [',', 0.02],
    ],
    note: 'Punctuation closes off — most of the mass sits on the source period, with a glance at the end marker.',
  },
  {
    out: '‹/s›',
    attn: { 8: 0.68, 7: 0.15 },
    alts: [
      ['‹/s›', 0.88],
      ['und', 0.03],
      ['.', 0.02],
    ],
    note: 'The decoder reads the source\'s own end marker ‹/s› and answers in kind: it emits end-of-sequence and the loop halts. Source and target lengths never had to match.',
  },
]

const PLAY_MS = 1500

/** Attention of step `k` as a normalized array over SRC. */
function stepWeights(k: number): number[] {
  const w = SRC.map((_, j) => STEPS[k].attn[j] ?? 0)
  const s = w.reduce((a, b) => a + b, 0) || 1
  return w.map((v) => v / s)
}

function RowLabel({ color, children }: { color: string; children: string }) {
  return (
    <div
      className={`font-display relative z-[2] mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase ${color}`}
    >
      {children}
    </div>
  )
}

/**
 * Autoregressive decoding, one press per token: the English source is encoded
 * once; each step draws the decoder's cross-attention arcs back into it and
 * shows the softmax distribution the German token was chosen from. Click any
 * emitted token to revisit its step.
 */
export function TranslationWalkthrough() {
  /** Number of tokens emitted so far (0..STEPS.length). */
  const [emitted, setEmitted] = useState(0)
  /** Which emitted step is being inspected; null before the first press. */
  const [inspect, setInspect] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const srcRefs = useRef<(HTMLDivElement | null)[]>([])
  const tgtRefs = useRef<(HTMLButtonElement | null)[]>([])

  const done = emitted >= STEPS.length

  const advance = useCallback(() => {
    setEmitted((n) => {
      if (n >= STEPS.length) return n
      setInspect(n)
      return n + 1
    })
  }, [])

  useEffect(() => {
    if (!playing) return
    if (done) {
      setPlaying(false)
      return
    }
    const t = setInterval(advance, PLAY_MS)
    return () => clearInterval(t)
  }, [playing, done, advance])

  const drawArcs = useCallback(() => {
    const box = boxRef.current
    const svg = svgRef.current
    if (!box || !svg) return
    const rect = box.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
    svg.setAttribute('width', String(rect.width))
    svg.setAttribute('height', String(rect.height))
    let s = ''
    if (inspect !== null) {
      const from = tgtRefs.current[inspect + 1] // +1: slot 0 is ‹s›
      if (from) {
        const fr = from.getBoundingClientRect()
        const a = { x: fr.left - rect.left + fr.width / 2, y: fr.top - rect.top - 3 }
        stepWeights(inspect).forEach((w, j) => {
          if (w < 0.03) return
          const el = srcRefs.current[j]
          if (!el) return
          const r = el.getBoundingClientRect()
          const b = { x: r.left - rect.left + r.width / 2, y: r.bottom - rect.top + 3 }
          s += `<path d="M ${a.x} ${a.y} C ${a.x} ${a.y - 34}, ${b.x} ${b.y + 34}, ${b.x} ${b.y}" fill="none" stroke-linecap="round" style="stroke:var(--color-sky)" stroke-width="${(1 + 8 * w).toFixed(1)}" opacity="${(0.3 + 0.6 * w).toFixed(2)}"/>`
        })
      }
    }
    svg.innerHTML = s
  }, [inspect])

  // Redraw when the inspected step (or the row layout) changes…
  useLayoutEffect(() => {
    drawArcs()
  }, [drawArcs, emitted])

  // …and on resize (chip rows re-wrap).
  useEffect(() => {
    const onResize = () => drawArcs()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [drawArcs])

  const weights = inspect !== null ? stepWeights(inspect) : SRC.map(() => 0)
  const step = inspect !== null ? STEPS[inspect] : null

  return (
    <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] pt-7 pb-7 max-sm:px-5">
      <div ref={boxRef} className="relative">
        <svg
          ref={svgRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
        />

        <RowLabel color="text-sky">source · English — encoded once, in parallel</RowLabel>
        <div className="relative z-[2] flex flex-wrap gap-[7px]">
          {SRC.map((t, j) => {
            const w = weights[j]
            const pct = Math.round(w * 70)
            const eos = j === SRC_EOS
            return (
              <div
                key={j}
                ref={(el) => {
                  srcRefs.current[j] = el
                }}
                className={`font-mono rounded-lg border-[1.5px] px-[13px] py-[9px] text-[15px] transition-colors ${
                  eos ? 'text-stone border-dashed' : 'text-paper'
                }`}
                style={{
                  background: `color-mix(in srgb, var(--color-sky) ${pct}%, var(--color-carddark))`,
                  borderColor:
                    w > 0.25 ? 'var(--color-sky)' : eos ? 'var(--color-stone)' : 'var(--color-linedark)',
                }}
              >
                {t}
              </div>
            )
          })}
        </div>

        <div className="h-[72px]" aria-hidden="true" />

        <div
          role="group"
          aria-label="Generated German tokens — click one to revisit its step"
          className="relative z-[2] flex flex-wrap gap-[7px]"
        >
          <button
            type="button"
            ref={(el) => {
              tgtRefs.current[0] = el
            }}
            disabled
            className="font-mono text-stone border-stone rounded-lg border-[1.5px] border-dashed bg-transparent px-[13px] py-[9px] text-[15px]"
          >
            ‹s›
          </button>
          {STEPS.slice(0, emitted).map((st, k) => {
            const sel = inspect === k
            const eos = k === STEPS.length - 1
            return (
              <button
                key={k}
                type="button"
                ref={(el) => {
                  tgtRefs.current[k + 1] = el
                }}
                onClick={() => setInspect(k)}
                className={`font-mono bg-carddark cursor-pointer rounded-lg border-[1.5px] px-[13px] py-[9px] text-[15px] transition-colors ${
                  eos ? 'border-dashed' : ''
                } ${sel ? 'border-clay text-clay' : 'border-linedark text-paper hover:border-stone'}`}
                style={
                  sel
                    ? {
                        background:
                          'color-mix(in srgb, var(--color-clay) 12%, var(--color-carddark))',
                      }
                    : undefined
                }
              >
                {st.out}
              </button>
            )
          })}
        </div>
        <RowLabel color="text-clay mt-3 mb-0">
          target · German — one token per step, each fed back in
        </RowLabel>
      </div>

      <div className="mt-[26px] flex flex-wrap items-center gap-2.5">
        <Btn primary onClick={advance} disabled={done} className="disabled:cursor-default disabled:opacity-45">
          {done ? 'translated ✓' : emitted === 0 ? 'start decoding ▸' : 'next token ▸'}
        </Btn>
        <Btn onClick={() => setPlaying((p) => !p)} disabled={done} className="disabled:cursor-default disabled:opacity-45">
          {playing ? 'pause' : 'auto-play'}
        </Btn>
        <Btn
          onClick={() => {
            setPlaying(false)
            setEmitted(0)
            setInspect(null)
          }}
        >
          reset
        </Btn>
        <span className="flex-1" />
        <span className="font-mono text-clay text-[12.5px]">
          step {emitted} / {STEPS.length}
        </span>
      </div>

      <div className="mt-5 rounded-[10px] border border-(--card-line) p-4">
        <div className="font-display text-[11px] font-semibold tracking-[0.16em] text-(--note) uppercase">
          {step
            ? `linear → softmax · top of the 37k-word vocabulary, step ${inspect! + 1}`
            : 'linear → softmax · the decoder holds only ‹s›'}
        </div>
        {step ? (
          <div className="mt-3 grid gap-2">
            {step.alts.map(([tok, p], i) => (
              <div key={tok} className="flex items-center gap-3">
                <span
                  className={`font-mono w-[15ch] shrink-0 text-[13.5px] ${
                    i === 0 ? 'text-clay' : 'text-stone'
                  }`}
                >
                  {tok}
                </span>
                <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-(--sec-bg)">
                  <div
                    className={`h-full rounded-full ${i === 0 ? 'bg-clay' : 'bg-stone'}`}
                    style={{ width: `${Math.round(p * 100)}%`, opacity: i === 0 ? 1 : 0.55 }}
                  />
                </div>
                <span className="font-mono w-[4ch] shrink-0 text-right text-[12px] text-(--note)">
                  {Math.round(p * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-[14px] text-(--soft)">
            Press <strong>start decoding</strong> — every German token below will be chosen from a
            distribution like this one, then appended to the decoder's input.
          </p>
        )}
      </div>

      <Note className="text-[14px]">
        {step ? (
          step.note
        ) : (
          <>
            The English row is already done: the encoder processed all nine tokens — the
            sentence's eight plus a trailing end marker ‹/s›, per the reference implementation —
            in one parallel pass, and those vectors now sit fixed. Everything from here on is the
            decoder's loop. (The source needs no ‹s›: only generation must be seeded.)
          </>
        )}
      </Note>
    </div>
  )
}
