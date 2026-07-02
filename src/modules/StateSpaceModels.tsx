import { ModuleLayout } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede, Body, Note } from '../components/Type'
import { Reveal } from '../components/Reveal'
import { Card, Tag, Stat } from '../components/Card'
import { Math } from '../components/Math'
import { TWOTOWER } from '../data/paper'
import { SelectivitySandbox } from './widgets/state-space-models-selectivity'

const REFERENCES = [
  {
    label: 'HiPPO: Recurrent Memory with Optimal Polynomial Projections (Gu et al., 2020)',
    url: 'https://arxiv.org/abs/2008.07669',
  },
  {
    label: 'S4: Efficiently Modeling Long Sequences with Structured State Spaces (Gu, Goel, Ré, 2021)',
    url: 'https://arxiv.org/abs/2111.00396',
  },
  {
    label: 'Long Range Arena benchmark (Tay et al., 2020)',
    url: 'https://arxiv.org/abs/2011.04006',
  },
  {
    label: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces (Gu & Dao, 2023)',
    url: 'https://arxiv.org/abs/2312.00752',
  },
  {
    label: 'Transformers are SSMs: State Space Duality / Mamba-2 (Dao & Gu, ICML 2024)',
    url: 'https://arxiv.org/abs/2405.21060',
  },
  {
    label: 'Tri Dao blog: Mamba-2 Part 1 — The Model (SSD details)',
    url: 'https://tridao.me/blog/2024/mamba2-part1-model/',
  },
  {
    label: 'Repeat After Me: Transformers are Better than SSMs at Copying (Jelassi et al., 2024)',
    url: 'https://arxiv.org/abs/2402.01032',
  },
  {
    label: 'An Empirical Study of Mamba-based Language Models (NVIDIA, 2024)',
    url: 'https://arxiv.org/abs/2406.07887',
  },
  {
    label: 'Jamba: A Hybrid Transformer-Mamba Language Model (AI21, 2024)',
    url: 'https://arxiv.org/abs/2403.19887',
  },
  {
    label: 'Zamba: A Compact 7B SSM Hybrid Model (Zyphra, 2024)',
    url: 'https://arxiv.org/abs/2405.16712',
  },
  {
    label: 'Nemotron-H: Accurate and Efficient Hybrid Mamba-Transformer Models (NVIDIA, 2025)',
    url: 'https://arxiv.org/abs/2504.03624',
  },
  {
    label: 'Falcon-H1 Technical Report (TII, 2025)',
    url: 'https://arxiv.org/abs/2507.22448',
  },
  {
    label: 'IBM Granite 4.0 announcement (hybrid Mamba-2/Transformer, Oct 2025)',
    url: 'https://www.ibm.com/new/announcements/ibm-granite-4-0-hyper-efficient-high-performance-hybrid-models',
  },
]

export default function StateSpaceModels() {
  return (
    <ModuleLayout
      slug="state-space-models"
      heroExtra={
        <Lede className="mt-5">
          Attention buys perfect recall and pays for it on every token. State-space models make
          the opposite bet — a fixed-size state pushed forward by a recurrence — and spent
          2020–2025 learning how to win with it.
        </Lede>
      }
      chips={[
        'state = O(N·d), not O(T)',
        'LRA avg 59.37 → 86.09',
        'Path-X @16K: first solve',
        'Mamba: 5× decode throughput',
        '≈8% attention is enough',
        'KV @256K: 4 GB vs 32 GB',
      ]}
      references={REFERENCES}
      bare
    >
      {/* 01 — the debt + the mechanism */}
      <Section variant="paper" id="ssm-debt">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">The debt · compute</Eyebrow>
            <H2>Recurrence was fired in 2017. This is its rehiring.</H2>
            <Lede>
              The Transformer’s founding move was to delete the RNN’s sequential state so training
              could parallelize — and let attention recompute every pairwise interaction instead.
              That decision prices context quadratically, twice: O(T²) compute in training and
              prefill, plus a KV cache that grows with every generated token at inference.
            </Lede>
            <Body>
              State-space models are the most radical repayment plan for that debt. Keep what 2017
              got right — parallel training over the whole sequence — but bring back a recurrent
              state of fixed size, and make it mathematically obligated to remember well. The
              starting point is a control-theory classic: a linear, time-invariant system mapping
              a 1-D input signal <Math>{String.raw`u(t)`}</Math> to an output{' '}
              <Math>{String.raw`y(t)`}</Math> through an N-dimensional latent state{' '}
              <Math>{String.raw`x(t)`}</Math>.
            </Body>
          </Reveal>

          <Reveal className="mt-8">
            <Math block>
              {String.raw`x'(t) = A\,x(t) + B\,u(t), \qquad y(t) = C\,x(t) + D\,u(t)`}
            </Math>
            <Body>
              Token sequences are not continuous, so the ODE is discretized with a step size{' '}
              <Math>{String.raw`\Delta`}</Math> — the zero-order-hold rule used by S4 and Mamba —
              turning it into a linear recurrence:
            </Body>
            <Math block>
              {String.raw`h_t = \bar{A}\,h_{t-1} + \bar{B}\,u_t, \qquad \bar{A} = e^{\Delta A}, \qquad \bar{B} = (\Delta A)^{-1}\!\left(e^{\Delta A} - I\right)\Delta B`}
            </Math>
            <Body>
              <Math>{String.raw`\Delta`}</Math> is the knob to watch. Large{' '}
              <Math>{String.raw`\Delta`}</Math> makes <Math>{String.raw`e^{\Delta A}`}</Math>{' '}
              contract hard — the state resets toward the current input. Small{' '}
              <Math>{String.raw`\Delta`}</Math> leaves the state nearly untouched — memory
              persists. Two years after S4, this same discretization parameter becomes Mamba’s
              gate.
            </Body>
          </Reveal>

          <Reveal className="mt-12">
            <H3>One model, three faces</H3>
            <Body>
              While <Math>{String.raw`(A, B)`}</Math> stay fixed — time-invariant — the recurrence
              unrolls into a global convolution over the input:
            </Body>
            <Math block>
              {String.raw`y = \bar{K} * u, \qquad \bar{K} = \left(C\bar{B},\ C\bar{A}\bar{B},\ C\bar{A}^{2}\bar{B},\ \dots\right)`}
            </Math>
            <Body>
              That duality is what dissolves the RNN’s training problem: train as a convolution —
              parallel, FFT-fast, the whole sequence at once — and infer as a recurrence, with
              O(1) memory and compute per generated step. Same weights, two execution modes,
              neither of them quadratic.
            </Body>
          </Reveal>

          <Reveal className="mt-12">
            <Card className="max-w-[62ch]">
              <Tag accent="olive">The memory theorem</Tag>
              <H3>HiPPO — Gu et al., NeurIPS 2020</H3>
              <p>
                A naive random A collapses on long sequences. HiPPO — High-order Polynomial
                Projection Operators — derives A so the state stores the coefficients of an
                optimal Legendre-polynomial projection of the entire input history: compression as
                a theorem, not a hope. The LegS variant scales its measure over the full history —
                no timescale prior, bounded gradients — and hit 98.3% on permuted MNIST, then
                state of the art.
              </p>
              <Math block className="mt-3">
                {String.raw`A_{nk} = \begin{cases} -(2n+1)^{1/2}(2k+1)^{1/2} & n > k \\ -(n+1) & n = k \\ 0 & n < k \end{cases}`}
              </Math>
              <p>This exact matrix is what S4 later uses as its initialization.</p>
            </Card>
            <Note>
              Hold onto the shape of this idea: the state is a lossy, fixed-size, provably good
              summary of everything seen so far. S4’s wins, Mamba’s failure modes, and the 2025
              hybrids all follow from it.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* 02 — S4 and Long Range Arena */}
      <Section variant="tint" id="ssm-s4">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">2020 → 2021</Eyebrow>
            <H2>S4 cracks Long Range Arena</H2>
            <Lede>
              Computing with a dense HiPPO matrix is prohibitively expensive. S4 — Gu, Goel &amp;
              Ré, 2021 — noticed the matrix is normal-plus-low-rank: a diagonal part plus a
              low-rank correction. That structure allows stable diagonalization and collapses the
              convolution-kernel computation to a Cauchy-kernel evaluation. It earned an
              Outstanding Paper honorable mention at ICLR 2022.
            </Lede>
            <Body>
              The proving ground was Long Range Arena (Tay et al., 2020): six tasks spanning 1K to
              16K tokens, designed to stress-test efficient Transformers. Vanilla Transformers
              averaged in the mid-50s; the best prior score, from an efficient-Transformer
              variant, was 59.37%.
            </Body>
          </Reveal>

          <Reveal className="mt-10">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="86.09%" label="LRA average — from 59.37%" accent="olive" />
              <Stat num="88.1%" label="Path-X @16,384 — first solve" accent="clay" />
              <Stat num="91%" label="seq. CIFAR-10, no augmentation" accent="sky" />
              <Stat num="~60×" label="faster autoregressive generation" accent="olive" />
            </div>
          </Reveal>

          <Reveal className="mt-8">
            <Body>
              Path-X is the flag on the summit: pathfinder at sequence length 16,384, where every
              prior model — every one — scored 50%, exactly chance. S4 posted 88.1% in the
              original paper; later S4 variants pushed it to roughly 96.35%.
            </Body>
            <Note>
              Read the benchmark carefully, though. LRA rewards compressed long-range memory — the
              precise thing a HiPPO-initialized LTI system provides — rather than token-precise
              lookup. That distinction comes back with interest in a moment.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* 03 — Mamba + Mamba-2 (dark beat) */}
      <Section variant="dark" id="ssm-mamba">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">December 2023</Eyebrow>
            <H2>Mamba lets the input drive the state</H2>
            <Lede>
              Gu &amp; Dao’s diagnosis: a time-invariant SSM applies the same{' '}
              <Math>{String.raw`\bar{A}, \bar{B}`}</Math> to every token, so it cannot do
              content-based reasoning — it can’t decide, per token, what to store and what to
              ignore, and it fails even synthetic selective-copying and induction tasks. The fix
              is the S6 layer: make the parameters functions of the input.
            </Lede>
          </Reveal>

          <Reveal className="mt-8">
            <Math block>
              {String.raw`\begin{aligned} B_t &= W_B\,x_t, \qquad C_t = W_C\,x_t, \qquad \Delta_t = \operatorname{softplus}(W_\Delta\,x_t + b_\Delta) \\[3pt] h_t &= \bar{A}_t\,h_{t-1} + \bar{B}_t\,x_t, \qquad y_t = C_t\,h_t, \qquad \bar{A}_t = e^{\Delta_t A} \end{aligned}`}
            </Math>
            <Body>
              <Math>{String.raw`\Delta_t`}</Math> — softplus keeps it positive — is now a learned,
              per-token gate. Large <Math>{String.raw`\Delta_t`}</Math>: overwrite the state with
              the current token. Small <Math>{String.raw`\Delta_t`}</Math>: hold what you have and
              let the token slide past. A discretization step from classical control theory reappears
              as the selection mechanism — doing the job of attention’s query-key dot products
              with O(1) state.
            </Body>
          </Reveal>

          <Reveal className="mt-10">
            <div className="grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="clay">What it gives up</Tag>
                <p>
                  Input-dependent parameters break time invariance, so the convolution view — and
                  FFT training — is gone. The replacement: a hardware-aware parallel associative
                  scan that computes the recurrence across the whole sequence at once,
                  materializing the expanded state only in GPU SRAM, never in slow HBM. Training
                  stays parallel; cost stays linear.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">What it deletes</Tag>
                <p>
                  No attention. No MLP blocks. One homogeneous gated-SSM block, stacked end to
                  end. And no positional encoding at all: the recurrence is causal and ordered by
                  construction, so position lives in the state dynamics.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">What it posted</Tag>
                <p>
                  5× generation throughput over Transformers and linear scaling to million-token
                  sequences. Mamba-3B beats same-size Transformers and matches ones roughly twice
                  its size on pretraining perplexity and downstream evals — across language,
                  audio, and genomics.
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <H3>Mamba-2 — “Transformers are SSMs”</H3>
            <Body>
              A year later (Dao &amp; Gu, ICML 2024), the duality: a selective SSM’s sequence
              transformation is multiplication by a semiseparable matrix, and for the SSD subclass
              it has a quadratic, attention-shaped dual form:
            </Body>
            <Math block>
              {String.raw`y = M x, \qquad M = L \circ \left(C B^{\top}\right), \qquad L_{tj} = \prod_{k=j+1}^{t} a_k`}
            </Math>
            <Body>
              L is a lower-triangular mask of cumulative decay products. Set every{' '}
              <Math>{String.raw`a_k = 1`}</Math> and L becomes the plain causal mask — you recover
              causal linear attention exactly, with{' '}
              <Math>{String.raw`C \leftrightarrow Q,\ B \leftrightarrow K,\ x \leftrightarrow V`}</Math>
              . SSD restricts Mamba-1’s per-channel diagonal <Math>{String.raw`A_t`}</Math> to one
              scalar per head — a small expressivity trade that turns the whole computation into
              the block matrix multiplications tensor cores are built for. The core layer runs
              2–8× faster than Mamba-1’s scan, the state grows from N=16 to N=64–256 at similar
              cost, and the layer goes multi-head (head dim 64/128, versus effectively 1 before).
            </Body>
            <Note>
              That matrix M is not an abstraction. It is the exact object drawn, cell by cell, in
              the sandbox below.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* 04 — interactive sandbox + tradeoffs */}
      <Section variant="paper" id="ssm-sandbox">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">Interactive</Eyebrow>
            <H2>The selectivity sandbox</H2>
            <Lede>
              Every cell (t, j) shows how much of token j is still legible in the state at step t
              — the decay mask <Math>{String.raw`L \circ (C B^{\top})`}</Math> with scalar gates —
              next to attention’s answer to the same question. Click the Δ strip.
            </Lede>
          </Reveal>

          <Reveal className="mt-10">
            <SelectivitySandbox />
          </Reveal>

          <Reveal className="mt-8">
            <Body>
              What to try: switch to time-invariant mode and drag Δ — everything fades on a single
              exponential clock. That is the S4 world, and the reason Long Range Arena fell to it.
              Switch back to selective and open a gate: history flushes, the new token writes in
              strongly, and each row now remembers back exactly to its last reset. “All flush”
              collapses the mask to its diagonal — an amnesiac that knows only the present. “All
              hold” writes almost nothing at all. Selection is choosing where to forget.
            </Body>
          </Reveal>

          <Reveal className="mt-14">
            <H3>Lossy by design</H3>
            <Body>
              The right panel never changes — that is the point. Attention keeps a lossless,
              token-addressable cache: any past token, retrievable exactly, at O(T) memory. The
              SSM keeps a lossy fixed-size summary. “Repeat After Me” (Jelassi et al., 2024) made
              the gap a theorem: a two-layer Transformer can copy exponentially long strings,
              while any fixed-state-size generalized SSM cannot copy strings longer than its state
              can hold — and empirically, pretrained Transformers dramatically outperform
              state-space models at copying and retrieving information from context.
            </Body>
            <Body>
              NVIDIA’s controlled study (2024) located the gap precisely: pure Mamba and Mamba-2
              models at 8B scale hang with Transformers almost everywhere — except 5-shot MMLU,
              phonebook-style lookup, and copying, exactly the tasks that demand verbatim
              retrieval from context. Great for gist; bad for needle-grade recall.
            </Body>
          </Reveal>
        </Wrap>
      </Section>

      {/* 05 — hybrids / state of play */}
      <Section variant="tint" id="ssm-hybrids">
        <Wrap>
          <Reveal>
            <Eyebrow accent="olive">2024 → 2025 · state of play</Eyebrow>
            <H2>The hybrid consensus: a little attention goes a long way</H2>
            <Lede>
              The field converged fast: build the stack mostly out of Mamba layers, then
              interleave a handful of full-attention layers to restore random-access retrieval.
              The quality-versus-efficiency sweet spot lands around one attention layer per five
              to nine — and the hybrids often beat pure Transformers at equal size.
            </Lede>
          </Reveal>

          <Reveal className="mt-10">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="1 : 7" label="attention : Mamba — Jamba" accent="olive" />
              <Stat num="+2.65" label="hybrid vs Transformer, 12-task avg" accent="clay" />
              <Stat num="4 GB" label="Jamba KV @256K — Mixtral: 32 GB" accent="sky" />
              <Stat num=">70%" label="memory cut — Granite 4.0 serving" accent="olive" />
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="olive">AI21 · Mar 2024</Tag>
                <H3>Jamba</H3>
                <div className="font-mono mb-3 text-[12.5px] text-(--note)">
                  1 : 7 attn : Mamba · MoE every 2 layers
                </div>
                <p>
                  52B total, 12B active; 256K context on a single 80 GB GPU; KV cache at 256K
                  around 4 GB versus Mixtral’s 32 GB, and roughly 3× Mixtral’s throughput at long
                  context. The ablation that set the norm: 1:3 attention was no better than 1:7,
                  so the cheaper mix won — and pure Mamba failed format-following tasks the hybrid
                  solved.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Zyphra · May 2024</Tag>
                <H3>Zamba</H3>
                <div className="font-mono mb-3 text-[12.5px] text-(--note)">
                  1 shared attention block per 6 Mamba blocks
                </div>
                <p>
                  A 7B network trained on ~1T tokens (≈950B phase one plus ~50B annealing) that
                  reuses one set of attention parameters across the whole depth, fed each layer’s
                  residual concatenated with the original embeddings — global retrieval at minimal
                  parameter cost.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">NVIDIA · Jun 2024</Tag>
                <H3>Mamba-2-Hybrid</H3>
                <div className="font-mono mb-3 text-[12.5px] text-(--note)">
                  7% attention · 43% Mamba-2 · 50% MLP
                </div>
                <p>
                  The canonical how-much-attention-do-you-need ablation. At 8B it beats an 8B
                  Transformer baseline on all 12 standard tasks (+2.65 average),
                  matches or exceeds it on 23 long-context tasks out to 128K, and was predicted to
                  generate tokens up to 8× faster.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">NVIDIA · Apr 2025</Tag>
                <H3>Nemotron-H</H3>
                <div className="font-mono mb-3 text-[12.5px] text-(--note)">
                  ≈92% of attention layers swapped for Mamba-2
                </div>
                <p>
                  8B, 47B, and 56B models with accuracy on par with the Qwen-2.5 / Llama-3.1 class
                  at up to 3× faster inference. The 47B — distilled and pruned via MiniPuzzle —
                  runs 20% faster than the 56B, on an FP8 training recipe.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">TII · Jul 2025</Tag>
                <H3>Falcon-H1</H3>
                <div className="font-mono mb-3 text-[12.5px] text-(--note)">
                  parallel hybrid — attn ∥ SSM heads in every block
                </div>
                <p>
                  Instead of interleaving layers, attention heads and Mamba-2 heads run side by
                  side inside every block, with a tunable channel ratio. 0.5B to 34B, 256K
                  context, 18 languages; the 34B matches or outperforms Qwen2.5-72B and
                  Llama3.3-70B on many benchmarks.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">IBM · Oct 2025</Tag>
                <H3>Granite 4.0</H3>
                <div className="font-mono mb-3 text-[12.5px] text-(--note)">
                  9 : 1 Mamba-2 : attention · NoPE
                </div>
                <p>
                  H-Small at 32B total / 9B active MoE, down to a 3B dense micro — with no
                  positional encodings anywhere: the Mamba layers carry position, which also helps
                  length extrapolation. IBM reports over 70% memory reduction for long-context and
                  concurrent-session inference.
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <Body>
              Why do so few attention layers suffice? Because recall only needs <em>some</em>{' '}
              layers with token-precise random access. Once a few of them provide the lossless
              cache, the Mamba layers handle the rest of the sequence mixing at constant memory —
              and the KV bill scales only with the attention fraction. NVIDIA’s +2.65 says the two
              mixers are complementary, not one patching the other.
            </Body>
            <Note>
              This isn’t hypothetical for this seminar: Module M4’s Nemotron TwoTower ships this
              exact consensus — {TWOTOWER.mamba2Layers} Mamba-2 layers and{' '}
              {TWOTOWER.attentionLayers} attention layers in each {TWOTOWER.layersPerTower}-layer
              tower.
            </Note>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
