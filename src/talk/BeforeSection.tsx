import { Card, Tag } from '../components/Card'
import { Reveal } from '../components/Reveal'
import { Section, Wrap } from '../components/Section'
import { Eyebrow, H2, H3, Lede, Note } from '../components/Type'
import { PathViz } from './widgets/PathViz'
import { RaceWidget } from './widgets/RaceWidget'

function Mono({ children }: { children: string }) {
  return <span className="font-mono text-[0.85em]">{children}</span>
}

/** Part 02 · Life before — recurrence, its two failure modes, and the fix. */
export function BeforeSection() {
  return (
    <Section id="before" variant="tint">
      <Wrap>
        <Reveal>
          <Eyebrow accent="sky">Part 02 · Life before</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Recurrence was the law, and the law was slow.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            In 2017 the state of the art — LSTMs and GRUs — read text the way we do: one token at a
            time, left to right, squeezing everything seen so far into a fixed-size hidden state.
            Elegant. And crippling, for two separate reasons.
          </Lede>
        </Reveal>

        <Reveal>
          <RaceWidget />
        </Reveal>

        <div className="mt-11 grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">
          <Reveal>
            <Card className="h-full">
              <Tag accent="sky">RNN</Tag>
              <H3>One state to rule them all</H3>
              <p>
                The entire past is compressed into one vector. Gradients flowing back through
                hundreds of steps vanish or explode — long-range dependencies dissolve.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full">
              <Tag accent="sky">LSTM / GRU</Tag>
              <H3>Gates buy time, not freedom</H3>
              <p>
                Gating (1997!) lets information survive longer, and attention bolted on top helped.
                But computation is still a chain: <Mono>O(n)</Mono> sequential steps, memory-bound,
                slow to train.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full">
              <Tag accent="sky">ConvS2S · ByteNet</Tag>
              <H3>Convolutions: parallel, but myopic</H3>
              <p>
                CNN stacks compute in parallel, yet relating position 1 to position n takes{' '}
                <Mono>O(n/k)</Mono> or <Mono>O(log n)</Mono> stacked layers. Distance still costs
                depth.
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-[26px]">
          <PathViz />
        </Reveal>
        <Reveal>
          <Note>
            Bonus aside for the graph-minded: a Transformer is essentially a message-passing GNN
            running on the complete graph over tokens — every node talks to every node, edge
            weights computed on the fly.
          </Note>
        </Reveal>
      </Wrap>
    </Section>
  )
}
