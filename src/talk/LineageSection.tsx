import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede, Body } from '../components/Type'
import { Reveal } from '../components/Reveal'
import { Card, Tag } from '../components/Card'

/** Part 04 — Lineage: the three inherited ideas and the daring subtraction. */
export function LineageSection() {
  return (
    <Section id="lineage" variant="tint">
      <Wrap>
        <Reveal>
          <Eyebrow accent="clay">Part 04 · Standing on shoulders</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Not one idea in it was new.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            Every ingredient already existed. The paper&rsquo;s contribution was a subtraction: keep
            three inherited ideas, delete the recurrence they were welded to.
          </Lede>
        </Reveal>

        <div className="mt-11 grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          <Reveal>
            <Card className="h-full">
              <Tag accent="clay">Inherited · 2014</Tag>
              <H3>Encoder–decoder</H3>
              <p>
                Sutskever et al.&rsquo;s seq2seq: one network reads the source into representations,
                another writes the target. The Transformer keeps this two-tower blueprint exactly.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full">
              <Tag accent="sky">Inherited · 2014–15</Tag>
              <H3>Attention as alignment</H3>
              <p>
                Bahdanau et al. let the decoder &ldquo;look back&rdquo; at all encoder states with
                learned soft weights — killing the fixed-vector bottleneck. Attention was born as an{' '}
                <em>add-on to</em> RNNs.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.16}>
            <Card className="h-full">
              <Tag accent="olive">Inherited · forever</Tag>
              <H3>Autoregressive factorization</H3>
              <p>
                Generate y one token at a time, each conditioned on everything before:{' '}
                <span className="font-mono text-[0.85em]">p(y)=∏ p(yᵢ|y{'<'}ᵢ, x)</span>. The
                Transformer doesn&rsquo;t touch this — remember that for Part 08.
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-[50px]">
          <svg
            viewBox="0 0 1000 240"
            role="img"
            aria-label="Lineage: seq2seq plus attention minus recurrence equals Transformer"
            className="block h-auto w-full"
          >
            <g className="font-display" fontWeight={600} fontSize={14}>
              <rect
                x={20}
                y={60}
                width={200}
                height={58}
                rx={10}
                className="fill-none stroke-stone"
                strokeWidth={1.5}
              />
              <text x={120} y={85} textAnchor="middle" className="fill-ink">
                seq2seq
              </text>
              <text
                x={120}
                y={104}
                textAnchor="middle"
                className="fill-stone"
                fontSize={11}
                fontWeight={500}
              >
                encoder · decoder
              </text>
              <rect
                x={20}
                y={150}
                width={200}
                height={58}
                rx={10}
                className="fill-none stroke-stone"
                strokeWidth={1.5}
              />
              <text x={120} y={175} textAnchor="middle" className="fill-ink">
                RNN attention
              </text>
              <text
                x={120}
                y={194}
                textAnchor="middle"
                className="fill-stone"
                fontSize={11}
                fontWeight={500}
              >
                Bahdanau / Luong
              </text>
              <text x={285} y={140} textAnchor="middle" fontSize={26} className="fill-olive">
                +
              </text>
              <rect
                x={350}
                y={105}
                width={200}
                height={58}
                rx={10}
                className="fill-none stroke-sky"
                strokeWidth={1.5}
              />
              <text x={450} y={130} textAnchor="middle" className="fill-ink">
                − recurrence
              </text>
              <text
                x={450}
                y={149}
                textAnchor="middle"
                className="fill-stone"
                fontSize={11}
                fontWeight={500}
              >
                the daring subtraction
              </text>
              <text x={610} y={140} textAnchor="middle" fontSize={26} className="fill-olive">
                =
              </text>
              <rect x={670} y={90} width={310} height={88} rx={12} className="fill-ink" />
              <text x={825} y={128} textAnchor="middle" className="fill-paper" fontSize={17}>
                Transformer
              </text>
              <text
                x={825}
                y={150}
                textAnchor="middle"
                className="fill-clay"
                fontSize={11.5}
                fontWeight={500}
              >
                attention, and only attention
              </text>
            </g>
          </svg>
        </Reveal>

        <Reveal>
          <Body>
            The title is a thesis statement, not a slogan. The question the paper actually asks:{' '}
            <em>
              if attention is doing the useful work inside recurrent translation models, do we need
              the recurrence at all?
            </em>
          </Body>
        </Reveal>
      </Wrap>
    </Section>
  )
}
