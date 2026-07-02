import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Card, Tag } from '../components/Card'
import { Reveal } from '../components/Reveal'
import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede } from '../components/Type'
import type { Accent } from '../data/modules'
import { MODULES, moduleBySlug } from '../data/modules'
import { TWOTOWER } from '../data/paper'
import { KVCalculator } from './widgets/KVCalculator'

/** Small uppercase clay link into an extension-module deep-dive page. */
function DeepDive({ slug, className = '' }: { slug: string; className?: string }) {
  const m = moduleBySlug(slug)
  if (!m) return null
  return (
    <Link
      to="/m/$slug"
      params={{ slug: m.slug }}
      className={`font-display text-clay inline-block text-[11px] font-semibold tracking-[0.14em] uppercase no-underline transition-opacity hover:opacity-75 ${className}`}
    >
      {m.num} · {m.title} →
    </Link>
  )
}

function FixCard({
  tag,
  accent,
  title,
  slugs,
  children,
}: {
  tag: string
  accent: Accent
  title: string
  slugs: string[]
  children: ReactNode
}) {
  return (
    <Card className="flex h-full flex-col">
      <Tag accent={accent}>{tag}</Tag>
      <H3>{title}</H3>
      <p>{children}</p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 pt-4">
        {slugs.map((s) => (
          <DeepDive key={s} slug={s} />
        ))}
      </div>
    </Card>
  )
}

function Spec({ num, lab, clay = false }: { num: ReactNode; lab: string; clay?: boolean }) {
  return (
    <div className="min-w-[120px]">
      <div className={`font-display text-2xl font-bold ${clay ? 'text-clay' : ''}`}>{num}</div>
      <div className="font-display mt-[3px] text-[10.5px] font-semibold tracking-[0.14em] uppercase text-(--note)">
        {lab}
      </div>
    </div>
  )
}

export function DebtSection() {
  return (
    <Section id="debt" variant="dark">
      <Wrap>
        <Reveal>
          <Eyebrow accent="clay">Part 08 · The bills attention left</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Every token attends to every token. That's the bug now.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            The paper solved training-time parallelism and left two time bombs:{' '}
            <strong>O(n²) attention cost</strong> as contexts grew from 70 tokens to a million, and
            — inherited untouched from Part 04 —{' '}
            <strong>one-token-at-a-time autoregressive generation</strong>. Most of the last five
            years of systems research is paying these two debts.
          </Lede>
        </Reveal>

        <Reveal className="mt-[30px]">
          <KVCalculator />
        </Reveal>

        <div className="mt-10 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          <Reveal className="h-full">
            <FixCard tag="fix · cache smaller" accent="sky" title="MQA → GQA → MLA" slugs={['kv-compression']}>
              Share keys/values across query heads (MQA/GQA, 8× smaller), or project them into a
              compressed latent (DeepSeek's MLA, ~30× smaller) — toggle them above. Same attention,
              thriftier rent.
            </FixCard>
          </Reveal>
          <Reveal className="h-full" delay={0.05}>
            <FixCard tag="fix · move bytes smarter" accent="sky" title="FlashAttention" slugs={['kv-compression']}>
              Attention was never compute-bound — it was drowning in memory traffic. Tile the
              computation to stay in on-chip SRAM: exact same math, 2–4× faster, and long contexts
              become trainable at all.
            </FixCard>
          </Reveal>
          <Reveal className="h-full" delay={0.1}>
            <FixCard tag="fix · attend less" accent="sky" title="Sparse attention" slugs={['linear-attention']}>
              Sliding windows, global tokens (Longformer/BigBird), and learned block selection (NSA,
              MoBA — 2025) cut n² to near-linear by betting most token pairs never mattered.
            </FixCard>
          </Reveal>
          <Reveal className="h-full">
            <FixCard
              tag="fix · change the math"
              accent="olive"
              title="Linear attention & SSMs"
              slugs={['linear-attention', 'state-space-models']}
            >
              Kernelized attention, then Mamba's state-space models: O(n), constant-memory inference
              — recurrence, reborn with better parenting. Production models now ship as{' '}
              <em>hybrids</em>: mostly Mamba, a few attention layers.
            </FixCard>
          </Reveal>
          <Reveal className="h-full" delay={0.05}>
            <FixCard tag="fix · guess then check" accent="olive" title="Speculative decoding" slugs={['twotower']}>
              A small drafter proposes k tokens; the big model verifies them{' '}
              <em>in one parallel pass</em> — accept on agreement, provably identical output, 2–3×
              faster. The 2017 parallelism trick, smuggled into generation.
            </FixCard>
          </Reveal>
          <Reveal className="h-full" delay={0.1}>
            <FixCard tag="fix · pay per token" accent="olive" title="Mixture of experts" slugs={['twotower']}>
              Shazeer's other 2017 idea, industrialized: hundreds of expert FFNs, a router activates
              a few per token. Parameters decouple from FLOPs — trillion-parameter capacity at
              billion-parameter cost.
            </FixCard>
          </Reveal>
        </div>

        <Reveal className="mt-10">
          <div className="rounded-[10px] border border-(--card-line) bg-(--card-bg) px-7 py-6">
            <p className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-(--note)">
              Extension modules · six deep dives
            </p>
            <div className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((m) => (
                <Link
                  key={m.slug}
                  to="/m/$slug"
                  params={{ slug: m.slug }}
                  title={m.tagline}
                  className="group font-display text-[11.5px] font-semibold tracking-[0.12em] uppercase no-underline"
                >
                  <span className="text-(--note)">{m.num}</span>{' '}
                  <span className="text-clay transition-opacity group-hover:opacity-75">
                    {m.title} →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <div className="border-clay rounded-[14px] border-[1.5px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-clay)_9%,var(--color-carddark)),var(--color-carddark)_55%)] px-8 py-9">
            <Tag accent="clay">Debt №2 · autoregression itself — a 2026 exhibit</Tag>
            <H3 className="mt-2.5">NVIDIA Nemotron “TwoTower” 30B-A3B</H3>
            <p className="max-w-[66ch] text-[15.5px] text-(--soft)">
              The one piece the Transformer never fixed was generating one token at a time. This
              model attacks exactly that: a frozen <strong>autoregressive context tower</strong>{' '}
              reads the prompt, and a <strong>diffusion denoiser tower</strong> generates whole{' '}
              <em>blocks</em> of tokens in parallel — iteratively unmasking them with bidirectional
              attention inside each block. Count what's left of 2017 in its backbone:
            </p>
            <div className="mt-[22px] flex flex-wrap gap-[26px]">
              <Spec
                clay
                num={
                  <>
                    {TWOTOWER.attentionLayers}{' '}
                    <span className="text-[0.6em] text-(--note)">/ {TWOTOWER.layersPerTower}</span>
                  </>
                }
                lab="attention layers per tower"
              />
              <Spec num={TWOTOWER.mamba2Layers} lab="Mamba-2 layers" />
              <Spec
                num={`${TWOTOWER.expertsRouted} → ${TWOTOWER.expertsActive}`}
                lab="experts, routed → active"
              />
              <Spec
                num={TWOTOWER.activeParams}
                lab={`active params (of ${TWOTOWER.totalParamsPerTower})`}
              />
              <Spec clay num={TWOTOWER.throughputVsAR} lab="generation throughput vs AR" />
              <Spec num={TWOTOWER.qualityRetained} lab="of AR baseline quality" />
              <Spec num={TWOTOWER.contextTokens} lab="context window" />
            </div>
            <p className="mt-5 text-[15px] italic text-(--note)">
              Every debt on this page, paid in one artifact: SSM layers against the quadratic bill,
              MoE against the FLOPs bill, diffusion against the sequential bill — and still six
              attention layers it can't live without.
            </p>
            <DeepDive slug="twotower" className="mt-5" />
          </div>
        </Reveal>
      </Wrap>
    </Section>
  )
}
