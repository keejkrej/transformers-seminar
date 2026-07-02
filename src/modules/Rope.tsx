import { ModuleLayout } from '../components/ModuleLayout'
import type { Reference } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Reveal } from '../components/Reveal'
import { Body, Eyebrow, H2, H3, Lede, Note } from '../components/Type'
import { Card, Stat, Tag } from '../components/Card'
import { Code } from '../components/Code'
import { Math } from '../components/Math'
import RopeDials from './widgets/rope-dials'

const REFERENCES: Reference[] = [
  {
    label: 'Vaswani et al. 2017 — Attention Is All You Need, §3.5 (sinusoidal positional encoding)',
    url: 'https://arxiv.org/abs/1706.03762',
  },
  {
    label: 'Shaw, Uszkoreit & Vaswani 2018 — Self-Attention with Relative Position Representations',
    url: 'https://arxiv.org/abs/1803.02155',
  },
  {
    label: 'Dai et al. 2019 — Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context',
    url: 'https://arxiv.org/abs/1901.02860',
  },
  {
    label: 'Raffel et al. 2020 — T5: Exploring the Limits of Transfer Learning (bucketed relative biases)',
    url: 'https://arxiv.org/abs/1910.10683',
  },
  {
    label: 'Su et al. 2021 — RoFormer: Enhanced Transformer with Rotary Position Embedding (RoPE)',
    url: 'https://arxiv.org/abs/2104.09864',
  },
  {
    label: 'Press, Smith & Lewis 2022 — Train Short, Test Long: Attention with Linear Biases (ALiBi)',
    url: 'https://arxiv.org/abs/2108.12409',
  },
  {
    label: 'Chen et al. 2023 — Extending Context Window via Position Interpolation',
    url: 'https://arxiv.org/abs/2306.15595',
  },
  {
    label: 'Peng et al. 2023 — YaRN: Efficient Context Window Extension of Large Language Models',
    url: 'https://arxiv.org/abs/2309.00071',
  },
  {
    label: 'Grattafiori et al. 2024 — The Llama 3 Herd of Models (RoPE base 500,000 at 128K context)',
    url: 'https://arxiv.org/abs/2407.21783',
  },
  {
    label: 'Wang et al. 2024 — Qwen2-VL (M-RoPE: rotary position over time, height, width)',
    url: 'https://arxiv.org/abs/2409.12191',
  },
]

export default function Rope() {
  return (
    <ModuleLayout
      slug="rope"
      chips={[
        'RoFormer · 2021',
        'q·k → f(m−n, content)',
        'same spectrum as 2017',
        'zero parameters',
        'LLaMA default since 2023',
        'PI · NTK · YaRN · base 500k',
      ]}
      heroExtra={
        <Body>
          Part 05 showed position entering the model once, added to the embeddings at the bottom of
          the stack. This module follows position's migration <em>into attention itself</em> —
          ending at the design used by essentially every current model, where queries and keys are
          rotated so that the attention score depends on relative distance by construction.
        </Body>
      }
      references={REFERENCES}
      bare
    >
      {/* ---- 01 · what 2017 hoped ------------------------------------- */}
      <Section variant="paper" id="m7-hypothesis">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2017 · the additive hypothesis</Eyebrow>
            <H2>Position was an ingredient, not a structure</H2>
            <Lede>
              Deleting recurrence removed word order, and the 2017 fix was minimal: compute a
              deterministic vector for each position and add it to the token embedding, once,
              before the first layer.
            </Lede>
            <Math block>
              {String.raw`PE_{(pos,\,2i)}=\sin\!\left(\frac{pos}{10000^{2i/d}}\right),\qquad PE_{(pos,\,2i+1)}=\cos\!\left(\frac{pos}{10000^{2i/d}}\right)`}
            </Math>
            <Body>
              The paper's stated reason for choosing sinusoids over learned embeddings is a
              hypothesis about <em>relative</em> position: for any fixed offset k,{' '}
              <Math>{String.raw`PE_{pos+k}`}</Math> is a linear function of{' '}
              <Math>{String.raw`PE_{pos}`}</Math>, so the model could in principle learn to attend
              by offsets. In principle. Nothing in the architecture enforces it.
            </Body>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="gray">Shortcoming 1</Tag>
                <H3>Absolute anchors</H3>
                <p>
                  The attention score between positions m and n entangles both absolute positions
                  with the content. "Three tokens apart" is not represented — only "position 14
                  meets position 11."
                </p>
              </Card>
              <Card>
                <Tag accent="gray">Shortcoming 2</Tag>
                <H3>Injected once</H3>
                <p>
                  Position enters at the bottom of the stack and must survive dozens of residual
                  layers to influence the attention that needs it. Deep layers see position only
                  through whatever the network chose to preserve.
                </p>
              </Card>
              <Card>
                <Tag accent="gray">Shortcoming 3</Tag>
                <H3>No length generalization</H3>
                <p>
                  Sinusoids extend past the training length mathematically, but models trained at
                  512 positions degrade sharply when evaluated longer. The hoped-for extrapolation
                  did not materialize.
                </p>
              </Card>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 02 · the relative turn ------------------------------------ */}
      <Section variant="tint" id="m7-relative">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2018 → 2022 · the relative turn</Eyebrow>
            <H2>Distance moves into the score</H2>
            <Lede>
              A four-year sequence of designs made the same correction from different angles: what
              attention should see is not <em>where</em> two tokens are, but <em>how far apart</em>{' '}
              they are.
            </Lede>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Card>
                <Tag accent="sky">2018 · Shaw, Uszkoreit &amp; Vaswani</Tag>
                <H3>Learned offset embeddings</H3>
                <p>
                  Two of the original authors retrofit their own architecture: learn an embedding
                  per relative offset (clipped beyond ±k) and add it to the keys and values.
                  Absolute encodings become unnecessary — the first demonstration that relative is
                  what mattered.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">2019 · Transformer-XL</Tag>
                <H3>Relative scores for reusable states</H3>
                <p>
                  Caching segments of hidden states only works if position is relative — an
                  absolute "position 3" means something different in every segment. The attention
                  score is decomposed into content–content and content–position terms with
                  sinusoidal relative encodings.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">2020 · T5</Tag>
                <H3>Scalar biases per distance bucket</H3>
                <p>
                  Strip position down to a learned scalar added to the logit, one per bucketed
                  distance, shared across layers. Crude, cheap, effective — evidence that even a
                  number per distance recovers most of the benefit.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">2022 · ALiBi</Tag>
                <H3>Distance as a penalty</H3>
                <p>
                  Skip learning entirely: subtract m·|distance| from every logit, a different slope
                  m per head. Trained at 1K, evaluates at longer lengths without modification —
                  the most explicit statement that attention benefits from a built-in recency
                  bias.
                </p>
              </Card>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 03 · the mechanism ---------------------------------------- */}
      <Section variant="dark" id="m7-mechanism">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2021 · RoFormer</Eyebrow>
            <H2>Position as rotation</H2>
            <Lede>
              Su et al. asked for the property directly: find a transform of queries and keys such
              that their dot product depends only on content and relative offset. The solution is
              rotation.
            </Lede>
            <Body>
              Pair up the dimensions of each query and key head, treat each pair as a point in a
              plane, and rotate pair j at position m by the angle m·θⱼ:
            </Body>
            <Math block>
              {String.raw`q_m = R_{\Theta,m}\,W_q x_m,\qquad k_n = R_{\Theta,n}\,W_k x_n,\qquad \theta_j = 10000^{-2j/d}`}
            </Math>
            <Body>
              Rotation matrices compose by adding angles, so the rotations cancel in the score up
              to their difference:
            </Body>
            <Math block>
              {String.raw`\langle R_{\Theta,m}\,q,\; R_{\Theta,n}\,k\rangle \;=\; q^{\top} R_{\Theta,\,n-m}\,k`}
            </Math>
            <Body>
              The attention logit is a function of the two contents and the gap n−m —{' '}
              <strong>relative position by construction</strong>, not by learning. And the
              frequency spectrum θⱼ is exactly the 2017 sinusoid spectrum: RoPE is the original
              hypothesis upgraded to a guarantee, moved from addition on embeddings to rotation
              inside every attention layer.
            </Body>
            <Code label="rotary position embedding · applied to q and k, every layer" accent="sky" className="mt-[26px]">
              {`
def rope(x, pos):                          # x: a query or key, shape (n, d)
    j = torch.arange(d // 2)
    theta = 10000.0 ** (-2 * j / d)        # the 2017 spectrum, unchanged
    m = pos[:, None] * theta               # pair j at position m turns by m*theta_j
    x1, x2 = x[..., 0::2], x[..., 1::2]    # each pair: a point in a plane
    return torch.cat([x1 * m.cos() - x2 * m.sin(),
                      x1 * m.sin() + x2 * m.cos()], dim=-1)

q, k = rope(x @ W_q, pos), rope(x @ W_k, pos)   # nothing added to the embeddings
              `}
            </Code>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-12 grid gap-[18px] md:grid-cols-3">
              <Card>
                <Tag accent="sky">Relative, guaranteed</Tag>
                <p>
                  No parameters, no clipping window, no buckets. The invariance holds at every
                  position for every head, because it is a theorem about rotations rather than a
                  behavior gradient descent must find.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">At every layer</Tag>
                <p>
                  Queries and keys are rotated inside each attention call, so position reaches
                  every layer directly instead of being injected once at the bottom and hopefully
                  preserved.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">Distance-dependent, by intent</Tag>
                <p>
                  With content held fixed, the score decays as the gap grows. Recurrent models had
                  recency as a computational side effect; RoPE reintroduces it as a designed
                  inductive bias — distance-aware attention with none of the sequential cost.
                </p>
              </Card>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 04 · interactive ------------------------------------------ */}
      <Section variant="paper" id="m7-dials">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">Interactive · rotations and the gap</Eyebrow>
            <H2>Watch the rotations cancel</H2>
            <Lede>
              Each dial is one frequency pair; the hands are a query and a key at their positions.
              Move either position, or shift both together, and watch what the score does.
            </Lede>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10">
              <RopeDials />
            </div>
          </Reveal>
          <Reveal>
            <Note>
              The multi-scale dials are the same picture as Part 05's sinusoid stripes — geometric
              frequencies from one full turn per few tokens down to nearly frozen — but acting on
              q and k inside attention instead of on the embeddings below it.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---- 05 · aftermath -------------------------------------------- */}
      <Section variant="tint" id="m7-scaling">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">2023 → · what rotation bought</Eyebrow>
            <H2>Context windows became a dial</H2>
            <Lede>
              Once position is a continuous rotation, it can be rescaled after training — the
              context-extension industry of 2023 onward operates almost entirely on RoPE's
              geometry.
            </Lede>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="olive">Position interpolation</Tag>
                <H3>Slow the dials down</H3>
                <p>
                  Chen et al. (Meta, 2023): scale every position by L_train/L_target, so a longer
                  sequence reuses the angle range the model already knows. Roughly a thousand
                  fine-tuning steps took Llama from 2K to 32K context.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">NTK-aware &amp; YaRN</Tag>
                <H3>Rescale per frequency band</H3>
                <p>
                  Uniform interpolation crowds the fast dials that encode local order. NTK-aware
                  scaling stretches the base instead; YaRN (2023) interpolates each frequency band
                  differently and reaches 128K-token windows.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">Bake it into pretraining</Tag>
                <H3>Raise the base</H3>
                <p>
                  Llama 3.1 pretrains with the base raised from 10,000 to 500,000 — slower dials
                  from the start — supporting 128K contexts natively. The knob is now part of a
                  model's headline spec.
                </p>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="0" label="parameters added by RoPE" accent="sky" />
              <Stat num="2K → 32K" label="context via interpolation, ~1K steps" accent="sky" />
              <Stat num="128K" label="YaRN · Llama 3.1 native" accent="sky" />
              <Stat num="500,000" label="Llama 3.1 rotary base" accent="sky" />
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <H3 className="mt-14">State of play</H3>
            <Body>
              RoPE spread from GPT-J and GPT-NeoX through PaLM to LLaMA, and with LLaMA's descent
              became the effective default: Llama, Mistral, Qwen, Gemma, DeepSeek — including the
              MLA variant of Module M1, which carries a decoupled rotary key precisely so
              compression and RoPE can coexist. The idea keeps generalizing: Qwen2-VL's M-RoPE
              splits the rotary dimensions across time, height, and width, so the same trick
              orders video patches that a 1D position could not.
            </Body>
            <Body>
              The through-line of this module mirrors the talk's: 2017 deleted recurrence and with
              it, order — then spent a line of research deliberately re-adding the one property of
              recurrence worth keeping. Distance sensitivity survived; the sequential computation
              did not.
            </Body>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
