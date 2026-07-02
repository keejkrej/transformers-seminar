import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede } from '../components/Type'
import { Card, Tag, Stat } from '../components/Card'
import { Reveal } from '../components/Reveal'
import { PAPER } from '../data/paper'
import { LRChart } from './widgets/LRChart'
import { ComputeLadder } from './widgets/ComputeLadder'
import type { Accent } from '../data/modules'
import type { ReactNode } from 'react'

/** Inline monospace run inside card copy, matching the reference `.mono` span. */
function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.85em]">{children}</span>
}

const STATS: { num: ReactNode; label: ReactNode; accent: Accent }[] = [
  { num: PAPER.endeSentencePairs, label: 'EN–DE sentence pairs (WMT 2014)', accent: 'clay' },
  { num: '37k', label: 'shared byte-pair vocabulary', accent: 'sky' },
  { num: PAPER.gpus, label: `one machine, ${PAPER.gpuMemoryGB} GB each`, accent: 'olive' },
  { num: PAPER.baseTime, label: `base model · ${PAPER.baseSteps} steps`, accent: 'clay' },
  { num: PAPER.bigTime, label: `big model · ${PAPER.bigSteps} steps`, accent: 'sky' },
  { num: `${PAPER.paramsBase} / ${PAPER.paramsBig}`, label: 'parameters, base / big', accent: 'olive' },
  { num: PAPER.bleuEnDe, label: 'BLEU EN→DE (+2.0 over SOTA, incl. ensembles)', accent: 'clay' },
  { num: PAPER.bleuEnFr, label: 'BLEU EN→FR · single-model SOTA', accent: 'sky' },
]

const GPUS: { tag: string; name: string; vram: string; spec: string; body: ReactNode }[] = [
  {
    tag: '2016 · hardware available',
    name: 'Tesla P100',
    vram: `${PAPER.gpuMemoryGB} GB`,
    spec: '~21 TFLOPS fp16',
    body: (
      <>
        The whole run fit on one 8-GPU server. VRAM was the binding constraint — batch sizes were
        counted in tokens, not sequences.
      </>
    ),
  },
  {
    tag: '2022',
    name: 'H100',
    vram: '80 GB',
    spec: '~2,000 TFLOPS fp8',
    body: (
      <>
        ~100× the arithmetic of a P100. The base Transformer's 12-hour run now completes in under
        an hour on a single card.
      </>
    ),
  },
  {
    tag: '2024',
    name: 'B200',
    vram: '192 GB',
    spec: '~4,500 TFLOPS fp8',
    body: (
      <>
        One chip ≈ 200 P100s. The entire landmark <em>big</em> run — {PAPER.flopsBig} FLOPs — is
        roughly <strong>a few hours on a single B200</strong>.
      </>
    ),
  },
]

export function TrainingSection() {
  return (
    <Section id="training" variant="paper">
      <Wrap>
        <Reveal>
          <Eyebrow accent="sky">Part 06 · The recipe</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Twelve hours on eight GPUs, and a new state of the art.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            The result wasn't only quality — it was quality <em>per unit of compute</em>. The
            big model reached {PAPER.bleuEnDe} BLEU on English→German at less than ¼ the training
            cost of every previous best.
          </Lede>
        </Reveal>

        <div className="mt-11 grid grid-cols-1 gap-[18px] min-[620px]:grid-cols-2 min-[900px]:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <Stat num={s.num} label={s.label} accent={s.accent} />
            </Reveal>
          ))}
        </div>

        <div className="mt-11 grid grid-cols-1 items-start gap-[22px] min-[620px]:grid-cols-2">
          <Reveal>
            <Card>
              <Tag accent="clay">Optimization</Tag>
              <H3>Warm up, then decay</H3>
              <p>
                Adam (<Mono>β₂=0.98</Mono>) with the now-famous schedule: linear warmup for{' '}
                {PAPER.warmupSteps.toLocaleString('en-US')} steps, then inverse-square-root decay.
                Plus dropout {PAPER.dropout} and <strong>label smoothing {PAPER.labelSmoothing}</strong>{' '}
                — which <em>worsens perplexity but improves BLEU</em>. They optimized the metric
                that mattered.
              </p>
              <LRChart />
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card>
              <Tag accent="sky">Batching</Tag>
              <H3>Data and batching</H3>
              <p>
                Batches of ~25,000 source + 25,000 target tokens, sentences bucketed by length.
                EN–FR used {PAPER.enfrSentencePairs} pairs with a {PAPER.enfrVocab} vocabulary.
                Final models average the last few checkpoints — no unusual techniques, fully
                reproducible on a single machine.
              </p>
              <p className="mt-3">
                Total training compute, big model: <Mono>{PAPER.flopsBig} FLOPs</Mono>. Note this
                figure.
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal>
          <div className="font-display text-sky mt-20 mb-[18px] flex items-center gap-3.5 text-xs font-semibold tracking-[0.2em] uppercase">
            <span className="bg-sky h-0.5 w-[26px]" aria-hidden="true" />
            2017 hardware vs. now
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-[22px] min-[620px]:grid-cols-2 min-[900px]:grid-cols-3">
          {GPUS.map((g, i) => (
            <Reveal key={g.name} delay={i * 0.08}>
              <Card>
                <Tag accent="gray">{g.tag}</Tag>
                <H3>{g.name}</H3>
                <div className="font-display mt-1 mb-0.5 text-[1.9rem] font-bold tracking-[-0.02em]">
                  {g.vram}
                </div>
                <div className="font-mono text-[13px] text-(--soft)">{g.spec}</div>
                <p className="mt-2.5">{g.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-[46px]">
          <H3>Training compute, on a log scale</H3>
          <p className="mb-[18px] max-w-[60ch] text-[15px] text-(--soft)">
            Each step to the right is <strong>10×</strong>. The gap between this paper and a 2025
            frontier run is about <strong>seven orders of magnitude</strong> — same architecture
            family end to end.
          </p>
          <ComputeLadder />
        </Reveal>
      </Wrap>
    </Section>
  )
}
