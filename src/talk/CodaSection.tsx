import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, Lede } from '../components/Type'
import { Reveal } from '../components/Reveal'
import { MODULES } from '../data/modules'

const REF_LINK = 'text-fog decoration-linedark hover:text-paper'

/** Part 09 — Coda: closing title, sign-off copy, and the references list. */
export function CodaSection() {
  return (
    <Section id="close" variant="dark">
      <Wrap>
        <Reveal>
          <Eyebrow accent="clay">Part 09 · Coda</Eyebrow>
        </Reveal>

        <Reveal>
          <H2 className="max-w-[18ch]! text-[clamp(2.2rem,6vw,4.6rem)]! tracking-[-0.02em]!">
            Attention was all we needed —{' '}
            <em className="text-clay not-italic">to get started.</em>
          </H2>
        </Reveal>

        <Reveal>
          <Lede className="mt-[26px]">
            Nine years on, the 2017 blueprint is being disassembled by the same logic that created
            it: find the part doing the real work, delete the rest. It happened to recurrence.
            It's happening to full attention, to dense FFNs, and now to autoregression itself.
            That's not the paper failing — that's the paper's method, still running.
          </Lede>
        </Reveal>

        <Reveal>
          <Body className="text-(--note)!">
            Next talk in this seminar: <strong className="text-fog">GPT-2</strong> — what happens
            when the encoder is removed, only the masked half is retained, and the model commits
            fully to next-token prediction.
          </Body>
        </Reveal>

        <Reveal>
          <div className="mt-[60px] columns-1 gap-11 text-[13.5px] text-(--note) md:columns-2">
            <div className="mb-2.5 break-inside-avoid">
              Vaswani et al.,{' '}
              <a href="https://arxiv.org/abs/1706.03762" className={REF_LINK}>
                Attention Is All You Need
              </a>
              , NeurIPS 2017
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Sutskever, Vinyals &amp; Le, Sequence to Sequence Learning, 2014
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Bahdanau, Cho &amp; Bengio, Neural MT by Jointly Learning to Align and Translate,
              2014
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Wu et al., Google's Neural Machine Translation System (GNMT), 2016
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Shazeer et al., Outrageously Large Neural Networks (MoE), 2017
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Dao et al., FlashAttention, 2022 · Leviathan et al., Speculative Decoding, 2022
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Ainslie et al., GQA, 2023 · DeepSeek-V2, MLA, 2024
            </div>
            <div className="mb-2.5 break-inside-avoid">
              Gu &amp; Dao, Mamba, 2023 · Mamba-2, 2024
            </div>
            <div className="mb-2.5 break-inside-avoid">
              NVIDIA,{' '}
              <a
                href="https://huggingface.co/nvidia/Nemotron-Labs-TwoTower-30B-A3B-Base-BF16"
                className={REF_LINK}
              >
                Nemotron-Labs-TwoTower-30B-A3B
              </a>
              , 2026
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-[13.5px] text-(--note)">
            <span>Extension modules — jump back up:</span>
            {MODULES.map((m) => (
              <a key={m.slug} href={`#${m.slug}`} className={REF_LINK}>
                {m.num} · {m.title}
              </a>
            ))}
          </div>
        </Reveal>
      </Wrap>
    </Section>
  )
}
