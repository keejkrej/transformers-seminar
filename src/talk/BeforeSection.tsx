import { Card, Tag } from '../components/Card'
import { Reveal } from '../components/Reveal'
import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, H3, Lede } from '../components/Type'
import { Math } from '../components/Math'
import { CompleteGraph } from './widgets/CompleteGraph'
import { PathViz } from './widgets/PathViz'
import { RaceWidget } from './widgets/RaceWidget'
import { RNNDiagram } from './widgets/RNNDiagram'

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
          <H2>Recurrence was the default, and it was inherently slow.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            In 2017 the state of the art — LSTMs and GRUs — processed text sequentially: one token
            at a time, left to right, compressing everything seen so far into a fixed-size hidden
            state. Elegant, but limiting in two distinct ways.
          </Lede>
        </Reveal>

        <Reveal className="mt-11">
          <H3>First, what a recurrent network is</H3>
          <Body>
            An RNN reads a sequence one token at a time. At step{' '}
            <span className="font-mono text-[0.85em]">t</span> it combines the current input{' '}
            <span className="font-mono text-[0.85em]">xₜ</span> with the hidden state{' '}
            <span className="font-mono text-[0.85em]">hₜ₋₁</span> carried over from the previous
            step, producing a new hidden state <span className="font-mono text-[0.85em]">hₜ</span> —
            a running summary of everything seen so far — and, optionally, an output{' '}
            <span className="font-mono text-[0.85em]">yₜ</span>. Crucially, the <em>same</em> weights
            are reused at every step; only the data advances.
          </Body>
        </Reveal>

        <Reveal>
          <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] py-6 text-center text-[clamp(1rem,2.4vw,1.4rem)]">
            <Math block>
              {String.raw`h_t=\tanh\!\left(W_x\,x_t+W_h\,h_{t-1}+b\right),\qquad y_t=W_y\,h_t`}
            </Math>
          </div>
        </Reveal>

        <Reveal className="mt-[26px]">
          <RNNDiagram />
        </Reveal>

        <Reveal>
          <Body className="mt-11">
            That design creates <strong>two distinct problems</strong>. The first is about speed;
            the second is about what the model can learn at all.
          </Body>
        </Reveal>
        <Reveal>
          <RaceWidget />
        </Reveal>

        <Reveal className="mt-14">
          <H3>The vanishing-gradient problem</H3>
          <Body>
            To connect the first word to the last, a signal must pass through every step in between.
            Training backpropagates along that same chain, and each step multiplies the gradient by
            the recurrent weights — so over dozens of steps it shrinks toward zero (or blows up).
            Distant words effectively stop influencing each other, and{' '}
            <strong>long-range dependencies are lost</strong>. Self-attention removes the chain
            entirely: any two positions are one hop apart.
          </Body>
        </Reveal>
        <Reveal className="mt-[26px]">
          <PathViz />
        </Reveal>

        <Reveal className="mt-14">
          <H3>How the field responded</H3>
        </Reveal>
        <div className="mt-[18px] grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">
          <Reveal>
            <Card className="h-full">
              <Tag accent="sky">RNN</Tag>
              <H3>Everything compressed into one state</H3>
              <p>
                The entire past is compressed into a single vector. Gradients flowing back through
                hundreds of steps vanish or explode — long-range dependencies are lost.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full">
              <Tag accent="sky">LSTM / GRU</Tag>
              <H3>Gates extend memory, not parallelism</H3>
              <p>
                Gating (introduced in 1997) lets information survive longer, and adding attention on
                top helped further. But computation remains a chain: <Mono>O(n)</Mono> sequential
                steps, memory-bound, slow to train.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full">
              <Tag accent="sky">ConvS2S · ByteNet</Tag>
              <H3>Convolutions: parallel, but local</H3>
              <p>
                CNN stacks compute in parallel, yet relating position 1 to position n takes{' '}
                <Mono>O(n/k)</Mono> or <Mono>O(log n)</Mono> stacked layers. Distance still costs
                depth.
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <div className="rounded-[14px] border-[1.5px] border-olive bg-(--card-bg) px-7 py-7">
            <Tag accent="olive">Connection · graph neural networks</Tag>
            <div className="mt-1 grid items-center gap-x-10 gap-y-6 md:grid-cols-[1.5fr_1fr]">
              <div>
                <H3>Self-attention is message passing</H3>
                <Body className="mt-0!">
                  A <strong>graph neural network</strong> represents data as nodes joined by edges.
                  Each node updates itself by gathering — &ldquo;passing messages&rdquo; from — its
                  neighbours, and stacking layers repeats the exchange. It is the natural model for
                  anything relational: molecules, social networks, road maps.
                </Body>
                <Body>
                  Seen this way, self-attention is a GNN on the <em>complete</em> graph over tokens:
                  every token is a node, every pair is an edge, and one attention layer is a single
                  round of message passing — every node attends to every other, with the edge
                  weights (the attention scores) computed on the fly. Recurrence walks the sequence
                  step by step; attention wires all of it at once.
                </Body>
              </div>
              <div className="mx-auto w-full max-w-[300px]">
                <CompleteGraph />
              </div>
            </div>
          </div>
        </Reveal>
      </Wrap>
    </Section>
  )
}
