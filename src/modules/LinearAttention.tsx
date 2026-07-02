import type { ReactNode } from 'react'
import { ModuleLayout } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Reveal } from '../components/Reveal'
import { Eyebrow, H2, H3, Lede, Body, Note } from '../components/Type'
import { Card, Tag, Stat } from '../components/Card'
import { Math } from '../components/Math'
import { PAPER } from '../data/paper'
import { LinearAttentionMemory } from './widgets/linear-attention-memory'

const SOFTMAX_EQ = String.raw`o_i \;=\; \frac{\sum_{j \le i} \exp\!\big(q_i^\top k_j / \sqrt{d}\big)\, v_j}{\sum_{j \le i} \exp\!\big(q_i^\top k_j / \sqrt{d}\big)}`

const LINEAR_EQ = String.raw`o_i \;=\; \frac{\phi(q_i)^\top \sum_{j \le i} \phi(k_j)\, v_j^\top}{\phi(q_i)^\top \sum_{j \le i} \phi(k_j)}`

const STATE_EQ = String.raw`S_t \;=\; S_{t-1} + v_t\, k_t^\top, \qquad o_t \;=\; S_t\, \phi(q_t)`

const LINEAGE: { model: string; year: string; update: ReactNode; idea: string }[] = [
  {
    model: 'Linear attention',
    year: '2020',
    update: <Math>{String.raw`S_t = S_{t-1} + v_t k_t^\top`}</Math>,
    idea: 'Additive outer products — never forgets anything',
  },
  {
    model: 'RetNet',
    year: '2023',
    update: <Math>{String.raw`S_t = \gamma\, S_{t-1} + v_t k_t^\top`}</Math>,
    idea: 'Fixed scalar exponential decay per head — “multi-scale retention”',
  },
  {
    model: 'GLA',
    year: '2023',
    update: <Math>{String.raw`S_t = \mathrm{diag}(\alpha_t)\, S_{t-1} + v_t k_t^\top`}</Math>,
    idea: 'Data-dependent vector gates: each channel forgets at its own rate',
  },
  {
    model: 'Mamba-2 / SSD',
    year: '2024',
    update: <Math>{String.raw`S_t = \alpha_t\, S_{t-1} + v_t k_t^\top`}</Math>,
    idea: 'Input-dependent scalar gate — an SSM in linear-attention clothing',
  },
  {
    model: 'DeltaNet',
    year: '2024',
    update: <Math>{String.raw`S_t = S_{t-1}\big(I - \beta_t k_t k_t^\top\big) + \beta_t v_t k_t^\top`}</Math>,
    idea: 'Delta rule: erase the old value stored at k, then write the new one',
  },
  {
    model: 'Gated DeltaNet',
    year: '2025',
    update: (
      <Math>{String.raw`S_t = \alpha_t S_{t-1}\big(I - \beta_t k_t k_t^\top\big) + \beta_t v_t k_t^\top`}</Math>
    ),
    idea: 'Global forgetting + targeted writes; beats Mamba-2 and DeltaNet on LM and recall',
  },
  {
    model: 'RWKV-7 “Goose”',
    year: '2025',
    update: <span className="font-mono text-[12.5px]">generalized delta rule</span>,
    idea: 'Vector-valued gates and in-context learning rates; recognizes all regular languages',
  },
  {
    model: 'Kimi Delta Attention',
    year: '2025',
    update: <span className="font-mono text-[12.5px]">gated delta + channel-wise gate</span>,
    idea: 'Fine-grained diagonal gating — an efficient special case of DPLR transitions',
  },
]

export default function LinearAttention() {
  return (
    <ModuleLayout
      slug="linear-attention"
      heroExtra={
        <Lede className="mt-5">
          Katharopoulos et al. put the thesis in the title — “Transformers are RNNs.” Swap the
          softmax for a feature map, reorder one matrix product, and attention becomes a
          recurrent net whose hidden state is a fixed d×d matrix: constant memory, O(1) per
          token, and a five-year argument about what fits inside it.
        </Lede>
      }
      chips={[
        'O(n²) → O(n)',
        'O(1) per decoded token',
        'state: d×d per head',
        'up to 4000× faster generation',
        '82% of the gap is recall',
        '3:1 hybrids ship in 2025',
      ]}
      references={[
        {
          label: 'Katharopoulos et al. 2020 — Transformers are RNNs (linear attention, elu+1, 4000x)',
          url: 'https://arxiv.org/abs/2006.16236',
        },
        {
          label: 'Choromanski et al. 2020/21 — Rethinking Attention with Performers (FAVOR+)',
          url: 'https://arxiv.org/abs/2009.14794',
        },
        {
          label: 'Sun et al. 2023 — Retentive Network (RetNet)',
          url: 'https://arxiv.org/abs/2307.08621',
        },
        {
          label: 'Yang et al. 2023 — Gated Linear Attention / FlashLinearAttention',
          url: 'https://arxiv.org/abs/2312.06635',
        },
        {
          label: 'Yang et al. 2024 — Parallelizing Linear Transformers with the Delta Rule (DeltaNet, WY/Householder)',
          url: 'https://arxiv.org/abs/2406.06484',
        },
        {
          label: 'Yang, Kautz, Hatamizadeh 2024 — Gated Delta Networks (Gated DeltaNet, ICLR’25)',
          url: 'https://arxiv.org/abs/2412.06464',
        },
        {
          label: 'Peng et al. 2023 — RWKV: Reinventing RNNs for the Transformer Era (14B)',
          url: 'https://arxiv.org/abs/2305.13048',
        },
        {
          label: 'Peng et al. 2025 — RWKV-7 “Goose” (generalized delta rule, vector gating)',
          url: 'https://arxiv.org/abs/2503.14456',
        },
        {
          label: 'Dao & Gu 2024 — Transformers are SSMs: State Space Duality (Mamba-2/SSD)',
          url: 'https://arxiv.org/abs/2405.21060',
        },
        {
          label: 'Arora et al. 2023 — Zoology: Measuring and Improving Recall (MQAR, 82% gap)',
          url: 'https://arxiv.org/abs/2312.04927',
        },
        {
          label: 'MiniMax 2025 — MiniMax-01: Scaling Foundation Models with Lightning Attention',
          url: 'https://arxiv.org/abs/2501.08313',
        },
        {
          label: 'MiniMax 2025 — MiniMax-M1: Scaling Test-Time Compute with Lightning Attention',
          url: 'https://arxiv.org/abs/2506.13585',
        },
        {
          label: 'Qwen team 2025 — Qwen3-Next blog (Gated DeltaNet 3:1 hybrid, 80B-A3B)',
        },
        {
          label: 'Moonshot AI 2025 — Kimi Linear: An Expressive, Efficient Attention Architecture (KDA, 3:1)',
          url: 'https://arxiv.org/abs/2510.26692',
        },
      ]}
      bare
    >
      {/* 01 — the debt and the kernel trick */}
      <Section id="m2-kernel-trick" variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">The debt · one forced matmul order</Eyebrow>
            <H2>2017 bought parallelism with a quadratic</H2>
            <Lede>
              The original transformer’s whole bet was to drop recurrence and compare every pair
              of positions at once. The fine print: the exponential inside softmax welds the
              computation to the (QKᵀ)V order — you must build the n×n score matrix before you
              can touch the values.
            </Lede>
            <Body>
              That is the debt this module pays down. Training compute scales as{' '}
              <Math>{String.raw`O(n^2 d)`}</Math>, and generation drags a KV cache that grows by
              two vectors per head, per layer, for every token produced. At 2017’s
              translation-sentence lengths this was invisible. At today’s million-token contexts
              it is the dominant cost of running the model.
            </Body>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="gray">2017 · softmax attention</Tag>
                <Math block>{SOFTMAX_EQ}</Math>
                <p>
                  The exponential of a dot product does not factor, so the n×n score matrix is
                  mandatory: O(n²) compute in training, a cache read of every past token at each
                  decode step.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">2020 · kernelized attention</Tag>
                <Math block>{LINEAR_EQ}</Math>
                <p>
                  Replace exp(qᵀk) with a decomposable similarity φ(q)ᵀφ(k) — Katharopoulos et
                  al. use φ(x) = elu(x) + 1 — and associativity lets you accumulate the sums
                  once: Q(KᵀV) instead of (QKᵀ)V. Total cost drops to O(n).
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Body className="mt-10">
              The reordering is more than a speedup — it changes what kind of machine you have.
              Because the sums accumulate token by token, there is an iterative form: per-token
              inference in O(1) time and O(1) memory, a constant-size state instead of a growing
              cache. The ICML 2020 paper reports up to 4000× faster autoregressive generation on
              very long sequences, at quality comparable to vanilla transformers on their
              benchmarks. A causal linear transformer <em>is</em> an RNN with a matrix-valued
              hidden state.
            </Body>
            <Body>
              Performer (Choromanski et al., ICLR 2021) took the other exit from the same
              constraint: FAVOR+ builds positive orthogonal random features whose inner products
              are a provably unbiased estimate of the true softmax kernel — linear time and
              space with no sparsity or low-rank priors. Positive features avoid the variance
              blowups of earlier random-feature attention; Gram–Schmidt orthogonalization
              tightens the estimate further.
            </Body>
            <Note>
              Historically important, both — but the field kept the linearity and dropped the
              softmax-imitation. The next five years were spent designing linear recurrences on
              their own terms.
            </Note>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Stat num="O(n)" label="total attention cost" accent="olive" />
              <Stat num="O(1)" label="per decoded token" accent="sky" />
              <Stat num="4000×" label="faster generation (up to) · 2020" accent="clay" />
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* 02 — the matrix-valued state and its lineage */}
      <Section id="m2-one-line" variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">The mechanism · fast weights</Eyebrow>
            <H2>Five years of edits to one line</H2>
            <Lede>
              Written as a recurrence, linear attention is an associative memory. Each token
              writes an outer product into a fixed matrix; each query reads it back out:
            </Lede>
            <Math block className="mt-4">
              {STATE_EQ}
            </Math>
            <Body>
              S is d×d per head and never grows. Every notable architecture since 2020 is a
              modification of this single update — read the table top to bottom and you watch the
              field learn to forget, then learn to erase.
            </Body>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left">
                <thead>
                  <tr className="font-display text-[11px] font-semibold tracking-[0.16em] uppercase text-(--note)">
                    <th className="pb-3 pr-5 font-semibold">Model</th>
                    <th className="pb-3 pr-5 font-semibold">Year</th>
                    <th className="pb-3 pr-5 font-semibold">State update</th>
                    <th className="pb-3 font-semibold">Key idea</th>
                  </tr>
                </thead>
                <tbody>
                  {LINEAGE.map((r) => (
                    <tr key={r.model} className="border-t border-(--card-line) align-top">
                      <td className="font-mono py-3.5 pr-5 text-[13px] whitespace-nowrap">{r.model}</td>
                      <td className="font-mono py-3.5 pr-5 text-[13px] text-(--note)">{r.year}</td>
                      <td className="py-3.5 pr-5 text-[14px] whitespace-nowrap text-(--soft)">{r.update}</td>
                      <td className="py-3.5 text-[14px] text-(--soft)">{r.idea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>
              DeltaNet’s update is the delta rule — one online gradient step on{' '}
              <Math>{String.raw`\|S k_t - v_t\|^2`}</Math>: erase whatever S currently returns
              for k, write the new value in its place. Gated DeltaNet’s finding is that gating
              (fast global erasure) and the delta rule (targeted writes) are complementary, not
              redundant.
            </Note>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="sky">Parallel lineage · RWKV</Tag>
                <p>
                  RWKV-4 (2023) scaled the recipe to 14B parameters — then the largest dense RNN
                  ever trained, on par with size-matched transformers. RWKV-5/6 “Eagle” and
                  “Finch” (2024) moved to matrix-valued states with data-dependent decay;
                  RWKV-7 “Goose” (2025) landed on the generalized delta rule. Convergent
                  evolution with the DeltaNet line, arrived at independently.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">Same family · SSMs</Tag>
                <p>
                  Dao and Gu’s state-space duality (2024): an SSM with a scalar-times-identity
                  transition is exactly masked linear attention with a 1-semiseparable causal
                  mask — the same model computes as an O(n) recurrence or an O(n²)
                  attention-style matmul. Set <Math>{String.raw`\alpha_t = 1`}</Math> and Mamba-2
                  collapses to causal linear attention, with B and C playing key and query.
                  Module M3 and this page describe one family from two directions.
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mt-12">
              <H3>Training without the recurrence tax</H3>
              <Body>
                A pure recurrence is sequential — hostile to GPUs. A pure parallel form is
                quadratic. The standard fix is RetNet’s chunkwise-recurrent paradigm: split the
                sequence into chunks, run exact attention inside each chunk on tensor cores, and
                hand a single recurrent state between chunks. GLA’s FlashLinearAttention made
                this hardware-efficient — faster than FlashAttention-2 even at short sequence
                lengths, trading memory movement against parallelism.
              </Body>
              <Body>
                The delta rule resisted longest: its{' '}
                <Math>{String.raw`\big(I - \beta_t k_t k_t^\top\big)`}</Math> factors are
                Householder-like matrices, and products of Householders do not chunk naively.
                The 2024 DeltaNet paper parallelized them with a memory-efficient WY
                representation — the enabling trick behind Gated DeltaNet, Qwen3-Next, and
                Kimi’s KDA.
              </Body>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* 03 — the recall wall */}
      <Section id="m2-recall-wall" variant="dark">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">The catch · measured 2023</Eyebrow>
            <H2>A fixed state is a lossy memory</H2>
            <Lede>
              A KV cache is lossless: every token ever seen can be retrieved exactly. A d×d
              matrix is a compressed memory with finite capacity. Zoology (Arora et al., 2023)
              measured what the compression costs.
            </Lede>
            <Body>
              Across 17 pretrained attention and gated-convolution models, the sub-quadratic
              architectures trail attention by up to 2.1 perplexity points on the Pile — and 82%
              of that gap is explained by a single skill: in-context recall of tokens the model
              has already seen. Their MQAR synthetic — store key–value pairs, then answer
              multiple queries about them — became the field’s standard diagnostic. On it, a
              70M-parameter attention model beats a 1.4B gated-convolution model.
            </Body>
            <Body>
              The verdict: state size, not architectural cleverness, is the binding constraint.
              Delta-rule variants and state expansion narrow the gap; they do not close it. But
              Zoology had a second finding — hybrids with input-dependent sparse attention close
              about 97.4% of the gap while staying sub-quadratic. That sentence, written in
              2023, is the 2025 production recipe.
            </Body>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat num="2.1" label="ppl gap on the Pile" accent="clay" />
              <Stat num="82%" label="of gap = in-context recall" accent="clay" />
              <Stat num="70M" label="attention beats 1.4B conv" accent="sky" />
              <Stat num="97.4%" label="closed by sparse hybrids" accent="olive" />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="gray">Training compute</Tag>
                <p>
                  Softmax: <Math>{String.raw`O(n^2 d)`}</Math>. Linear, chunkwise:{' '}
                  <Math>{String.raw`O(n d^2)`}</Math>. The linear side wins once the sequence is
                  longer than the head dimension — which is every sequence that matters.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">Decoding</Tag>
                <p>
                  Softmax: <Math>{String.raw`O(nd)`}</Math> per token, reading a cache that grows
                  with the conversation. Linear: <Math>{String.raw`O(d^2)`}</Math> per token,
                  same cost at token ten or token ten million.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">Memory</Tag>
                <p>
                  Softmax: an <Math>{String.raw`O(n)`}</Math> KV cache — two vectors per head per
                  layer per token. Linear: one d×d state per head,{' '}
                  <Math>{String.raw`O(d^2)`}</Math>, independent of context length.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">Capability</Tag>
                <p>
                  Softmax: lossless random-access lookup. Linear: fixed-capacity associative
                  memory. The MQAR gap lives here — gates and delta rules narrow it, hybrids
                  sidestep it.
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="mt-5">
              <Tag accent="olive">The expressivity twist</Tag>
              <p>
                Weaker at recall is not weaker, full stop. Delta-rule recurrences — DeltaNet’s
                products of generalized Householder matrices, RWKV-7’s generalized delta rule —
                can do state tracking beyond TC⁰: RWKV-7 can recognize all regular languages,
                which transformers cannot under standard complexity conjectures. In a formal
                sense these models are more expressive than the architecture they are chasing,
                while losing to it at lookup.
              </p>
            </Card>
          </Reveal>
        </Wrap>
      </Section>

      {/* 04 — interactive: fixed state vs growing cache */}
      <Section id="m2-demo" variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">Interactive · the core idea</Eyebrow>
            <H2>Watch a fixed memory fill up</H2>
            <Lede>
              Stream 24 key–value pairs into two memories. The softmax path appends each pair to
              a cache that grows without bound. The linear path folds every pair into the same
              8×8 matrix — and then we quiz it: for each stored key, does S·k still point at the
              right value?
            </Lede>
            <Body>
              Switch the update rule to replay the lineage table. Additive writes crowd each
              other out; decay buys the newest pairs back by forgetting the oldest; the delta
              rule erases before it writes. Nothing rescues everything — the matrix holds 64
              numbers, and you are asking it to hold more.
            </Body>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10">
              <LinearAttentionMemory />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Note>
              Here d = 8, against d_k = {PAPER.dK} per head in the 2017 base model — but the
              crowding you are watching is the same phenomenon MQAR measures at full scale.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* 05 — state of play */}
      <Section id="m2-hybrids" variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">State of play · 2026</Eyebrow>
            <H2>Hybrids shipped: keep a little softmax</H2>
            <Lede>
              Production’s answer to the recall wall is a ratio, not a religion. A minority of
              full softmax layers act as precise retrieval hardware; linear layers everywhere
              else make prefill and decoding cheap and the KV cache small.
            </Lede>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="clay">MiniMax-01 · Jan 2025</Tag>
                <p>
                  First at scale: an MoE with 456B total / 45.9B activated parameters across 80
                  layers — 7 lightning-attention (linear) layers for every softmax layer.
                  Trained at 1M context, extrapolates to 4M tokens at inference. MiniMax-M1
                  (2025) scales test-time compute on the same substrate.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Qwen3-Next · Sept 2025</Tag>
                <p>
                  80B-A3B: three Gated DeltaNet blocks per full (gated) attention block — 75% of
                  the stack is linear, with roughly 3B of 80B parameters active. Per Qwen’s blog
                  it outperforms Qwen3-30B and even Qwen3-235B on RULER within 256K context.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">Kimi Linear · Oct 2025</Tag>
                <p>
                  Kimi Delta Attention: Gated DeltaNet plus finer per-channel gates, an efficient
                  special case of DPLR transitions. Uniform 3:1 KDA:MLA layers, 48B total / 3B
                  activated. Claims to beat full attention under fair comparison across
                  short-context, long-context, and RL regimes — with up to 75% less KV cache and
                  up to 6× decoding throughput at 1M context.
                </p>
              </Card>
            </div>
            <Note>
              One hedge: reports that MiniMax’s later M-series moved some models back toward
              full attention are unverified — the right ratio is a live debate, not settled
              doctrine.
            </Note>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat num="3:1" label="linear : full sweet spot" accent="olive" />
              <Stat num="7:1" label="MiniMax-01’s ratio" accent="clay" />
              <Stat num="75%" label="KV cache cut · Kimi" accent="sky" />
              <Stat num="6×" label="decode speedup @ 1M ctx" accent="olive" />
            </div>
            <Body className="mt-10">
              Which is where the 2017 debt gets refinanced rather than repaid. The transformer
              dropped recurrence to train in parallel, then paid for it at every decode step
              forever. Linear attention’s mature form takes both sides of the trade: train like
              attention — chunkwise, dense matmuls on tensor cores — and decode like an RNN,
              one constant d×d state per head. “Transformers are RNNs” began as a title in 2020.
              By 2026 it reads as a deployment strategy.
            </Body>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
