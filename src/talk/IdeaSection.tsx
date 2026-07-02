import type { ReactNode } from 'react'
import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, Lede, Note } from '../components/Type'
import { Reveal } from '../components/Reveal'
import { Card, Tag } from '../components/Card'
import { Code } from '../components/Code'
import { Math } from '../components/Math'
import { AttentionPlayground } from './widgets/AttentionPlayground'
import { MultiHeadDiagram } from './widgets/MultiHeadDiagram'
import { PECanvas } from './widgets/PECanvas'
import { ArchDiagram } from './widgets/ArchDiagram'
import { TranslationWalkthrough } from './widgets/TranslationWalkthrough'

/** Clay small-caps label with a leading dash — separates the blocks of Part 05. */
function BlockLabel({ first = false, children }: { first?: boolean; children: ReactNode }) {
  return (
    <div
      className={`font-display text-clay ${first ? 'mt-[70px]' : 'mt-24'} mb-[18px] flex items-center gap-3.5 text-xs font-semibold tracking-[0.2em] uppercase before:h-0.5 before:w-[26px] before:bg-clay before:content-['']`}
    >
      {children}
    </div>
  )
}

/** Inline mono span, slightly shrunk like the original `.mono`. */
function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.85em]">{children}</span>
}

const QKV_CARDS: { accent: 'clay' | 'sky' | 'olive' | 'gray'; tag: string; copy: ReactNode }[] = [
  {
    accent: 'clay',
    tag: 'Q · query',
    copy: <>What this token is looking for — for example, a pronoun seeking its referent.</>,
  },
  {
    accent: 'sky',
    tag: 'K · key',
    copy: <>What each token offers. Query·key dot products become compatibility scores.</>,
  },
  {
    accent: 'olive',
    tag: 'V · value',
    copy: <>What a token contributes once selected. The output is a weighted average of values.</>,
  },
  {
    accent: 'gray',
    tag: '√dₖ · the scale',
    copy: (
      <>
        Dot products grow with dimension; unscaled, softmax saturates and gradients vanish. A
        single scaling division corrects this.
      </>
    ),
  },
]

const TABLE_HEAD = ['layer type', 'compute / layer', 'sequential ops', 'max path length']

const TABLE_ROWS: { hl: boolean; cells: string[] }[] = [
  { hl: true, cells: ['self-attention', 'O(n² · d)', 'O(1)', 'O(1)'] },
  { hl: false, cells: ['recurrent', 'O(n · d²)', 'O(n)', 'O(n)'] },
  { hl: false, cells: ['convolutional', 'O(k · n · d²)', 'O(1)', 'O(log_k n)'] },
]

/** Part 05 · What was actually new — the dark centerpiece of the talk. */
export function IdeaSection() {
  return (
    <Section id="new" variant="dark">
      <Wrap>
        <Reveal>
          <Eyebrow accent="clay">Part 05 · What was actually new</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Every token attends to every token, simultaneously.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            Self-attention: each position computes what to pull from every other position — in
            one matrix multiply, no steps, no chain. Distance costs nothing. Here is the
            coreference example from Google's announcement post for the paper, live:
          </Lede>
        </Reveal>

        <Reveal>
          <AttentionPlayground />
        </Reveal>

        <Reveal>
          <BlockLabel first>The mechanism</BlockLabel>
        </Reveal>
        <Reveal>
          <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] py-[30px] text-center text-[clamp(1.15rem,3vw,1.9rem)]">
            <Math block>
              {String.raw`\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V`}
            </Math>
          </div>
        </Reveal>
        <div className="mt-11 grid grid-cols-4 gap-[18px] max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">
          {QKV_CARDS.map((c) => (
            <Reveal key={c.tag}>
              <Card className="h-full">
                <Tag accent={c.accent}>{c.tag}</Tag>
                <p>{c.copy}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <Body>
            The formula is also the implementation. Two matrix multiplies with a softmax between
            them — the entire mechanism is shorter than its own explanation:
          </Body>
        </Reveal>
        <Reveal>
          <Code label="scaled dot-product attention · PyTorch" className="mt-[26px]">
            {`
def attention(Q, K, V, mask=None):
    scores = Q @ K.transpose(-2, -1) / math.sqrt(K.size(-1))  # QK^T / sqrt(d_k)
    if mask is not None:                                      # decoder only:
        scores = scores.masked_fill(mask == 0, -torch.inf)    #   hide the future
    return scores.softmax(dim=-1) @ V                         # weigh the values
            `}
          </Code>
        </Reveal>

        <Reveal>
          <BlockLabel>Multi-head attention: several relations at once</BlockLabel>
        </Reveal>
        <Reveal>
          <Lede>
            One head has a structural limit: softmax produces a <em>single</em> distribution, so
            each token gets one weighted average — it can ask only one question of its context per
            layer. But a token routinely needs several answers at once. In the sentence above,
            “it” must find its referent, its governing verb, and its local modifiers{' '}
            <em>simultaneously</em> — three different relations, three different places to look.
          </Lede>
        </Reveal>
        <Reveal>
          <Body>
            The paper's answer: run the mechanism <strong>h = 8 times in parallel</strong>, each
            copy with its own learned projections into a small subspace, then concatenate and mix:
          </Body>
        </Reveal>
        <Reveal>
          <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] py-[26px] text-center text-[clamp(0.95rem,2.2vw,1.35rem)]">
            <Math block>
              {String.raw`\begin{aligned}\mathrm{MultiHead}(Q,K,V)&=\mathrm{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_8)\,W^{O}\\[3pt]\mathrm{head}_i&=\mathrm{Attention}(QW_i^{Q},\,KW_i^{K},\,VW_i^{V})\end{aligned}`}
            </Math>
          </div>
        </Reveal>
        <Reveal>
          <Code label="multi-head = slice, attend, concatenate" className="mt-[26px]">
            {`
Q = (x @ W_Q).view(n, h, d // h)                  # slice the width: 512 = 8 x 64
K = (x @ W_K).view(n, h, d // h)                  # (same attention() as above,
V = (x @ W_V).view(n, h, d // h)                  #  once per 64-dim slice)
heads = [attention(Q[:, i], K[:, i], V[:, i]) for i in range(h)]
out = torch.cat(heads, dim=-1) @ W_O              # concatenate and mix
            `}
          </Code>
        </Reveal>
        <Reveal>
          <MultiHeadDiagram />
        </Reveal>
        <div className="mt-9 grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
          <Reveal>
            <Card className="h-full">
              <Tag accent="clay">Slices, not copies</Tag>
              <p>
                The heads do not attend at full width eight times. Each projects down to{' '}
                <Mono>d_k = d_v = 64</Mono> dimensions, and 8 × 64 = 512 — the total cost stays
                close to a single full-width head. Width is divided, not multiplied.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.06}>
            <Card className="h-full">
              <Tag accent="sky">Different learned lenses</Tag>
              <p>
                Each head owns its own <Mono>W_Q, W_K, W_V</Mono> — its own definition of
                relevance. The paper's appendix finds heads specializing in syntax, in
                coreference, in long-distance dependencies; nothing assigns these roles, the
                projections learn them.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.12}>
            <Card className="h-full">
              <Tag accent="olive">Softmax must choose</Tag>
              <p>
                Within a head, the weights sum to 1 — attending more to one token means attending
                less to every other. Separate heads decouple competing needs instead of blending
                them into one compromised distribution.
              </p>
            </Card>
          </Reveal>
        </div>
        <Reveal>
          <Body>
            The three heads you toggled in the playground above are exactly this — one mechanism,
            three learned lenses. The full model uses multi-head attention in three places:
            encoder self-attention, <em>masked</em> decoder self-attention, and decoder→encoder
            cross-attention. (Years later the per-head keys and values became the dominant serving
            cost — the subject of Module M1.)
          </Body>
        </Reveal>

        <Reveal>
          <BlockLabel>One problem: attention ignores word order</BlockLabel>
        </Reveal>
        <Reveal>
          <Lede>
            Delete recurrence and word order vanishes — “dog bites man” = “man bites dog”. The
            solution: <strong>add position into the embedding itself</strong>. Each embedding
            dimension pair oscillates as a sinusoid with its own wavelength:
          </Lede>
        </Reveal>
        <Reveal>
          <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] py-6 text-center text-[clamp(0.95rem,2.2vw,1.35rem)]">
            <Math block>
              {String.raw`PE_{(pos,\,2i)}=\sin\!\left(\frac{pos}{10000^{2i/d}}\right),\qquad PE_{(pos,\,2i+1)}=\cos\!\left(\frac{pos}{10000^{2i/d}}\right)`}
            </Math>
          </div>
        </Reveal>
        <Reveal>
          <Body>
            Two indices, two axes: <Mono>pos</Mono> says <em>which token</em> — the position in
            the sequence — while <Mono>i</Mono> says <em>which coordinate of the embedding
            vector</em>, indexing its <Mono>d/2</Mono> dimension pairs (pair i holds a sine and a
            cosine at the same wavelength). In the demo below, each curve is one value of{' '}
            <Mono>i</Mono>; the slider moves <Mono>pos</Mono>.
          </Body>
        </Reveal>
        <Reveal>
          <Code label="the whole positional-encoding table · NumPy" className="mt-[26px]">
            {`
pos = np.arange(n)[:, None]           # which token           -- shape (n, 1)
i   = np.arange(d // 2)[None, :]      # which dimension pair  -- shape (1, d/2)
angle = pos / 10000 ** (2 * i / d)    # one wavelength per pair, 2pi ... 10000*2pi

PE = np.empty((n, d))
PE[:, 0::2] = np.sin(angle)           # even coordinates
PE[:, 1::2] = np.cos(angle)           # odd coordinates
x = embed(tokens) + PE                # added once, below the first layer
            `}
          </Code>
        </Reveal>
        <Reveal>
          <Body>
            The wavelengths form a geometric progression, from 2π up to 10000·2π — that spread is
            the point. The fast waves (short wavelength) change noticeably from one token to the
            next, so they distinguish <em>neighbors</em>; the slow waves barely move across a
            sentence, so they encode <em>coarse regions</em> of the sequence. It is a smooth
            analog of a binary counter, where low bits flip fast and high bits flip rarely.
            Reading all dimensions at once — the vertical slice in the demo below — gives every
            position a unique fingerprint, and because sines and cosines shift by rotation, any
            fixed offset is a linear transform: the hook the paper hoped attention would use.
          </Body>
        </Reveal>
        <Reveal>
          <Note>
            Two asides for the physically minded. This is a <em>Fourier-feature map</em>: a scalar
            coordinate represented by its projections onto a bank of sinusoids across frequencies
            — the same device NeRF and Segment Anything later used for spatial coordinates. And
            there is a second-quantization reading: attention treats tokens as an unordered
            collection — indistinguishable particles — so order must live in each token's state
            rather than in a slot index, the way occupation of a mode replaces particle labels.
          </Note>
        </Reveal>
        <Reveal>
          <PECanvas />
        </Reveal>
        <Reveal>
          <Body>
            Sinusoids are not the only option — the paper also tested simply{' '}
            <strong>learning an embedding vector per position</strong>, as ordinary trainable
            parameters, and measured nearly identical quality (Table 3, row E). Sinusoids won the
            tie on the hope of generalizing past trained lengths. History split the difference:
            BERT, GPT-2, and ViT all shipped learned position embeddings; the sinusoids' true
            legacy is their frequency spectrum, which lives on inside RoPE.
          </Body>
        </Reveal>
        <Reveal>
          <Body>
            This need is not a translation quirk — it follows every Transformer derivative,
            because attention is permutation-invariant wherever it goes: any structure the data
            has must be injected explicitly. ViT adds position embeddings to its image patches
            (without them, an image is a bag of patches); DETR uses a 2D sinusoidal variant over
            the image plane; Segment Anything encodes prompt clicks with Fourier-feature
            positional encodings; and diffusion models reuse the 2017 sinusoid formula itself to
            embed the denoising <em>timestep</em>. Whenever something is tokenized — pixels,
            points, time — a positional encoding rides along.
          </Body>
        </Reveal>
        <Reveal>
          <Body className="text-(--note)!">
            Within language models, the additive scheme is the part of the paper that aged
            fastest — modern LLMs rotate queries and keys inside attention instead.{' '}
            <a
              href="#rope"
              className="font-display text-clay text-[11px] font-semibold tracking-[0.14em] uppercase no-underline transition-opacity hover:opacity-75"
            >
              M7 · Rotary position embeddings →
            </a>
          </Body>
        </Reveal>

        <Reveal>
          <BlockLabel>The full machine</BlockLabel>
        </Reveal>
        <ArchDiagram />

        <Reveal>
          <BlockLabel>The machine at work: one sentence, end to end</BlockLabel>
        </Reveal>
        <Reveal>
          <Lede>
            One parallel pass, then a loop. The encoder reads the whole English sentence at once
            and produces one contextual vector per token — those vectors then sit fixed. The
            decoder starts from a <strong>start-of-sequence token</strong> <Mono>‹s›</Mono> and
            builds the German one word at a time: masked self-attention re-reads what it has
            written so far, <strong>cross-attention</strong> sends queries from the German side
            into the frozen English vectors (they supply the keys and values), and the softmax
            names the next token — which is appended to the decoder's own input for the following
            step, until the model emits <Mono>‹/s›</Mono>.
          </Lede>
        </Reveal>
        <Reveal>
          <TranslationWalkthrough />
        </Reveal>
        <Reveal>
          <Body>
            Step through it — or click any German token to revisit the cross-attention that
            produced it. The step worth the detour is <em>unterzeichnet</em>: German pushes the
            participle to the end of the clause, so the decoder must reach back to “signed”,
            seven tokens away, at the moment word order diverges most. That reach <em>is</em> the
            alignment matrix of the 2014 attention papers, reborn as one head of cross-attention.
          </Body>
        </Reveal>
        <Reveal>
          <Body>
            One distinction keeps the whole design honest: this token-by-token loop is{' '}
            <strong>inference only</strong>. During training no loop runs — the full German
            sentence is fed in at once, shifted one position right behind <Mono>‹s›</Mono>, and
            the causal mask from step 4 lets every position predict its successor{' '}
            <em>simultaneously</em>. Autoregressive semantics, parallel compute. (At test time
            the paper decodes with beam search, width 4, rather than greedily taking each
            argmax.)
          </Body>
        </Reveal>

        <Reveal>
          <BlockLabel>Why it wins asymptotically — the paper's Table 1</BlockLabel>
        </Reveal>
        <Reveal>
          <div className="mt-[26px] overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr>
                  {TABLE_HEAD.map((h) => (
                    <th
                      key={h}
                      className="font-display border-b-[1.5px] border-(--card-line) px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.12em] text-(--note) uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row) => (
                  <tr key={row.cells[0]}>
                    {row.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`font-mono border-b border-(--card-line) px-4 py-[13px] text-[14px] ${
                          row.hl ? 'text-clay' : 'text-fog'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <Reveal>
          <Body>
            Yes, self-attention is quadratic in sequence length — but for 2017 translation,
            sentences (<Mono>n ≈ 70</Mono>) were far shorter than the model width (
            <Mono>d = 512</Mono>), so <Mono>n²d</Mono> beat <Mono>nd²</Mono> comfortably. The
            quadratic term was a worthwhile trade then. It becomes the central problem of Part 08.
          </Body>
        </Reveal>
      </Wrap>
    </Section>
  )
}
