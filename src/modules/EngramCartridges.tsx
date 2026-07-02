import { Fragment } from 'react'
import { ModuleLayout } from '../components/ModuleLayout'
import type { Reference } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede, Body, Note } from '../components/Type'
import { Card, Tag, Stat } from '../components/Card'
import { Reveal } from '../components/Reveal'
import { Math } from '../components/Math'
import { PAPER } from '../data/paper'
import EngramCartridgesLadder from './widgets/engram-cartridges-ladder'

const CHIPS = [
  '84 GB · KV @ 128k · Llama-70B',
  '38.6× less memory · 26.4× throughput',
  'O(1) hashed n-gram lookup',
  'MMLU +3.0 · iso-params, iso-FLOPs',
  '100B table off-GPU · ≤2.8% cost',
  'arXiv 2506.06266 · 2601.07372',
]

const REFERENCES: Reference[] = [
  {
    label:
      'Cartridges: Lightweight and general-purpose long context representations via self-study (arXiv:2506.06266, abs)',
    url: 'https://arxiv.org/abs/2506.06266',
  },
  {
    label: 'Cartridges paper PDF (v3, full text read for numbers)',
    url: 'https://arxiv.org/pdf/2506.06266',
  },
  {
    label: 'HazyResearch/cartridges GitHub repository',
    url: 'https://github.com/HazyResearch/cartridges',
  },
  {
    label: 'Scaling Intelligence Lab — Cartridges project page',
    url: 'https://scalingintelligence.stanford.edu/pubs/cartridges/',
  },
  {
    label:
      'Conditional Memory via Scalable Lookup: A New Axis of Sparsity for LLMs (DeepSeek Engram, arXiv:2601.07372, abs)',
    url: 'https://arxiv.org/abs/2601.07372',
  },
  {
    label: 'Engram paper HTML (v1, full text read for numbers)',
    url: 'https://arxiv.org/html/2601.07372v1',
  },
  {
    label: 'deepseek-ai/Engram GitHub repository',
    url: 'https://github.com/deepseek-ai/Engram',
  },
  {
    label: 'Anthropic prompt caching documentation (pricing multipliers, TTL, minimums)',
    url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching',
  },
]

const ENGRAM_BENCH: { name: string; base: number; engram: number }[] = [
  { name: 'MMLU', base: 57.4, engram: 60.4 },
  { name: 'CMMLU', base: 57.9, engram: 61.9 },
  { name: 'BBH', base: 50.9, engram: 55.9 },
  { name: 'ARC-Challenge', base: 70.1, engram: 73.8 },
  { name: 'HumanEval', base: 37.8, engram: 40.8 },
  { name: 'MATH', base: 28.3, engram: 30.7 },
  { name: 'Multi-Query NIAH', base: 84.2, engram: 97.0 },
]

const TIMELINE: { date: string; text: string }[] = [
  {
    date: 'Jun 2017',
    text: `Vaswani et al., “Attention Is All You Need” (${PAPER.venue}). Two memory tiers ship: weights, learned once and frozen, and attention over the live sequence — perfect recall, paid per request.`,
  },
  {
    date: 'Jun 6, 2025',
    text: 'Eyuboglu, Ehrlich, Arora, Guha and colleagues — Stanford Hazy Research / Scaling Intelligence, with Caltech and U. Buffalo — post Cartridges (arXiv:2506.06266; v3 Jun 13). Trainable KV caches plus the self-study recipe; code at HazyResearch/cartridges, paper models Llama-3.2-3B and Llama-3.1-8B, repo examples on Qwen3-4B.',
  },
  {
    date: 'Jan 12, 2026',
    text: 'Xin Cheng and thirteen co-authors — DeepSeek-AI and Peking University — post Engram (arXiv:2601.07372): conditional memory via scalable lookup, a new sparsity axis. Code released Apache-2.0 at deepseek-ai/Engram; the paper describes Engram-27B and Engram-40B research models.',
  },
]

/** M6 deep dive: Cartridges (Stanford, 2025) and Engram (DeepSeek, 2026). */
export default function EngramCartridges() {
  return (
    <ModuleLayout
      slug="engram-cartridges"
      chips={CHIPS}
      references={REFERENCES}
      heroExtra={
        <Lede className="mt-5">
          Two papers, seven months apart, build the tier the 2017 architecture never had.
          Stanford’s Cartridges compresses context <em>downward</em> into a trained artifact;
          DeepSeek’s Engram grows weights <em>upward</em> into a hashed lookup table. Same
          diagnosis, opposite ends.
        </Lede>
      }
      bare
    >
      {/* 01 — the debt */}
      <Section variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">The debt · from Part 08</Eyebrow>
            <H2>The 2017 transformer has exactly two memories</H2>
            <Lede>
              Vaswani et al. gave the model two places to keep what it knows. Weights —{' '}
              {PAPER.paramsBase} parameters in the base model, learned once over{' '}
              {PAPER.endeSentencePairs} sentence pairs on {PAPER.gpus}s, frozen at deployment,
              amortized across every user. And attention over the live sequence — a perfect,
              lossless record of the current request that dies when the request does.
            </Lede>
          </Reveal>
          <Reveal>
            <Body>
              The second memory has a rent bill. Serving attention means materializing keys and
              values for every context token at every layer — the KV cache:
            </Body>
            <Math block className="mt-3">
              {String.raw`M_{\mathrm{KV}} \;=\; 2 \, L \, n_{\mathrm{ctx}} \, d \, b`}
            </Math>
            <Note>
              two tensors (K and V) · L layers · width d · b bytes per value — linear in{' '}
              <Math>{String.raw`n_{\mathrm{ctx}}`}</Math>.
            </Note>
            <Body>
              Concretely, per the Cartridges paper: Llama-70B holding a <em>single</em>{' '}
              128k-token context carries 84 GB of 16-bit KV, and Llama-8B’s peak throughput on
              one H100 collapses 77× as context grows from 1k to 128k tokens.
            </Body>
            <Body>
              So everything a deployment reuses across many requests — the codebase, the patient
              file, the grammar textbook — has no native home. Too specific and fresh to bake
              into weights; too expensive to re-prefill on every request. That is the gap. Two
              projects from 2025–26 build the missing middle tier, from opposite directions.
            </Body>
          </Reveal>
          <Reveal>
            <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Stat num="2" label="native memory tiers, 2017" accent="clay" />
              <Stat num="84 GB" label="KV @ 128k · Llama-70B, 16-bit" accent="sky" />
              <Stat num="77×" label="throughput drop, 1k → 128k · Llama-8B" accent="olive" />
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* 02 — cartridges */}
      <Section variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">Downward from context · Jun 2025</Eyebrow>
            <H2>Cartridges: a KV cache you train, once per corpus</H2>
            <Lede>
              Eyuboglu and colleagues at Stanford asked the obvious-in-hindsight question: if a
              corpus will be queried thousands of times, why pay prefill thousands of times?
              Train a small KV cache offline instead — a <em>cartridge</em> — and load it at
              inference like any cached prefix.
            </Lede>
          </Reveal>
          <Reveal>
            <Body>
              The parameterization is simplified prefix-tuning: trainable key and value vectors{' '}
              <Math>{String.raw`z_K, z_V \in \mathbb{R}^{p \times d}`}</Math> at every layer, so
              the full artifact is{' '}
              <Math>{String.raw`Z \in \mathbb{R}^{L \times p \times d \times 2}`}</Math> with all
              model weights frozen. A cartridge replaces{' '}
              <Math>{String.raw`n_{\mathrm{ctx}}`}</Math> in the memory bill with a trained{' '}
              <Math>{String.raw`p \ll n_{\mathrm{ctx}}`}</Math>. One trick makes direct
              optimization stable: initialize <Math>Z</Math> to the actual KV cache of the first{' '}
              <Math>p</Math> corpus tokens — no MLP reparameterization needed.
            </Body>
            <Body>
              What you cannot do is train <Math>Z</Math> with naive next-token prediction on the
              corpus — that is not competitive with in-context learning. The recipe that works,{' '}
              <em>self-study</em>, has two moves.
            </Body>
          </Reveal>
          <Reveal>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="sky">self-study ① synthetic conversations</Tag>
                <p>
                  Chunk the corpus into 512–4,096-token subcorpora and let two copies of the
                  model converse about each chunk, kicked off by one of five generic seed-prompt
                  types: structuring, summarization, question, use-cases, creative. Nothing
                  corpus-specific — yet seed diversity alone is worth up to +4.8 accuracy points
                  on LongHealth (43.6 → 48.4).
                </p>
              </Card>
              <Card>
                <Tag accent="sky">self-study ② context distillation</Tag>
                <p>
                  The teacher is the same frozen model <em>with the chunk in context</em>; the
                  student sees only the cartridge. Train <em>Z</em> to minimize the KL divergence
                  between their next-token distributions — distilling the context into the
                  artifact.
                </p>
              </Card>
            </div>
            <Math block className="mt-8">
              {String.raw`\mathcal{L}(Z) \;=\; \mathbb{E}_{x \sim \mathcal{D}_{\mathrm{train}}} \sum_{t} D_{\mathrm{KL}}\!\Big( F\big(\cdot \mid \tilde{c} \oplus x_{<t}\big) \;\Big\|\; F_{Z}\big(\cdot \mid x_{<t}\big) \Big)`}
            </Math>
            <Note>
              F is the frozen model, <Math>{String.raw`\tilde{c}`}</Math> the corpus chunk in the
              teacher’s context, <Math>{String.raw`F_Z`}</Math> the same model reading the
              cartridge instead.
            </Note>
          </Reveal>
          <Reveal>
            <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat num="38.6×" label="less memory at ICL quality" accent="sky" />
              <Stat num="26.4×" label="peak throughput · SGLang, 1×H100" accent="clay" />
              <Stat num="10–100×" label="cache shrink · LongHealth → QASPER" accent="olive" />
              <Stat num="~30 min" label="self-study · 8×H100, Llama-8B" accent="sky" />
            </div>
            <Body>
              The averages hide the range: at matched quality the cache shrinks up to 10× on
              LongHealth and up to 100× on QASPER — an order of magnitude beyond KV-compression
              baselines like DuoAttention. Against memory-matched LoRA, the trainable-KV
              parameterization wins by +4.5 chrF at ~0.6 GB on MTOB, and it keeps scaling
              gracefully from 0.15 to 1.06 GB where LoRA degrades.
            </Body>
          </Reveal>
          <Reveal>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="clay">context extrapolation</Tag>
                <p>
                  On MTOB — Kalamang → English translation — a cartridge is trained on the full
                  484k-token grammar textbook, 356k tokens past Llama-8B’s 128k window. It beats
                  ICL over the first 130k tokens by +11.0 chrF and matches ICL given the
                  hand-curated 60k version. Effective context: 128k → 484k.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">emergent composability</Tag>
                <p>
                  Two cartridges trained independently on two ~100k-token documents can simply be
                  concatenated at inference (Llama-3B) and answer cross-document questions —
                  emulating multi-document ICL with zero joint training. Nobody trained for this;
                  it fell out.
                </p>
              </Card>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-14">
              <H3>The economics, live</H3>
              <Body className="mb-6">
                Drag corpus size and query volume. The tier only makes sense because both sliders
                move in real deployments — big corpora, many queries.
              </Body>
              <EngramCartridgesLadder />
              <Note>
                Bars assume Llama-70B 16-bit KV (84 GB at 128k, scaled linearly) and the paper’s
                average 38.6× reduction at matched quality; training cost is the ~30-minute
                8×H100 self-study run reported for Llama-8B. Past 128k the raw-KV bar is
                hypothetical — the window ends there; the cartridge doesn’t.
              </Note>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* 03 — engram */}
      <Section variant="dark">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">Upward from weights · Jan 2026</Eyebrow>
            <H2>Engram: give the transformer a lookup primitive</H2>
            <Lede>
              On January 12, 2026, Xin Cheng and thirteen co-authors at DeepSeek-AI and Peking
              University published the other half of the answer. Their diagnosis: language
              modeling mixes compositional reasoning with knowledge retrieval that is “static and
              highly stereotyped” — yet today’s models are “forced to simulate retrieval through
              computation,” wasting sequential depth on trivial operations.
            </Lede>
          </Reveal>
          <Reveal>
            <Body>
              Engram makes memory a sparsity axis of its own. MoE is <em>conditional
              computation</em> — choose which experts run. Engram is <em>conditional memory</em>{' '}
              — choose which rows to fetch, with zero FLOPs spent on the selection itself. The
              mechanism is three cheap moves:
            </Body>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="sky">① compress</Tag>
                <p>
                  A surjective tokenizer map (NFKC, lowercasing) collapses token IDs to canonical
                  forms — a 23% effective-vocabulary reduction on a 128k tokenizer, so surface
                  variants of the same string hash together.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">② hash</Tag>
                <p>
                  For each n-gram order (n ∈ {'{2, 3}'} in the 27B model) and each of K heads, a
                  deterministic multiplicative-XOR hash{' '}
                  <Math>{String.raw`\varphi_{n,k}`}</Math> maps the compressed suffix n-gram into
                  an embedding table of prime size <Math>{String.raw`M_{n,k}`}</Math>; retrieved
                  embeddings are concatenated. O(1) lookup, no dense n-gram table, collisions
                  diluted across heads.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">③ gate</Tag>
                <p>
                  The hidden state queries what was fetched, and the gate closes toward zero when
                  the retrieved n-gram means something else in this context. Ablating the gate
                  causes significant regression — it is load-bearing.
                </p>
              </Card>
            </div>
            <Math block className="mt-8">
              {String.raw`\alpha_t \;=\; \sigma\!\left( \frac{\mathrm{RMSNorm}(h_t)^{\top} \, \mathrm{RMSNorm}(k_t)}{\sqrt{d}} \right)`}
            </Math>
          </Reveal>
          <Reveal>
            <div className="mt-12">
              <H3>The sparsity allocation law</H3>
              <Body>
                Fix the total sparse-parameter budget and sweep the fraction{' '}
                <Math>{String.raw`\rho`}</Math> kept in MoE experts versus moved into Engram
                tables: validation loss traces a U. Pure MoE (
                <Math>{String.raw`\rho = 100\%`}</Math>) lands at 1.7248; the optimum near{' '}
                <Math>{String.raw`\rho \approx 80\%`}</Math> — a fifth to a quarter of the sparse
                budget reallocated to lookup — reaches 1.7109. And scaling the tables themselves
                from 2.58×10⁵ to 1.0×10⁷ slots improves loss along a strict power law, linear in
                log-space.
              </Body>
              <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                <Stat num="Δ 0.0139" label="val loss · pure MoE → hybrid" accent="clay" />
                <Stat num="ρ ≈ 80%" label="optimal MoE share of sparse budget" accent="sky" />
                <Stat num="5.7B" label="of 26.7B params are table rows" accent="olive" />
                <Stat num="10⁷" label="slots · power-law loss scaling" accent="sky" />
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-12">
              <H3>Iso-parameter, iso-FLOPs — and it still wins</H3>
              <Body className="mb-6">
                Engram-27B: 26.7B total, 3.8B activated, 5.7B of the total in Engram memory; 55
                routed + 2 shared experts, top-k 6; Engram modules at layers 2 and 15, embedding
                dim 1280; 262B training tokens. The baseline is a <em>strictly</em>{' '}
                iso-parameter, iso-FLOPs MoE.
              </Body>
              <Card className="overflow-x-auto">
                <div className="grid min-w-[420px] grid-cols-[1fr_auto_auto_auto] gap-x-8 gap-y-2 font-mono text-[12.5px]">
                  <span className="text-[11px] tracking-[0.12em] text-(--note) uppercase">
                    benchmark
                  </span>
                  <span className="text-right text-[11px] tracking-[0.12em] text-(--note) uppercase">
                    iso-MoE
                  </span>
                  <span className="text-right text-[11px] tracking-[0.12em] text-(--note) uppercase">
                    +engram
                  </span>
                  <span className="text-right text-[11px] tracking-[0.12em] text-(--note) uppercase">
                    Δ
                  </span>
                  {ENGRAM_BENCH.map((r) => (
                    <Fragment key={r.name}>
                      <span className="text-(--soft)">{r.name}</span>
                      <span className="text-right text-(--note)">{r.base.toFixed(1)}</span>
                      <span className="text-right font-semibold text-(--soft)">
                        {r.engram.toFixed(1)}
                      </span>
                      <span className="text-olive text-right">
                        +{(r.engram - r.base).toFixed(1)}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </Card>
              <Body>
                Note where the biggest gains land: reasoning, not trivia. LogitLens shows
                predictions converging in earlier layers, and CKA shows Engram’s layer-5
                representations matching roughly layer-12 of the baseline — lookup “relieves the
                backbone’s early layers from static reconstruction, effectively deepening the
                network.” And “by delegating local dependencies to lookups, Engram frees up
                attention capacity to focus on global context” — hence Multi-Query NIAH jumping
                84.2 → 97.0. A larger Engram-40B (39.5B total, the same 3.8B activated, 18.5B of
                memory) extends the axis further.
              </Body>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-12">
              <H3>Memory that can live off the GPU</H3>
              <Body>
                Because addresses are a deterministic hash of input n-grams, they are known{' '}
                <em>before</em> the layer runs — so the tables don’t need HBM. Offloading even a
                100B-parameter table to host DRAM over PCIe costs ≤2.8% of peak throughput on an
                8B backbone, with asynchronous prefetch hidden under early dense-layer compute.
                Access is Zipfian: hot rows cache in HBM, warm rows in DRAM, the long tail on
                NVMe. An explicit cache hierarchy — for model memory.
              </Body>
              <Note>
                The “weights → engram → KV cache” three-tier ladder is our synthesis of the
                paper’s lookup-versus-computation framing plus its storage-hierarchy section — a
                faithful reading, but not a sentence that appears verbatim in the paper.
              </Note>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* 04 — tradeoffs */}
      <Section variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">The fine print</Eyebrow>
            <H2>What the middle tier costs</H2>
            <Lede>
              No memory tier is free. Cartridges pay in training and lossiness; Engram pays in
              parameters and pretraining commitment. Knowing when each loses matters more than
              the headline ratios.
            </Lede>
          </Reveal>
          <Reveal>
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="sky">cartridges pay in training</Tag>
                <p>
                  Every corpus needs its ~30-minute 8×H100 self-study run before the first query
                  — a one-shot context never breaks even. The artifact is a learned
                  approximation, not a lossless record, and the quality-match claims are measured
                  on LongHealth, QASPER and MTOB. Naive next-token training isn’t competitive —
                  you need the full self-study pipeline, per corpus, per base model.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">engram pays in parameters</Tag>
                <p>
                  In Engram-27B, 5.7B of 26.7B total parameters are table rows rather than
                  experts. The allocation law is U-shaped: push past the ρ ≈ 80% optimum and loss
                  climbs back toward pure-MoE territory. The gate is load-bearing. And it is an
                  architectural commitment made before pretraining — a per-model tier, not a
                  per-corpus bolt-on.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">when to skip the tier</Tag>
                <p>
                  Context seen once, fitting the window: the KV cache is exact and already paid
                  for — use it, or a prompt cache. Zero tolerance for approximation: cartridges
                  are lossy by construction. Knowledge that changes per session: Engram stores
                  what is static and stereotyped — by design, that is all it stores.
                </p>
              </Card>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* 05 — state of play */}
      <Section variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">State of play · 2026</Eyebrow>
            <H2>The ladder now has four rungs</H2>
            <Lede>
              Industry got here first, crudely. Serving stacks already treat the KV cache as a
              reusable artifact: Anthropic bills prompt-cache writes at 1.25× base input price
              and reads at 0.1×, with a 5-minute TTL (a 1-hour extended tier available) and a
              1,024-token minimum prefix; OpenAI and Google ship analogous cached-input discounts
              and explicit context caching. But a prompt cache only amortizes prefill compute —
              the artifact stays full-size, exact, and short-lived.
            </Lede>
          </Reveal>
          <Reveal>
            <Body>
              Cartridges is the next step on the same axis: a trained, compressed, persistent KV
              artifact that plugs into the identical shared-prefix serving path
              (Hydragen/SGLang-style) at roughly a fortieth of the memory — no inference-server
              modification at all. Engram is the step past that: the tier baked into the
              architecture itself, shared by every user of the model, offloadable across HBM →
              DRAM → NVMe — code released Apache-2.0 at deepseek-ai/Engram, with Engram-27B and
              Engram-40B as the paper’s research models.
            </Body>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <Tag accent="gray">prompt cache</Tag>
                <p>
                  Exact · per-prefix. Lives minutes to an hour; reads 0.1×, writes 1.25× of input
                  price (Anthropic). Amortizes prefill compute only — the KV stays full-size.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">cartridge</Tag>
                <p>
                  Learned · per-corpus. ~1/38.6 the memory at matched quality, ~30 minutes to
                  train, served as a shared cached prefix on unmodified servers.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">engram</Tag>
                <p>
                  Learned · per-model. 5.7–18.5B of hashed table rows; O(1) fetch with zero-FLOP
                  addressing; spills HBM → DRAM → NVMe at ≤2.8% throughput cost.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">weights</Tag>
                <p>
                  Learned · per-distribution. The 2017 tier: everything else the model knows,
                  frozen at deployment and amortized across every user.
                </p>
              </Card>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-14">
              <H3>Lineage</H3>
              <div className="mt-6 flex flex-col gap-6 border-l-2 border-(--card-line) pl-6">
                {TIMELINE.map((t) => (
                  <div key={t.date}>
                    <div className="font-mono text-clay text-[12px] font-semibold">{t.date}</div>
                    <p className="mt-1 max-w-[62ch] text-[15px] text-(--soft)">{t.text}</p>
                  </div>
                ))}
              </div>
              <Note>
                Read bottom-up, the ladder orders memory by how many share it: one prefix → one
                corpus → one model → one training distribution. The 2017 paper shipped only the
                two ends; 2025–26 filled the middle.
              </Note>
            </div>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
