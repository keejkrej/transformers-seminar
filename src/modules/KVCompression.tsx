import { ModuleLayout } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Reveal } from '../components/Reveal'
import { Body, Eyebrow, H2, H3, Lede, Note } from '../components/Type'
import { Card, Stat, Tag } from '../components/Card'
import { Math } from '../components/Math'
import { PAPER } from '../data/paper'
import KVBudgetCalculator from './widgets/kv-compression-calculator'

const REFERENCES = [
  {
    label: 'Shazeer 2019 — Fast Transformer Decoding: One Write-Head is All You Need (MQA)',
    url: 'https://arxiv.org/abs/1911.02150',
  },
  {
    label:
      'Ainslie et al. 2023 — GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints',
    url: 'https://arxiv.org/abs/2305.13245',
  },
  {
    label: 'DeepSeek-V2 (MLA: d_c=512, d_R=64, absorb trick, GQA-2.25 equivalence, 93.3% reduction)',
    url: 'https://arxiv.org/html/2405.04434v4',
  },
  {
    label: 'DeepSeek-V3 Technical Report (61 layers, MLA config, FP8)',
    url: 'https://arxiv.org/html/2412.19437v1',
  },
  {
    label: 'Mistral 7B (GQA-8 + sliding window 4096, rolling buffer cache)',
    url: 'https://arxiv.org/abs/2310.06825',
  },
  {
    label: 'Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks',
    url: 'https://arxiv.org/html/2309.17453v4',
  },
  {
    label: 'Liu et al. — KIVI: 2-bit Asymmetric KV Cache Quantization',
    url: 'https://arxiv.org/abs/2402.02750',
  },
  {
    label: 'Brandon et al. — Cross-Layer Attention (CLA)',
    url: 'https://arxiv.org/abs/2405.12981',
  },
  {
    label: 'Sun et al. — YOCO: You Only Cache Once (Microsoft)',
    url: 'https://arxiv.org/abs/2405.05254',
  },
  {
    label: 'Kwon et al. — PagedAttention / vLLM (SOSP 2023)',
    url: 'https://arxiv.org/abs/2309.06180',
  },
  {
    label: 'vLLM docs — Quantized KV Cache (FP8 E4M3/E5M2)',
    url: 'https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/',
  },
  {
    label: 'MHA2MLA — Enabling MLA in any Transformer-based LLM',
    url: 'https://arxiv.org/abs/2502.14837',
  },
  {
    label: 'Llama 2 70B GQA memory arithmetic (secondary source for 64Q/8KV config)',
    url: 'https://www.generalcompute.com/blog/multi-query-grouped-query-attention',
  },
]

export default function KVCompression() {
  return (
    <ModuleLayout
      slug="kv-compression"
      chips={[
        '2.5 MiB → 90 KiB / token',
        'GQA-8 · 8× smaller',
        'MLA ≈ GQA-2.25',
        '93.3% cache cut',
        '5.76× throughput',
        '4 sink tokens',
      ]}
      heroExtra={
        <Body>
          Part 08 called this the memory bill: attention keeps every past token’s keys and
          values resident in HBM and re-reads all of them for each new token. This module
          follows the repayment plan, 2019 to 2026 — share the heads, compress the heads,
          quantize the bits, evict the tokens, and page whatever is left.
        </Body>
      }
      references={REFERENCES}
      bare
    >
      {/* ---- 01 · the debt -------------------------------------------- */}
      <Section variant="paper" id="m1-debt">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">The debt · memory rent</Eyebrow>
            <H2>The bill attention writes itself</H2>
            <Lede>
              Causal masking makes past keys and values immutable, so every serving stack
              caches them rather than recompute. That cache is rent — paid in HBM, on every
              token the model has ever seen.
            </Lede>
            <Body>
              The 2017 paper handed each of its {PAPER.heads} heads a private key and value
              vector per token, in every one of its {PAPER.layers} layers. At{' '}
              <Math>{String.raw`d_{\text{model}} = 512`}</Math> that habit cost kilobytes;
              nobody noticed. But autoregressive decoding re-reads the <em>entire</em> cache
              from HBM at every step, which makes generation memory-bandwidth bound: the
              speed limit is not arithmetic, it is how fast you can drag old keys and values
              past the compute. Shazeer made that bandwidth argument explicit in 2019, and it
              has governed inference economics ever since. Per token, the cache costs
            </Body>
            <Math block>
              {String.raw`M_{\text{KV}} = 2 \cdot L \cdot n_{kv} \cdot d_h \cdot b \ \ \text{bytes/token}`}
            </Math>
            <Body>
              with <Math>L</Math> layers, <Math>{String.raw`n_{kv}`}</Math> key–value heads,
              head dimension <Math>{String.raw`d_h`}</Math>, and <Math>b</Math> bytes per
              element (2 for FP16); the leading 2 covers K and V. Scale the 2017 recipe
              honestly — a 70B-class model with 80 layers, 64 heads of dimension 128 — and the
              formula stops being a footnote.
            </Body>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="gray">MHA · hypothetical 70B</Tag>
                <H3>2.5 MiB / token</H3>
                <p>
                  64 KV heads, one per query head. At 128K context: 320 GiB of cache — it
                  does not fit on four 80 GB H100s. Long-context MHA at 70B scale is
                  essentially unservable, which is why this research line exists.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">GQA-8 · Llama 2 70B</Tag>
                <H3>320 KiB / token</H3>
                <p>
                  8 shared KV heads. At 128K context: 40 GiB — down 8×, onto a single
                  accelerator, uncomfortably.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">MLA-style · same 80 layers</Tag>
                <H3>90 KiB / token</H3>
                <p>
                  576 cached elements per layer, equivalent to GQA with 2.25 groups. At 128K
                  context: ≈ 11.25 GiB.
                </p>
              </Card>
            </div>
            <Note>
              The 70B-class yardstick used throughout this page: L = 80 layers,{' '}
              d<sub>h</sub> = 128, 64 query heads, FP16, 131,072-token context — bytes/token
              = 2 × 80 × n<sub>kv</sub> × 128 × 2, computed from the published architecture
              parameters.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 02 · fewer heads ----------------------------------------- */}
      <Section variant="tint" id="m1-share">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2019 → 2023 · knob one: fewer heads</Eyebrow>
            <H2>Share the heads</H2>
            <Lede>
              The first repayment was blunt: if reloading keys and values is the bottleneck,
              keep fewer of them. One, if you can get away with it.
            </Lede>
          </Reveal>

          <Reveal delay={0.06}>
            <H3 className="mt-12">MQA — one write-head (Shazeer, Nov 2019)</H3>
            <Body>
              “Fast Transformer Decoding: One Write-Head is All You Need” (arXiv 1911.02150)
              lets all query heads read from a single shared K and V —{' '}
              <Math>{String.raw`n_{kv} = 1`}</Math> — so decode-time memory traffic shrinks by
              a factor of <Math>{String.raw`n_h`}</Math>. The paper reports much faster
              decoding with “only minor quality degradation,” and PaLM and Falcon-7B shipped
              it. The catch surfaced at scale: real quality loss and training instability —
              which is exactly what motivated the interpolation.
            </Body>
          </Reveal>

          <Reveal delay={0.06}>
            <H3 className="mt-10">GQA — the interpolation that stuck (Ainslie et al., 2023)</H3>
            <Body>
              GQA (arXiv 2305.13245, EMNLP 2023) puts <Math>g</Math> groups of query heads on
              one KV head each, <Math>{String.raw`1 < g < n_h`}</Math>. Two results made it
              the default. First, quality lands close to MHA at speed comparable to MQA.
              Second, you don’t retrain — you renovate: an existing MHA checkpoint converts by
              mean-pooling its K/V heads and uptraining with roughly 5% of the original
              pre-training compute.
            </Body>
            <Body>
              Llama 2 70B shipped GQA-8 in July 2023 — 64 query heads, 8 KV heads, an 8×
              cache cut. Mistral 7B followed in October 2023 (32 Q / 8 KV) and added
              sliding-window attention with window 4096, whose rolling-buffer cache alone
              gives ~8× reduction at 32K context. Since then GQA is essentially every open
              model: Llama 3, Qwen, Gemma. The choice of 8 is no accident — 8 KV heads map
              cleanly onto 8-way tensor parallelism, one head per shard.
            </Body>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="1" label="KV head · MQA" accent="sky" />
              <Stat num="~5%" label="compute to uptrain MHA → GQA" accent="sky" />
              <Stat num="8×" label="cache cut · GQA-8" accent="sky" />
              <Stat num="4096" label="Mistral sliding window" accent="sky" />
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 03 · lower rank: MLA ------------------------------------- */}
      <Section variant="paper" id="m1-mla">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2024 · knob two: lower rank</Eyebrow>
            <H2>Compress, don’t share</H2>
            <Lede>
              DeepSeek-V2 (May 2024) asked the sharper question: why ration heads at all?
              Project the hidden state into a small latent, cache the latent, and rebuild
              every head’s K and V on demand.
            </Lede>
            <Math block>
              {String.raw`c_t^{KV} = W^{DKV} h_t, \qquad k_t^{C} = W^{UK} c_t^{KV}, \qquad v_t^{C} = W^{UV} c_t^{KV}`}
            </Math>
            <Body>
              A single down-projection <Math>{String.raw`W^{DKV}`}</Math> squeezes{' '}
              <Math>{String.raw`h_t`}</Math> into a latent of{' '}
              <Math>{String.raw`d_c = 512 = 4\,d_h`}</Math>, and <em>that</em> is what gets
              cached. The up-projections never run at decode time: at inference{' '}
              <Math>{String.raw`W^{UK}`}</Math> is absorbed into the query projection and{' '}
              <Math>{String.raw`W^{UV}`}</Math> into the output projection{' '}
              <Math>{String.raw`W^{O}`}</Math>, so full-size keys and values are never
              materialized — attention runs directly against the cached latents.
            </Body>
            <Body>
              One wrinkle: RoPE is position-dependent and would break that low-rank
              absorption. So MLA carries position in a small <em>decoupled</em> rotary key of{' '}
              <Math>{String.raw`d_R = 64 = d_h/2`}</Math> per token, shared across heads. The
              cache per token per layer is <Math>{String.raw`d_c + d_R = 576`}</Math>{' '}
              elements — the paper equates this to GQA with just 2.25 groups.
            </Body>
            <Body>
              Against DeepSeek-V2’s own 128-head MHA baseline, that is 32,768 → 576 elements
              per layer, roughly 57×; against a typical 32–64-head MHA, ~14–28×. The headline
              numbers: <strong>93.3%</strong> KV-cache reduction versus DeepSeek 67B — itself
              already GQA-8 across 95 layers — and <strong>5.76×</strong> maximum generation
              throughput.
            </Body>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="olive">Why the compressed one is stronger</Tag>
                <p>
                  DeepSeek-V2’s ablations rate MHA “strong” — and MLA “stronger.” Compression
                  decouples head count and width from the model dimension: V2 runs 128 heads
                  × 128 dims, so{' '}
                  <Math>{String.raw`n_h d_h = 16{,}384 \gg d_{\text{model}} = 5{,}120`}</Math>{' '}
                  — an over-complete attention basis no cache-constrained MHA could afford.
                  The low-rank bottleneck behaves as shared structure across heads, not pure
                  information loss.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Shipping at frontier scale</Tag>
                <p>
                  V2: 236B parameters, 21B active, 60 layers, 128K context. V3 (Dec 2024):
                  671B / 37B active, 61 layers, trained in FP8. And it is no longer a
                  from-scratch commitment: MHA2MLA (Feb 2025) retrofits MLA onto existing
                  MHA and GQA checkpoints.
                </p>
              </Card>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="576" label="elements / token / layer" accent="sky" />
              <Stat num="93.3%" label="cache cut vs DeepSeek 67B" accent="sky" />
              <Stat num="5.76×" label="max gen throughput" accent="sky" />
              <Stat num="~57×" label="vs its own 128-head MHA" accent="sky" />
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 04 · interactive budget ----------------------------------- */}
      <Section variant="dark" id="m1-budget">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">Interactive · the budget line</Eyebrow>
            <H2>Watch the cache clear the HBM bar</H2>
            <Lede>
              Every technique in this module is a move on a single log axis: bytes per token
              × context length, versus GPU memory. Set the model, pick your era’s tricks,
              and see which architectures duck under the 80 GB line.
            </Lede>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10">
              <KVBudgetCalculator />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="2.5 MiB" label="MHA · FP16" accent="clay" />
              <Stat num="320 KiB" label="+ GQA-8" accent="sky" />
              <Stat num="90 KiB" label="+ MLA" accent="sky" />
              <Stat num="~22 KiB" label="+ 2-bit" accent="olive" />
            </div>
            <Note>
              Bytes per token for the 80-layer 70B-class yardstick — roughly 100× compression
              in five years, and the middle step (MLA) is the rare one that also raised
              quality.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 05 · the rest of the stack -------------------------------- */}
      <Section variant="tint" id="m1-stack">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2023 → 2026 · the rest of the stack</Eyebrow>
            <H2>Two more knobs, and a landlord</H2>
            <Lede>
              Head-sharing and low-rank latents are architecture. The remaining savings are
              orthogonal — fewer bits, fewer tokens, fewer caches per depth — and because they
              act on different factors of the same product, they multiply.
            </Lede>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="sky">Fewer bits — quantization</Tag>
                <p>
                  FP8 (E4M3, range ±240 with per-tensor scales) halves memory and attention
                  traffic versus FP16 at minimal accuracy cost — a production default,{' '}
                  <span className="font-mono text-[13px]">kv_cache_dtype="fp8"</span> in vLLM
                  and TensorRT-LLM. KIVI (ICML 2024) pushes to 2-bit, tuning-free, on one
                  insight: keys have outlier <em>channels</em>, so quantize keys per-channel
                  and values per-token. Results: 2.6× peak-memory reduction including
                  weights, 4× larger batches, 2.35–3.47× throughput. The axes compound:
                  GQA-8 + FP8 is 16× versus FP16 MHA; MLA at FP8 ≈ 45 KiB/token on the
                  80-layer yardstick.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Fewer tokens — eviction with sinks</Tag>
                <p>
                  Naive sliding-window caches collapse the moment the first tokens are
                  evicted. StreamingLLM (ICLR 2024) found the reason: softmax must sum to 1,
                  so heads park excess attention mass on the earliest tokens — attention
                  sinks. Keep the KV of the first 4 tokens plus a rolling window (4 + 2044 on
                  Llama-2) and perplexity stays stable out to 4M tokens, up to 22.2× faster
                  than sliding-window-with-recomputation, with no fine-tuning.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Fewer caches — cross-layer sharing</Tag>
                <p>
                  CLA (MIT/IBM, May 2024) shares KV activations between adjacent layers: a
                  further 2× on top of MQA with comparable accuracy at 1B/3B scale. YOCO
                  (Microsoft, May 2024) takes it to the limit — one self-decoder writes a
                  single global KV cache that every cross-decoder layer reuses, so the cache
                  is O(1) in depth, with near-perfect needle retrieval reported at 1M tokens.
                  Gemma 3’s interleaved local/global layers deploy the same layerwise
                  asymmetry.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Zero-waste allocation — PagedAttention</Tag>
                <p>
                  Even a small cache is squandered when pre-allocated contiguously at maximum
                  length; earlier systems lost a large share of KV memory to fragmentation
                  and over-reservation. vLLM’s PagedAttention (SOSP 2023) imports OS virtual
                  memory: fixed-size KV blocks, a block table per sequence, copy-on-write
                  across beams and shared prefixes — near-zero waste and 2–4× throughput over
                  FasterTransformer and Orca. This is the substrate everything above runs on.
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <H3 className="mt-14">What the discount costs</H3>
            <Body>
              <strong>MQA</strong> bought its bandwidth cut with real quality loss and
              training instability at scale — GQA exists because of that. <strong>MLA</strong>{' '}
              pays in machinery: a decoupled 64-dim rotary key to keep RoPE, projections to
              absorb at inference, and — until MHA2MLA — training from scratch.
            </Body>
            <Body>
              <strong>Eviction</strong> is amnesia by design: StreamingLLM’s memory is
              constant precisely because evicted tokens are gone. Stable perplexity is not
              long-range recall. <strong>Quantization</strong> lives or dies on outliers —
              KIVI’s per-channel key scheme exists because naive 2-bit destroys the keys.
              Nothing on this page is free; the craft is picking which loss you can afford.
            </Body>
          </Reveal>

          <Reveal delay={0.06}>
            <H3 className="mt-12">State of play, 2026</H3>
            <Body>
              GQA-8 is the de-facto default of the open-model world — Llama 3, Qwen, Gemma —
              because it shards as neatly as it caches. MLA ships at frontier scale in
              DeepSeek-V2 and V3, with MHA2MLA as the retrofit path for everyone else. FP8 KV
              is a one-line config in the major serving stacks and INT4 sits between it and
              KIVI’s 2-bit; attention sinks are folded into streaming serving; PagedAttention
              runs underneath all of it.
            </Body>
            <Body>
              The scoreboard: the same 128K context that cost 320 GiB under 2017’s
              architecture rides at ≈ 11 GiB with MLA at FP16 — about 45 KiB per token at FP8
              — and the compressed architecture is, uniquely, also the stronger one.
            </Body>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
