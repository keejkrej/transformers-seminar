import { ModuleLayout } from '../components/ModuleLayout'
import type { Reference } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Reveal } from '../components/Reveal'
import { Body, Eyebrow, H2, H3, Lede, Note } from '../components/Type'
import { Card, Stat, Tag } from '../components/Card'
import { Math } from '../components/Math'
import { PAPER, TWOTOWER } from '../data/paper'
import { TwoTowerDecodeRace } from './widgets/twotower-decode-race'

const REFERENCES: Reference[] = [
  {
    label: 'HF model card: nvidia/Nemotron-Labs-TwoTower-30B-A3B-Base-BF16',
    url: 'https://huggingface.co/nvidia/Nemotron-Labs-TwoTower-30B-A3B-Base-BF16',
  },
  {
    label: 'Paper: Nemotron-TwoTower (arXiv:2606.26493)',
    url: 'https://arxiv.org/abs/2606.26493',
  },
  {
    label: 'Nemotron-TwoTower full text (arXiv HTML)',
    url: 'https://arxiv.org/html/2606.26493',
  },
  {
    label: 'Backbone: NVIDIA-Nemotron-3-Nano-30B-A3B-Base-BF16',
  },
  {
    label: 'BD3-LM: Block Diffusion, Arriola et al. 2025 (arXiv:2503.09573)',
    url: 'https://arxiv.org/abs/2503.09573',
  },
  {
    label: 'LLaDA: Large Language Diffusion Models (arXiv:2502.09992)',
    url: 'https://arxiv.org/abs/2502.09992',
  },
  {
    label: 'Mercury: Ultra-Fast Diffusion LMs, Inception Labs (arXiv:2506.17298)',
    url: 'https://arxiv.org/abs/2506.17298',
  },
  {
    label: 'Gemini Diffusion (Google DeepMind)',
    url: 'https://deepmind.google/models/gemini-diffusion/',
  },
  {
    label: 'NVIDIA Nemotron Open Model License',
  },
]

export default function TwoTower() {
  return (
    <ModuleLayout
      slug="twotower"
      chips={[
        `2 × ${TWOTOWER.totalParamsPerTower} towers`,
        `${TWOTOWER.activeParams} active / tower`,
        `${TWOTOWER.throughputVsAR} throughput`,
        `${TWOTOWER.qualityRetained} quality`,
        'block S=16 · γ=0.8',
        `${TWOTOWER.contextTokens} context`,
        'BF16 · 2×H100',
      ]}
      heroExtra={
        <Lede className="mt-5">
          NVIDIA, July 2026: take a 30B autoregressive backbone, freeze it, clone it, and teach
          the clone to denoise sixteen tokens at a time. The frozen tower keeps reading; the
          trainable twin does the writing — {TWOTOWER.throughputVsAR} the decoding throughput at{' '}
          {TWOTOWER.qualityRetained} of the quality.
        </Lede>
      }
      references={REFERENCES}
      bare
    >
      {/* ——— 01 · The debt ——— */}
      <Section id="m4-debt" variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">The debt · one token at a time</Eyebrow>
            <H2>The 2017 paper parallelized everything except the answer</H2>
            <Lede>
              Attention Is All You Need threw out recurrence so that training could see every
              position of a sequence at once — that is how the base model finished in{' '}
              {PAPER.baseTime} on {PAPER.gpus}s. But at inference the decoder walks right back
              into the loop it was built to escape.
            </Lede>
          </Reveal>
          <Reveal>
            <Body>
              Generation still follows the autoregressive factorization the architecture was
              trained to model:
            </Body>
            <Math block className="mt-4">
              {String.raw`p_\theta(x) = \prod_{i=1}^{L} p_\theta\left(x_i \mid x_{<i}\right)`}
            </Math>
            <Body>
              One forward pass per token, strictly sequential. Each pass streams the full weights
              and a growing KV cache through the GPU to emit a single token — decoding is
              memory-bandwidth-bound, not FLOP-bound. That is Part 08&rsquo;s sequential bill:
              the machine idles on arithmetic while it waits on memory, L times in a row.
            </Body>
            <Body>
              Diffusion language models attack the factorization itself: denoise many token
              positions <em>in parallel</em> per step, trading step count for per-step
              parallelism. But done naively, two conveniences of the 2017 decoder die with the
              chain rule — the KV cache and natural variable-length generation. This module is
              the story of getting them back without paying for pretraining twice.
            </Body>
          </Reveal>
        </Wrap>
      </Section>

      {/* ——— 02 · Lineage ——— */}
      <Section id="m4-lineage" variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">Lineage · 2025–2026</Eyebrow>
            <H2>Diffusion learns to talk</H2>
            <Lede>
              Three waves in about eighteen months: prove that diffusion can model language,
              restore the caching that autoregression got for free, then stop paying full
              pretraining price for it.
            </Lede>
          </Reveal>
          <Reveal className="mt-10 grid gap-4 md:grid-cols-2">
            <Card>
              <Tag accent="sky">Feb 2025 · from scratch</Tag>
              <H3>LLaDA 8B</H3>
              <p>
                A masked diffusion Transformer trained from scratch — &ldquo;competitive with
                strong LLMs like LLaMA3 8B&rdquo; in in-context learning. Proof of concept, but
                it forfeits KV caching and natural variable-length generation.
              </p>
            </Card>
            <Card>
              <Tag accent="olive">2025 · ICLR Oral</Tag>
              <H3>BD3-LM — block diffusion</H3>
              <p>
                Arriola et al. &ldquo;interpolate between discrete denoising diffusion and
                autoregressive models&rdquo;: generate block-by-block autoregressively, denoise
                within each block in parallel — restoring KV caching and flexible-length
                generation.
              </p>
            </Card>
            <Card>
              <Tag accent="clay">Jun 2025 · commercial</Tag>
              <H3>Mercury Coder</H3>
              <p>
                Inception Labs ships diffusion decoding as a product: 1,109 tok/s (Mini) and 737
                tok/s (Small) on an H100 — &ldquo;up to 10×&rdquo; faster than speed-optimized
                autoregressive frontier models.
              </p>
            </Card>
            <Card>
              <Tag accent="gray">2025 · frontier demo</Tag>
              <H3>Gemini Diffusion</H3>
              <p>
                DeepMind samples at 1,479 tok/s (excluding 0.84 s overhead). Parity on some
                benchmarks — LiveCodeBench 30.9% vs Gemini 2.0 Flash-Lite&rsquo;s 28.5% — but real
                gaps on others: GPQA Diamond 40.4% vs 56.5%.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Body>
              LLaDA and Mercury bought diffusion by training for it from scratch.
              NVIDIA&rsquo;s July 2026 move with Nemotron-TwoTower (arXiv:2606.26493) is the
              miser&rsquo;s version: don&rsquo;t retrain the language model at all — bolt a
              denoiser onto a frozen one.
            </Body>
          </Reveal>
        </Wrap>
      </Section>

      {/* ——— 03 · Mechanism ——— */}
      <Section id="m4-mechanism" variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">Mechanism · arXiv:2606.26493</Eyebrow>
            <H2>Freeze the reader, train the writer</H2>
            <Lede>
              TwoTower decouples context representation from denoising. One tower remembers; the
              other guesses in parallel. Only the memory has to stay honest.
            </Lede>
          </Reveal>
          <Reveal className="mt-10 grid gap-4 md:grid-cols-2">
            <Card>
              <Tag accent="sky">Context tower · frozen</Tag>
              <H3>The reader</H3>
              <p>
                The pretrained Nemotron-3-Nano-30B-A3B-Base backbone, untouched after its
                25T-token pretrain. It encodes the prompt and every committed clean block
                causally, and it is the <em>only</em> tower that maintains KV and Mamba state
                across blocks — so sequence-length-dependent cache memory scales like the AR
                baseline.
              </p>
            </Card>
            <Card>
              <Tag accent="clay">Denoiser tower · trainable</Tag>
              <H3>The writer</H3>
              <p>
                A trainable copy of the same backbone that generates one block at a time by
                block-wise mask diffusion. Attention is bidirectional inside the block: noisy
                tokens attend freely to each other within the current block, and causally to past
                clean blocks.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Body>
              The towers are stitched together by <strong>layer-aligned cross-attention</strong>:
              denoiser layer <Math>{String.raw`i`}</Math> attends to{' '}
              <Math>{String.raw`\bigl[K^{\mathrm{ctx},(i)}_{<b};\; K^{\mathrm{den},(i)}_{b}\bigr]`}</Math>{' '}
              — the context tower&rsquo;s cached keys and values for past clean blocks,
              concatenated with the denoiser&rsquo;s own in-block KV at the same depth. Timestep
              conditioning uses adaLN-single: a global MLP maps <Math>{String.raw`t`}</Math> to
              scale/shift/gate plus per-layer embeddings, adding only ~1.5M parameters on a 30B
              backbone.
            </Body>
          </Reveal>
          <Reveal className="mt-8">
            <Card>
              <Tag accent="olive">Training objective</Tag>
              <p>
                Per-block masked diffusion: mean NLL over the masked positions{' '}
                <Math>{String.raw`\mathcal{M}_t`}</Math>, conditioned on the noised block, the
                timestep, and the frozen tower&rsquo;s context —
              </p>
              <Math block className="mt-3">
                {String.raw`\mathcal{L}_{\mathrm{MD}} = \mathbb{E}_{t,\,z_t}\!\left[\frac{1}{|\mathcal{M}_t|}\sum_{(b,\ell)\in\mathcal{M}_t} -\log p_\theta\!\left(x_{b\ell} \mid z_{t,b},\; t,\; c_{<b}\right)\right]`}
              </Math>
              <p className="mt-3">
                wrapped in the block-causal factorization that BD3-LM introduced,{' '}
                <Math>{String.raw`p_\theta(x)=\textstyle\prod_{b=1}^{B} p_\theta\bigl(x^{(b)} \mid x^{(<b)}\bigr)`}</Math>
                , with each factor modeled by within-block diffusion.
              </p>
            </Card>
            <Note>
              The theoretical 1/t importance weight on the loss is deliberately omitted — the
              paper drops it for training stability.
            </Note>
          </Reveal>

          <Reveal className="mt-16">
            <H3>The generation loop</H3>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <Tag accent="gray">1 · encode once</Tag>
                <p>
                  The frozen context tower reads the prompt a single time and fills its KV +
                  Mamba cache.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">2 · denoise block b</Tag>
                <p>
                  All positions in the block update in parallel for T steps. Confidence-based
                  unmasking commits any position that clears γ = 0.8 — &ldquo;most blocks
                  complete in the first few steps.&rdquo;
                </p>
              </Card>
              <Card>
                <Tag accent="gray">3 · commit</Tag>
                <p>
                  The clean block is fed to the frozen tower, which updates its cache once per
                  block — not once per token.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">4 · repeat</Tag>
                <p>
                  Next block. Block-causal AR on the outside, bidirectional diffusion on the
                  inside — which is exactly how the hybrid keeps KV caching alive.
                </p>
              </Card>
            </div>
            <Note>
              The exact per-block step count T for the released checkpoint is not stated in the
              paper — it is adaptive by construction. What the paper does report: committed
              positions form an &ldquo;autoregressive upper-left triangular pattern&rdquo; — even
              free to fill in any order, the model rediscovers left-to-right where it matters.
            </Note>
          </Reveal>

          <Reveal className="mt-16">
            <H3>Bill of materials, per tower</H3>
            <Body>
              Each tower is a hybrid Mamba2–Transformer MoE: {TWOTOWER.layersPerTower} layers ={' '}
              {TWOTOWER.mamba2Layers} Mamba-2 + {TWOTOWER.attentionLayers} self-attention +{' '}
              {TWOTOWER.moeLayers} MoE. The MoE routes over {TWOTOWER.expertsRouted} experts,
              activating {TWOTOWER.expertsActive} per token plus {TWOTOWER.expertsShared} shared
              — {TWOTOWER.activeParams} active parameters per tower, the &ldquo;A3B.&rdquo; Two
              towers make ~60B total: ~59 GB per GPU in BF16, running on 2×H100 or 2×A100-80GB,
              with a {TWOTOWER.contextTokens}-token context window.
            </Body>
            <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat num={TWOTOWER.layersPerTower} label="layers / tower" accent="sky" />
              <Stat
                num={`${TWOTOWER.expertsRouted}→${TWOTOWER.expertsActive}+${TWOTOWER.expertsShared}`}
                label="experts routed → active"
                accent="clay"
              />
              <Stat num="~60B" label="params, both towers" accent="olive" />
              <Stat num={TWOTOWER.contextTokens} label="token context" accent="sky" />
            </div>
          </Reveal>

          <Reveal className="mt-16">
            <H3>Training: 25T for free, ~2.1T for speed</H3>
            <Body>
              Stage 1 is a standard AR pretrain — 25T tokens, already paid for by the Nemotron-3
              program. Stage 2 freezes it, clones it, and trains only the denoiser on{' '}
              {TWOTOWER.denoiserTrainingTokens} tokens (data cutoff June 25, 2025) with
              Megatron-LM, AdamW, and a warmup-stable-decay schedule from a peak of 1e-4 down to
              1e-6, in BF16. The block size follows a curriculum: adaptation at S=32, continued
              training at S=32, and a final continuation at S=16 — the default block size for
              both training and sampling.
            </Body>
            <Body>
              The ablations earn their keep. adaLN time conditioning lifts
              generation/code/math from 72.94/68.64/80.57 to 74.12/69.61/81.30. And the
              frozen-context recipe itself wins: keeping the context tower fixed and training the
              denoiser separately beats training both towers jointly on combined AR + diffusion
              losses.
            </Body>
            <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat num={TWOTOWER.throughputVsAR} label="decode throughput" accent="clay" />
              <Stat num={TWOTOWER.qualityRetained} label="aggregate quality" accent="olive" />
              <Stat
                num={TWOTOWER.denoiserTrainingTokens}
                label="denoiser tokens vs 25T pretrain"
                accent="sky"
              />
              <Stat num="~1.5M" label="adaLN params added" accent="clay" />
            </div>
            <Note>
              Throughput and quality measured on 2×H100 against the AR baseline built from the
              same backbone.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* ——— 04 · The decode race ——— */}
      <Section id="m4-race" variant="dark">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">Interactive · the decode race</Eyebrow>
            <H2>Watch sixteen tokens land at once</H2>
            <Lede>
              Top lane is the 2017 loop: one forward pass, one token, one cache write. Bottom
              lane is TwoTower: a block denoises in parallel, positions lock in as their
              confidence crosses γ, and the frozen tower&rsquo;s cache grows only when the whole
              block commits. Drag S and γ and watch the speedup move.
            </Lede>
          </Reveal>
          <Reveal className="mt-10">
            <TwoTowerDecodeRace />
          </Reveal>
          <Reveal>
            <Note>
              This toy counts forward passes only — no kernels, no batching. The measured number
              on 2×H100, at S=16 and γ=0.8, is {TWOTOWER.throughputVsAR} wall-clock throughput at{' '}
              {TWOTOWER.qualityRetained} aggregate quality. And where the toy makes bigger blocks
              look strictly faster, reality trades block size against quality — the
              paper&rsquo;s curriculum lands on S=16, not S=32, as the default. Note the triangle
              in the bottom lane:
              earlier positions commit first, the paper&rsquo;s upper-left triangular pattern.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* ——— 05 · Tradeoffs & state of play ——— */}
      <Section id="m4-tradeoffs" variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="clay">The bill for paying the bill</Eyebrow>
            <H2>What it costs, when it loses</H2>
            <Lede>
              Nothing here is free. TwoTower spends memory and FLOPs to buy back latency — a bet
              that inference is bandwidth-bound, not FLOP-bound.
            </Lede>
          </Reveal>
          <Reveal className="mt-10 grid gap-4 md:grid-cols-2">
            <Card>
              <Tag accent="clay">2× weights</Tag>
              <H3>Compute vs latency</H3>
              <p>
                Two 30B towers means double the weight memory, plus redundant denoiser FLOPs on
                every block. In exchange: {TWOTOWER.throughputVsAR} wall-clock generation
                throughput. When decoding is bandwidth-bound, sequential passes are the scarce
                resource — spend silicon, save time.
              </p>
            </Card>
            <Card>
              <Tag accent="sky">−1.3% aggregate</Tag>
              <H3>The quality tax</H3>
              <p>
                {TWOTOWER.qualityRetained} of AR benchmark quality overall. MMLU 78.24 vs the
                baseline&rsquo;s 78.56; ARC-Challenge 92.66 vs 91.72 — the diffusion twin
                occasionally wins outright. In-block bidirectionality helps local coherence, but
                the S=16 block boundary caps how much parallelism each step can extract.
              </p>
            </Card>
            <Card>
              <Tag accent="olive">Frozen economics</Tag>
              <H3>Reuse, don&rsquo;t retrain</H3>
              <p>
                LLaDA- and Mercury-style models pay for diffusion from scratch. TwoTower reuses a
                25T-token pretrain and buys diffusion decoding with{' '}
                {TWOTOWER.denoiserTrainingTokens} tokens of denoiser training — less than a tenth
                of the pretraining budget — while guaranteeing the AR tower&rsquo;s
                representations and cache behavior stay bit-for-bit untouched.
              </p>
            </Card>
            <Card>
              <Tag accent="gray">Near-AR, rediscovered</Tag>
              <H3>Adaptive step count</H3>
              <p>
                Confidence unmasking makes the step count adaptive: easy blocks finish in a few
                steps, hard blocks take more. Empirically the commits still skew left-to-right —
                given freedom over order, the model reinvents autoregression where it matters and
                spends parallelism where it doesn&rsquo;t.
              </p>
            </Card>
          </Reveal>
          <Reveal className="mt-16">
            <H3>State of play, 2026</H3>
            <Body>
              Diffusion decoding now exists at every level of commitment. Inception Labs sells
              Mercury as a commercial product; DeepMind demos Gemini Diffusion at frontier
              speeds; and NVIDIA ships TwoTower as open BF16 weights under the Nemotron Open
              Model License, runnable on two H100s or two A100-80GBs. TwoTower&rsquo;s real
              contribution is the retrofit recipe: any lab sitting on an expensive AR pretrain
              can now bolt on parallel decoding for a fraction of the tokens, with the frozen
              tower holding the old model&rsquo;s behavior as collateral. The sequential bill
              from Part 08 isn&rsquo;t forgiven — it&rsquo;s refinanced, at{' '}
              {TWOTOWER.throughputVsAR} the throughput for 1.3 points of quality.
            </Body>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
