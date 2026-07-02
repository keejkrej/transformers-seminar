import type { ReactNode } from 'react'
import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede } from '../components/Type'
import { Reveal } from '../components/Reveal'

type TimelineItem = {
  yr: string
  title: ReactNode
  body: ReactNode
  skip?: boolean
}

const ITEMS: TimelineItem[] = [
  {
    yr: '2017',
    title: 'Transformer — and, same year, sparse MoE',
    body: (
      <>
        Noam Shazeer co-authors both this paper and “Outrageously Large Neural Networks”
        (mixture-of-experts). The two threads braid together for a decade — see Part 08.
      </>
    ),
  },
  {
    yr: '2018',
    title: 'BERT: keep only the encoder',
    body: (
      <>
        Bidirectional pre-training + fine-tuning sets new records across NLP benchmarks and is
        deployed in Google Search. First proof that the blueprint transfers beyond translation.
        (GPT-1 quietly keeps only the <em>decoder</em>…)
      </>
    ),
  },
  {
    yr: '2019',
    skip: true,
    title: (
      <>
        GPT-2 — <span className="text-clay">deliberately skipped</span>
      </>
    ),
    body: (
      <>
        Decoder-only scaling, language modeling as the universal task: that material belongs to
        the <strong>next talk in this seminar</strong>.
      </>
    ),
  },
  {
    yr: '2020',
    title: 'ViT: an image is worth 16×16 words',
    body: (
      <>
        Divide an image into patches, treat them as tokens, feed the plain 2017 encoder. CNNs&apos;
        decade of dominance in vision ends. Scaling laws (Kaplan et al.) make scale itself a
        research program.
      </>
    ),
  },
  {
    yr: '2021',
    title: 'AlphaFold 2: attention over proteins',
    body: (
      <>
        Attention over residue pairs solves protein structure prediction — later a Nobel Prize in
        Chemistry. The clearest sign this is a general computation, not merely a language technique.
      </>
    ),
  },
  {
    yr: '2022',
    title: 'Whisper, FlashAttention, and the chat moment',
    body: (
      <>
        Speech recognition falls to an off-the-shelf encoder–decoder Transformer (Whisper).
        FlashAttention makes exact attention IO-efficient. And a widely adopted chat product brings
        the architecture into public awareness.
      </>
    ),
  },
  {
    yr: '2023–26',
    title: 'The substrate era',
    body: (
      <>
        Open weights (LLaMA and descendants), multimodal models, code assistants, reasoning models
        — plus the first credible challengers (Mamba, diffusion LMs) which, tellingly, still retain
        some attention layers. We turn next to the costs.
      </>
    ),
  },
]

/** Dot accent cycles clay → sky → olive, matching the original nth-child(3n…) rules. */
const DOT_ACCENT = ['border-clay', 'border-sky', 'border-olive']

/** Original stripe color #f1efe6 ≈ 50/50 paper/mist — built from tokens, no new hex. */
const STRIPE = 'color-mix(in srgb, var(--color-carddark) 55%, var(--color-linedark))'

function Year({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px] text-stone">{children}</span>
}

function Dot({ accent }: { accent: string }) {
  return (
    <span
      aria-hidden
      className={`absolute top-[7px] left-[-32.5px] h-[13px] w-[13px] rounded-full border-[3px] bg-(--sec-bg) ${accent}`}
    />
  )
}

export function ImpactSection() {
  return (
    <Section id="impact" variant="tint">
      <Wrap>
        <Reveal>
          <Eyebrow accent="olive">Part 07 · Impact</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>A translation paper reshaped the entire field.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            Roughly 200,000 citations later, the Transformer is less an architecture than a
            substrate. A recurring pattern follows: take the 2017 blueprint, remove part of it,
            apply it to a new modality, and it succeeds.
          </Lede>
        </Reveal>

        <div className="relative mt-14 pl-[34px]">
          {/* vertical spine */}
          <div
            aria-hidden
            className="absolute top-1.5 bottom-1.5 left-[7px] w-0.5 bg-stone opacity-50"
          />
          {ITEMS.map((item, i) =>
            item.skip ? (
              <Reveal key={item.yr}>
                <div className="relative pb-[42px] opacity-85">
                  <Dot accent={DOT_ACCENT[i % 3]} />
                  <Year>{item.yr}</Year>
                  <div
                    className="mt-1.5 rounded-[10px] border-[1.5px] border-dashed border-stone px-5 py-[18px]"
                    style={{
                      background: `repeating-linear-gradient(-45deg, transparent, transparent 12px, ${STRIPE} 12px, ${STRIPE} 24px)`,
                    }}
                  >
                    <H3 className="mt-1.5 mb-1.5!">{item.title}</H3>
                    <p className="max-w-[58ch] text-[15.5px] text-(--soft)">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ) : (
              <Reveal key={item.yr}>
                <div className="relative pb-[42px]">
                  <Dot accent={DOT_ACCENT[i % 3]} />
                  <Year>{item.yr}</Year>
                  <H3 className="mt-1.5 mb-1.5!">{item.title}</H3>
                  <p className="max-w-[58ch] text-[15.5px] text-(--soft)">{item.body}</p>
                </div>
              </Reveal>
            ),
          )}
        </div>
      </Wrap>
    </Section>
  )
}
