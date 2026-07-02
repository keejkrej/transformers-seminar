import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { H3 } from '../../components/Type'

/** Block fill, slightly lifted from the card background (original #262622). */
const BLK_FILL = 'color-mix(in srgb, var(--color-paper) 4%, var(--color-carddark))'
/** Hot block fill — clay wash on the dark card (original #3a2a22). */
const BLK_HOT_FILL = 'color-mix(in srgb, var(--color-clay) 12%, var(--color-carddark))'
/** Dim mono annotation color (original #6e6c63). */
const GLABEL_FILL = 'color-mix(in srgb, var(--color-stone) 58%, var(--color-ink))'

interface ArchStep {
  no: string
  title: ReactNode
  body: ReactNode
  /** SVG group ids to light up while this step is live. */
  hot: string[]
  /** Light the encoder→decoder bridge in sky. */
  bridge?: boolean
}

const STEPS: ArchStep[] = [
  {
    no: 'step 1 / 6',
    title: 'Tokens become vectors',
    body: (
      <>
        Byte-pair encoding splits text into ~37k subword units — rare words become composable
        pieces (no unknown-word problem across languages). Each unit looks up a 512-dim
        embedding.
      </>
    ),
    hot: ['g-emb'],
  },
  {
    no: 'step 2 / 6',
    title: 'Position is injected',
    body: (
      <>
        The sinusoidal barcode is simply <em>added</em> to each embedding. This is the only
        place the model is told about order. Everything downstream is permutation machinery
        plus this hint.
      </>
    ),
    hot: ['g-pe'],
  },
  {
    no: 'step 3 / 6',
    title: 'The encoder: 6 identical layers',
    body: (
      <>
        Each layer: multi-head self-attention (every source token consults all others), then a
        position-wise feed-forward net (512→2048→512). Residual connections and LayerNorm
        around both — the plumbing that lets it train deep.
      </>
    ),
    hot: ['g-encattn', 'g-encffn'],
  },
  {
    no: 'step 4 / 6',
    title: 'The decoder attends to itself — masked',
    body: (
      <>
        Target tokens self-attend, but a causal mask blanks out the future. The quiet trick of
        the whole paper: training on all positions <em>simultaneously</em> while each still
        only sees its past. Autoregressive semantics, parallel compute.
      </>
    ),
    hot: ['g-decmask'],
  },
  {
    no: 'step 5 / 6',
    title: 'Cross-attention: where translation happens',
    body: (
      <>
        Queries come from the target side; keys and values from the encoder output. This is
        Bahdanau's alignment reborn — the decoder interrogating the source at every layer.
      </>
    ),
    hot: ['g-deccross'],
    bridge: true,
  },
  {
    no: 'step 6 / 6',
    title: 'Linear → softmax → next token',
    body: (
      <>
        A distribution over the vocabulary; at inference, beam search (beam 4) walks it token
        by token. Output embedding weights are shared with the input table. 65M parameters
        total, base config.
      </>
    ),
    hot: ['g-out'],
  },
]

/** Labeled architecture block; `hot` lights it in clay. */
function Blk({
  x,
  y,
  w,
  h,
  hot,
  label,
}: {
  x: number
  y: number
  w: number
  h: number
  hot: boolean
  label: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={7}
        fill={hot ? BLK_HOT_FILL : BLK_FILL}
        stroke={hot ? 'var(--color-clay)' : 'var(--color-linedark)'}
        strokeWidth={hot ? 2 : 1.4}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill={hot ? 'var(--color-clay)' : 'var(--color-stone)'}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 11.5,
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </text>
    </g>
  )
}

/** Small mono annotation next to / inside the diagram. */
function GLabel({
  x,
  y,
  mid = false,
  hot = false,
  children,
}: {
  x: number
  y: number
  mid?: boolean
  hot?: boolean
  children: ReactNode
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={mid ? 'middle' : undefined}
      fill={hot ? 'var(--color-clay)' : GLABEL_FILL}
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
    >
      {children}
    </text>
  )
}

/**
 * "The full machine" scrollytelling: six steps on the left (each ~62vh, dimmed
 * unless live), a sticky Transformer architecture diagram on the right whose
 * groups light up in clay — and the encoder→decoder bridge in sky on the
 * cross-attention step. Collapses to a single column under 900px.
 */
export function ArchDiagram() {
  const [live, setLive] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const els = stepRefs.current.filter((el): el is HTMLDivElement => el !== null)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const idx = els.indexOf(e.target as HTMLDivElement)
          if (idx >= 0) setLive(idx)
        }
      },
      { rootMargin: '-42% 0px -42% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const hot = new Set(STEPS[live].hot)
  const bridgeHot = STEPS[live].bridge === true

  return (
    <div className="mt-[26px] grid grid-cols-2 gap-[60px] max-[900px]:grid-cols-1">
      <div>
        {STEPS.map((s, i) => (
          <div
            key={s.no}
            ref={(el) => {
              stepRefs.current[i] = el
            }}
            className={`flex min-h-[62vh] flex-col justify-center transition-opacity duration-[400ms] max-[900px]:min-h-0 max-[900px]:py-7 ${
              live === i ? 'opacity-100' : 'opacity-25 max-[900px]:opacity-100'
            }`}
          >
            <span className="font-mono text-clay mb-2.5 block text-[12.5px]">{s.no}</span>
            <H3 className="text-paper">{s.title}</H3>
            <p className="max-w-[44ch] text-[15.5px] text-(--soft)">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="sticky top-[7vh] max-[900px]:relative max-[900px]:top-0">
          <svg
            viewBox="0 0 460 620"
            role="img"
            aria-label="Transformer architecture diagram"
            className="block max-h-[86vh] w-full"
          >
            {/* wires (drawn first, underneath) */}
            <path d="M115 560 V 96" fill="none" stroke="var(--color-linedark)" strokeWidth={1.6} />
            <path d="M345 560 V 46" fill="none" stroke="var(--color-linedark)" strokeWidth={1.6} />
            {/* enc→dec bridge */}
            <path
              d="M115 150 H 230 V 260 H 262"
              fill="none"
              strokeDasharray="5 5"
              stroke={bridgeHot ? 'var(--color-sky)' : 'var(--color-linedark)'}
              strokeWidth={bridgeHot ? 2.4 : 1.6}
            />

            {/* embeddings + positional encodings */}
            <Blk x={40} y={520} w={150} h={40} hot={hot.has('g-emb')} label="Input Embedding" />
            <Blk x={270} y={520} w={150} h={40} hot={hot.has('g-emb')} label="Output Embedding" />
            <Blk x={40} y={458} w={150} h={36} hot={hot.has('g-pe')} label="⊕ Positional Enc." />
            <Blk x={270} y={458} w={150} h={36} hot={hot.has('g-pe')} label="⊕ Positional Enc." />

            {/* encoder block (×6) */}
            <rect
              x={28}
              y={128}
              width={174}
              height={298}
              rx={12}
              fill="none"
              stroke="var(--color-linedark)"
              strokeDasharray="6 5"
            />
            <GLabel x={36} y={120}>encoder ×6</GLabel>
            <Blk x={40} y={340} w={150} h={52} hot={hot.has('g-encattn')} label="Multi-Head" />
            <GLabel x={115} y={380} mid hot={hot.has('g-encattn')}>
              self-attention
            </GLabel>
            <Blk x={40} y={296} w={150} h={30} hot={hot.has('g-encattn')} label="Add & Norm" />
            <Blk x={40} y={206} w={150} h={52} hot={hot.has('g-encffn')} label="Feed Forward" />
            <GLabel x={115} y={246} mid hot={hot.has('g-encffn')}>
              512 → 2048 → 512
            </GLabel>
            <Blk x={40} y={162} w={150} h={30} hot={hot.has('g-encffn')} label="Add & Norm" />

            {/* decoder block (×6) */}
            <rect
              x={258}
              y={78}
              width={174}
              height={348}
              rx={12}
              fill="none"
              stroke="var(--color-linedark)"
              strokeDasharray="6 5"
            />
            <GLabel x={266} y={70}>decoder ×6</GLabel>
            <Blk x={270} y={352} w={150} h={44} hot={hot.has('g-decmask')} label="Masked Self-Attn" />
            <Blk x={270} y={316} w={150} h={28} hot={hot.has('g-decmask')} label="Add & Norm" />
            <Blk x={270} y={244} w={150} h={44} hot={hot.has('g-deccross')} label="Cross-Attention" />
            <Blk x={270} y={208} w={150} h={28} hot={hot.has('g-deccross')} label="Add & Norm" />
            <Blk x={270} y={136} w={150} h={44} hot={false} label="Feed Forward" />
            <Blk x={270} y={100} w={150} h={28} hot={false} label="Add & Norm" />

            {/* output */}
            <Blk x={270} y={24} w={150} h={28} hot={hot.has('g-out')} label="Linear + Softmax" />
            <GLabel x={345} y={14} mid hot={hot.has('g-out')}>
              output probabilities
            </GLabel>

            <GLabel x={115} y={600} mid>
              source tokens
            </GLabel>
            <GLabel x={345} y={600} mid>
              target so far (shifted right)
            </GLabel>
          </svg>
        </div>
      </div>
    </div>
  )
}
