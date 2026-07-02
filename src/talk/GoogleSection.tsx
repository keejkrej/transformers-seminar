import { Reveal } from '../components/Reveal'
import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, Lede } from '../components/Type'
import { ImbalanceBars } from './widgets/ImbalanceBars'
import { LangGraph } from './widgets/LangGraph'

/** Part 03 — Why Google, why then. */
export function GoogleSection() {
  return (
    <Section id="google" variant="paper">
      <Wrap>
        <Reveal>
          <Eyebrow accent="olive">Part 03 · Why Google, why then</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Translate was straining under its own scale.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            Google Translate served <strong>103 languages</strong> and over{' '}
            <strong>100 billion words a day</strong>. The 2016 neural system (GNMT) surpassed
            phrase-based translation — at steep cost: LSTM stacks trained for days on ~100 GPUs,{' '}
            <em>per direction</em>. The cost compounds across every direction.
          </Lede>
        </Reveal>

        <LangGraph />

        <Reveal>
          <ImbalanceBars />
        </Reveal>

        <Reveal>
          <Body>
            So the institutional pressure at Google in 2016–17: a translation architecture that{' '}
            <strong>trains fast enough to iterate</strong>,{' '}
            <strong>parallelizes across cheap accelerators</strong>, and{' '}
            <strong>generalizes across languages</strong> instead of memorizing one pair. That is
            the architecture they set out to find.
          </Body>
        </Reveal>
      </Wrap>
    </Section>
  )
}
