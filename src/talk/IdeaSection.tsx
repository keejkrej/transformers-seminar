import type { ReactNode } from 'react'
import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, Lede } from '../components/Type'
import { Reveal } from '../components/Reveal'
import { Card, Tag } from '../components/Card'
import { Math } from '../components/Math'
import { AttentionPlayground } from './widgets/AttentionPlayground'
import { PECanvas } from './widgets/PECanvas'
import { ArchDiagram } from './widgets/ArchDiagram'

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
    copy: <>What this token is looking for. “I'm a pronoun — who's my referent?”</>,
  },
  {
    accent: 'sky',
    tag: 'K · key',
    copy: <>What each token advertises. Query·key dot products become compatibility scores.</>,
  },
  {
    accent: 'olive',
    tag: 'V · value',
    copy: <>What a token hands over once selected. The output is a weighted average of values.</>,
  },
  {
    accent: 'gray',
    tag: '√dₖ · the scale',
    copy: (
      <>
        Dot products grow with dimension; unscaled, softmax saturates and gradients die. One
        tiny division fixes it.
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
          <H2>Every token looks at every token. At once.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            Self-attention: each position computes what to pull from every other position — in
            one matrix multiply, no steps, no chain. Distance costs nothing. Here is the
            paper's own example (its Figure 8), live:
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
            Run that <strong>h = 8 times in parallel</strong> with different learned
            projections (<Mono>d_k = d_v = 64</Mono> each, concatenated back to 512) and you
            get <strong>multi-head attention</strong> — eight subspaces attending to different
            things, like the three heads you toggled above. Attention is used three ways in
            the model: encoder self-attention, <em>masked</em> decoder self-attention, and
            decoder→encoder cross-attention.
          </Body>
        </Reveal>

        <Reveal>
          <BlockLabel>One problem: attention is a bag, not a sequence</BlockLabel>
        </Reveal>
        <Reveal>
          <Lede>
            Delete recurrence and word order vanishes — “dog bites man” = “man bites dog”. The
            fix: <strong>add position into the embedding itself</strong>, as sinusoids of
            geometrically spaced frequencies. Every position gets a unique waveform
            fingerprint; relative offsets become linear transforms.
          </Lede>
        </Reveal>
        <Reveal>
          <PECanvas />
        </Reveal>

        <Reveal>
          <BlockLabel>The full machine</BlockLabel>
        </Reveal>
        <ArchDiagram />

        <Reveal>
          <BlockLabel>Why this wins on paper — literally Table 1</BlockLabel>
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
            <Mono>d = 512</Mono>), so <Mono>n²d</Mono> beat <Mono>nd²</Mono> handily. The
            quadratic term was a bargain then. It becomes the villain of Part 08.
          </Body>
        </Reveal>
      </Wrap>
    </Section>
  )
}
