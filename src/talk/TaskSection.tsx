import type { ReactNode } from 'react'
import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, Lede } from '../components/Type'
import { Reveal } from '../components/Reveal'
import { TransductionDemo } from './widgets/TransductionDemo'

/** Mono token chip for the flow strip; `ghost` = dashed future output. */
function Tok({ ghost = false, children }: { ghost?: boolean; children: ReactNode }) {
  return (
    <span
      className={`bg-paper rounded-[7px] border-[1.5px] px-3 py-2 font-mono text-sm ${
        ghost ? 'border-stone text-stone border-dashed' : 'border-ink'
      }`}
    >
      {children}
    </span>
  )
}

function FlowArrow() {
  return <span className="text-stone text-[22px]">→</span>
}

/** Part 01 · The task — sequence transduction. */
export function TaskSection() {
  return (
    <Section id="task" variant="paper">
      <Wrap>
        <Reveal>
          <Eyebrow accent="clay">Part 01 · The task</Eyebrow>
        </Reveal>
        <Reveal>
          <H2>Turn one sequence into another.</H2>
        </Reveal>
        <Reveal>
          <Lede>
            The paper addresses the task of <strong>sequence transduction</strong>: map a
            variable-length
            input sequence to a variable-length output sequence, where the alignment between the
            two is latent — nobody tells the model which output token corresponds to which input
            token.
          </Lede>
        </Reveal>

        <Reveal>
          <div aria-hidden="true" className="mt-12 flex flex-wrap items-center gap-[18px]">
            <div className="flex flex-wrap gap-2">
              <Tok>x₁</Tok>
              <Tok>x₂</Tok>
              <Tok>x₃</Tok>
              <Tok>…</Tok>
              <Tok>xₙ</Tok>
            </div>
            <FlowArrow />
            <div className="bg-ink text-paper font-display rounded-[9px] px-[22px] py-4 text-[13px] font-semibold tracking-[0.1em] uppercase">
              {'learned map'}
            </div>
            <FlowArrow />
            <div className="flex flex-wrap gap-2">
              <Tok ghost>y₁</Tok>
              <Tok ghost>y₂</Tok>
              <Tok ghost>…</Tok>
              <Tok ghost>yₘ</Tok>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-[52px]">
          <TransductionDemo />
        </Reveal>

        <Reveal>
          <Body>
            Machine translation is the headline act — it's what the paper benchmarks — but the
            same formulation covers parsing (the paper's own generalization test: English →
            constituency trees), summarization, speech-to-text, and later code, proteins, and
            images. Language modeling is the degenerate case where input and output are the same
            sequence, shifted by one. <em>Hold that thought for the next talk.</em>
          </Body>
        </Reveal>
      </Wrap>
    </Section>
  )
}
