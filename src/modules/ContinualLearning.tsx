import { ModuleLayout } from '../components/ModuleLayout'
import { Section, Wrap } from '../components/Section'
import { Body, Eyebrow, H2, H3, Lede, Note } from '../components/Type'
import { Card, Stat, Tag } from '../components/Card'
import { Reveal } from '../components/Reveal'
import { Math } from '../components/Math'
import { PAPER } from '../data/paper'
import { ContinualLearningPlayground } from './widgets/continual-learning-playground'

const REFERENCES = [
  {
    label:
      'McCloskey & Cohen (1989), Catastrophic Interference in Connectionist Networks, Psych. of Learning and Motivation 24:109–165',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0079742108605368',
  },
  {
    label: 'Kirkpatrick et al. (2016/2017), Overcoming Catastrophic Forgetting in Neural Networks (EWC)',
    url: 'https://arxiv.org/abs/1612.00796',
  },
  {
    label: 'Rusu et al. (2016), Progressive Neural Networks',
    url: 'https://arxiv.org/abs/1606.04671',
  },
  {
    label: 'Ibrahim et al. (2024), Simple and Scalable Strategies to Continually Pre-train LLMs',
    url: 'https://arxiv.org/abs/2403.08763',
  },
  {
    label: 'Gupta et al. (2023), Continual Pre-Training of LLMs: How to (re)warm your model?',
    url: 'https://arxiv.org/abs/2308.04014',
  },
  {
    label: 'Biderman et al. (2024), LoRA Learns Less and Forgets Less (TMLR)',
    url: 'https://arxiv.org/abs/2405.09673',
  },
  {
    label: 'Ilharco et al. (2022), Editing Models with Task Arithmetic (ICLR 2023)',
    url: 'https://arxiv.org/abs/2212.04089',
  },
  {
    label: 'Meng et al. (2022), Locating and Editing Factual Associations in GPT (ROME, NeurIPS 2022)',
    url: 'https://arxiv.org/abs/2202.05262',
  },
  {
    label: 'Meng et al. (2022), Mass-Editing Memory in a Transformer (MEMIT, ICLR 2023)',
    url: 'https://arxiv.org/abs/2210.07229',
  },
  {
    label:
      'Gupta et al. (2024), Model Editing at Scale leads to Gradual and Catastrophic Forgetting (ACL Findings 2024)',
    url: 'https://arxiv.org/abs/2401.07453',
  },
  {
    label: 'Berges et al. (2024), Memory Layers at Scale (Meta)',
    url: 'https://arxiv.org/abs/2412.09764',
  },
  {
    label: 'Lin et al. (2025), Continual Learning via Sparse Memory Finetuning (Meta)',
    url: 'https://arxiv.org/abs/2510.15103',
  },
  {
    label: 'Sun et al. (2024), Learning to (Learn at Test Time): RNNs with Expressive Hidden States (TTT layers)',
    url: 'https://arxiv.org/abs/2407.04620',
  },
  {
    label: 'Behrouz, Zhong & Mirrokni (2025), Titans: Learning to Memorize at Test Time (Google)',
    url: 'https://arxiv.org/abs/2501.00663',
  },
  {
    label:
      'Google Research blog (Nov 7, 2025), Introducing Nested Learning: A new ML paradigm for continual learning (Hope)',
    url: 'https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning/',
  },
  {
    label: 'Behrouz et al. (2025), Nested Learning: The Illusion of Deep Learning Architectures (NeurIPS 2025)',
    url: 'https://openreview.net/forum?id=nbMeRvNb7A',
  },
  {
    label: 'Zvi Mowshowitz summary of Dwarkesh Patel’s June 2025 continual-learning essay',
    url: 'https://thezvi.wordpress.com/2025/06/09/dwarkesh-patel-on-continual-learning/',
  },
  {
    label: 'Nathan Lambert (2025), Contra Dwarkesh on Continual Learning (Interconnects)',
    url: 'https://www.interconnects.ai/p/contra-dwarkesh-on-continual-learning',
  },
]

const TRADEOFFS: [string, string, string, string, string][] = [
  ['Full retrain, new data mix', 'max', 'max', '$$$$', 'frontier default'],
  ['Continued pretrain + 1–25% replay', 'high', 'good', '$', 'standard for domain adaptation'],
  ['LoRA / PEFT', 'limited', 'good', '¢', 'default for task finetuning'],
  ['EWC-style regularization', 'medium', 'medium', '¢', 'rare at LLM scale'],
  ['ROME / MEMIT editing', 'surgical', 'collapses at scale', '¢', 'research tool'],
  ['RAG / long context', 'n/a — weights frozen', 'perfect', 'inference $', 'deployed workaround'],
  ['Memory layers + sparse FT', 'targeted', '−11% vs −89%', 'new pretrain', 'promising research'],
  ['TTT / Titans / Hope', 'at inference', 'multi-timescale', 'new architecture', 'research frontier'],
]

export default function ContinualLearning() {
  return (
    <ModuleLayout
      slug="continual-learning"
      heroExtra={
        <Lede className="mt-5">
          Thirty-five years separate the naming of catastrophic forgetting from the first
          architectures built to dissolve it. This is the deep dive on why weights freeze, what
          breaks when you thaw them — and who is thawing them anyway.
        </Lede>
      }
      chips={[
        '1989 · interference named',
        'EWC · Fisher tether · 2016',
        'replay 1–25% of old data',
        'MEMIT · 10³ edits on 20B',
        'sparse memory · −11% vs −89%',
        'Titans · 2M-token memory',
      ]}
      references={REFERENCES}
      bare
    >
      {/* ————— 1 · The debt ————— */}
      <Section id="m5-debt" variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">The debt · staleness</Eyebrow>
            <H2>Knowledge, frozen at step 100k</H2>
            <Lede>
              The 2017 Transformer made a fateful bargain: compress everything you will ever know
              into weights during training, then freeze them at deployment.
            </Lede>
            <Body>
              The base model distilled {PAPER.endeSentencePairs} sentence pairs into{' '}
              {PAPER.paramsBase} parameters over {PAPER.baseSteps} steps — about {PAPER.baseTime} on{' '}
              {PAPER.gpus} GPUs — and then learning stopped, permanently. Everything the model
              “knows” is a snapshot of its training distribution; everything that happens after the
              data cutoff has to squeeze in through the context window, at inference time, forever.
            </Body>
            <Body>
              The freeze is not laziness. It is a defense mechanism against a disease named in 1989,
              when McCloskey &amp; Cohen trained backprop networks on arithmetic facts sequentially —
              ones-addition, then twos-addition — and watched the new learning overwrite the old
              almost completely. They called it <em>catastrophic interference</em>. The cause is
              structural: gradient descent on the new distribution carries no term that cares about
              the old one, and in a shared, distributed representation every update perturbs
              everything.
            </Body>
            <Body>
              Grossberg framed the underlying tension as the <em>stability–plasticity dilemma</em>:
              a learner must be plastic enough to absorb new information yet stable enough to retain
              the old. Pure SGD is maximally plastic and minimally stable. Every method on this page
              is a point on that tradeoff curve.
            </Body>
            <Note>
              The Grossberg attribution is standard textbook lineage (the Adaptive Resonance Theory
              line of the 1980s) rather than one citable paper.
            </Note>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="1989" label="interference named" accent="sky" />
              <Stat num="24:109" label="Psych. of Learning &amp; Motivation" accent="clay" />
              <Stat num="2" label="timescales: train, then freeze" accent="olive" />
              <Stat num="35+ yrs" label="research program, still open" accent="sky" />
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ————— 2 · Classic mechanisms ————— */}
      <Section id="m5-classics" variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">Mechanism · 1989–2018</Eyebrow>
            <H2>Three escape routes from the overwrite</H2>
            <Lede>
              Three decades of continual-learning research collapse into three families: penalize
              the drift, rehearse the past, or wall off the parameters.
            </Lede>
            <Body>
              The canonical regularizer is DeepMind’s Elastic Weight Consolidation (Kirkpatrick et
              al., December 2016; PNAS 2017). Estimate how much each parameter mattered to task A
              via the diagonal Fisher information <Math>{String.raw`F_i`}</Math>, then learn task B
              under a quadratic tether that is stiff exactly along the directions that mattered:
            </Body>
          </Reveal>
          <Reveal delay={0.05}>
            <Math block className="my-4">
              {String.raw`\mathcal{L}(\theta) = \mathcal{L}_B(\theta) + \sum_i \frac{\lambda}{2}\, F_i \left(\theta_i - \theta^{*}_{A,i}\right)^2`}
            </Math>
            <Body>
              An elastic spring per weight, with per-weight stiffness. EWC held up on sequential
              MNIST variants and sequences of Atari games — the canonical demonstration that
              forgetting could be engineered down rather than merely lamented.
            </Body>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="olive">Regularize</Tag>
                <H3>Elastic tethers</H3>
                <p>
                  EWC and its relatives — Synaptic Intelligence, plain L2-to-old-weights — keep one
                  set of weights but penalize movement along important directions. Stability is
                  bought by refusing some of task B.
                </p>
              </Card>
              <Card>
                <Tag accent="sky">Replay</Tag>
                <H3>Rehearse the past</H3>
                <p>
                  Mix old data — or generated pseudo-data (Robins, 1995) — into new batches. iCaRL
                  (2017), GEM (2017), experience replay (2019). Crude and memory-hungry, and the
                  family that won the LLM era.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">Isolate</Tag>
                <H3>New task, new parameters</H3>
                <p>
                  Progressive Networks (Rusu et al., 2016) freeze old columns and add new ones with
                  lateral connections; PackNet (2018) prunes to free capacity. Zero forgetting by
                  construction — but parameters grow per task, and you must know which task you’re on.
                </p>
              </Card>
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ————— 3 · LLM-era practice ————— */}
      <Section id="m5-practice" variant="paper">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">Practice · 2023–2025</Eyebrow>
            <H2>How a 10B model changes its mind</H2>
            <Lede>
              At LLM scale the classic families reshuffle: replay wins, regularization fades, and
              isolation comes back wearing new clothes.
            </Lede>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-12">Continued pretraining: the boring champion</H3>
            <Body>
              Ibrahim et al. (2024) showed that three unglamorous tricks — re-warm the learning
              rate, re-decay it, and replay a slice of the old data — let a continually pretrained
              model match a full retrain on the combined data, at a fraction of the compute.
              Validated at 405M and 10B parameters. A weak distribution shift (Pile → SlimPajama,
              English to English) needs only ~1–5% replay; a strong shift — 300B tokens of Pile,
              then 200B tokens of German — used 25%. The companion result (Gupta et al., 2023):
              continuing at a decayed learning rate stalls adaptation, while re-warming triggers a
              transient forgetting spike before recovery — the “stability gap.”
            </Body>
            <Note>
              Treat 1–5% and 25% as regime markers rather than universal constants — the ratio
              scales with how far the new distribution sits from the old one.
            </Note>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-10">LoRA learns less — and forgets less</H3>
            <Body>
              Biderman et al. (TMLR 2024) put the folk wisdom on a scale: on code and math (~100K
              instruction pairs, plus 20B-token continued pretraining), LoRA underperforms full
              finetuning on the target domain but forgets far less of the source — beating weight
              decay and dropout as a forgetting mitigator. The mechanism clue: full finetuning
              perturbs the weights with 10–100× higher rank than a typical LoRA. LoRA is not a free
              lunch; it is a plasticity limiter that buys stability by learning less.
            </Body>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-10">Weight-space surgery</H3>
            <Body>
              Task arithmetic (Ilharco et al., ICLR 2023) treats a finetune as a vector{' '}
              <Math>{String.raw`\tau = \theta_{\text{ft}} - \theta_{\text{pre}}`}</Math>: add task
              vectors to compose skills, negate one to remove a behavior, with little collateral
              damage. TIES, DARE, and model soups turned merging into a cheap, gradient-free way to
              accrete capabilities — continual learning as post-hoc surgery, no training loop at all.
            </Body>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-10">Edit a fact, dull the scalpel</H3>
            <Body>
              ROME (NeurIPS 2022) causally traced factual recall to mid-layer MLPs at subject
              tokens and rewrote single facts with a rank-one update. MEMIT (ICLR 2023) spread the
              edit across several layers and scaled to thousands of edits on GPT-J-6B and
              GPT-NeoX-20B. Then the audit: sequential edits degrade the model gradually — and then
              one edit triggers sudden, catastrophic collapse (Gupta et al., ACL Findings 2024).
              Edits bleed into neighboring facts, and an edited fact’s logical consequences never
              update. A scalpel that dulls fast; not a continual-learning solution at scale.
            </Body>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat num="1–5%" label="replay · weak shift" accent="sky" />
              <Stat num="25%" label="replay · Pile → German" accent="clay" />
              <Stat num="10–100×" label="full-FT rank vs LoRA" accent="olive" />
              <Stat num="1000s" label="MEMIT edits in one batch" accent="sky" />
            </div>
          </Reveal>
        </Wrap>
      </Section>

      {/* ————— 4 · Interactive playground ————— */}
      <Section id="m5-playground" variant="dark">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">Interactive · the dilemma</Eyebrow>
            <H2>Watch a network forget</H2>
            <Lede>
              A real logistic-regression model, trained live in your browser: 240 steps on task A,
              then 240 steps on task B — two tasks whose gradients disagree. Pick the strategy and
              watch what happens to the blue line.
            </Lede>
            <Body>
              Naive SGD is the 1989 experiment in miniature: task A’s accuracy doesn’t drift down,
              it collapses — below chance, because task B’s solution actively contradicts it. The
              EWC tether holds task A at the price of task B. Ten-percent replay finds the joint
              solution. Frozen weights are the deployed LLM: perfectly stable, learning nothing.
            </Body>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <ContinualLearningPlayground />
          </Reveal>
          <Reveal delay={0.05}>
            <Note>
              A three-parameter toy — but the failure mode is the one McCloskey &amp; Cohen measured
              in 1989, and the one a 10-billion-parameter continued-pretraining run has to engineer
              around with re-warming schedules and replay ratios.
            </Note>
          </Reveal>
        </Wrap>
      </Section>

      {/* ————— 5 · State of play 2026 ————— */}
      <Section id="m5-frontier" variant="tint">
        <Wrap>
          <Reveal>
            <Eyebrow accent="sky">State of play · 2026</Eyebrow>
            <H2>Why the frontier still retrains from scratch</H2>
            <Lede>
              After 35 years of methods, the frontier default is the bluntest one on the menu: throw
              the weights away and retrain on a re-balanced mixture. There are good reasons.
            </Lede>
            <Body>
              Pretraining quality hinges on exact data-mixture proportions and curricula, and a
              fresh run is the only way to fully re-balance them — continual pretraining locks you
              into the old model’s path dependence. And sequential updating accumulates every
              pathology above: stability gaps, edit bleed, loss spikes. A from-scratch run on mixed
              data is boring and predictable — which is to say, it is replay taken to its logical
              extreme.
            </Body>
            <Body>
              Meanwhile the deployed workaround sidesteps the dilemma entirely: keep the weights
              frozen and put fresh knowledge in the prompt. RAG, long context, tool memory — nothing
              is overwritten, so nothing is forgotten, at the cost of inference-time compute and no
              true consolidation of skill. This became the 2025–26 discourse: Dwarkesh Patel’s June
              2025 essay called missing continual learning a “huge bottleneck” to general
              intelligence (Sutskever concurred on his podcast); Nathan Lambert’s “Contra Dwarkesh”
              answered that scaling context, retrieval, and memory means the <em>system</em> learns
              even while the weights don’t.
            </Body>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-12">The research bet: move the memory back inside</H3>
            <Body>
              The 2024–26 line of work tries to give the network dedicated, sparsely-updated
              parameters for knowledge — external memory, re-internalized.
            </Body>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <Card>
                <Tag accent="sky">Meta · Dec 2024</Tag>
                <H3>Memory layers at scale</H3>
                <p>
                  Replace some FFN layers with a trainable sparse key–value lookup — parameters
                  without FLOPs. Scaled to 128B memory parameters on 1T tokens (base models to 8B):
                  beats dense models given over 2× the compute, matches or beats MoE at matched
                  budgets, with the gains concentrated on factual tasks.
                </p>
              </Card>
              <Card>
                <Tag accent="clay">Meta · Oct 2025</Tag>
                <H3>Sparse memory finetuning</H3>
                <p>
                  Update only the memory slots a new fact activates unusually strongly — a
                  TF-IDF-style ranking against pretraining usage. Learning new facts costs 89% of
                  held-out NaturalQuestions F1 under full finetuning, 71% under LoRA — and 11% here,
                  at equal acquisition. Parameter isolation reborn, one slot at a time.
                </p>
              </Card>
              <Card>
                <Tag accent="olive">Stanford + Google · 2024–25</Tag>
                <H3>Learning at inference</H3>
                <p>
                  TTT layers, Titans, and Hope make weight updates part of the forward pass itself —
                  the stability–plasticity knob becomes an architectural spectrum rather than a
                  training-time choice.
                </p>
              </Card>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-12">Test-time training: the hidden state becomes a model</H3>
            <Body>
              TTT layers (Sun et al., 2024) make an RNN’s hidden state a small model{' '}
              <Math>{String.raw`W`}</Math> — linear, or a two-layer MLP — trained during the forward
              pass by a self-supervised inner loop, even on test sequences:
            </Body>
            <Math block className="my-4">
              {String.raw`W_t = W_{t-1} - \eta\, \nabla_W\, \ell\!\left(W_{t-1};\, x_t\right)`}
            </Math>
            <Body>
              Linear-time like Mamba, but it keeps improving with context: at 125M–1.3B scale,
              TTT-Linear and TTT-MLP keep reducing perplexity past 16k tokens where Mamba plateaus.
              Titans (Behrouz et al., January 2025) pairs attention-as-short-term-memory with a
              neural long-term memory that learns to memorize at test time, driven by a
              gradient-based “surprise” signal with momentum and decay — and scales past 2M-token
              contexts with strong needle-in-a-haystack accuracy. Nested Learning (NeurIPS 2025)
              takes the last step: a model is a stack of nested optimization problems running at
              different update frequencies, and its “Hope” architecture carries a Continuum Memory
              System — a spectrum of memory blocks, each updating at its own rate. On this view
              catastrophic forgetting is an artifact of having exactly two timescales, pretraining
              and frozen inference; a continuum dissolves the dilemma. Hope reports lower perplexity
              and higher reasoning accuracy than both Transformers and Titans.
            </Body>
            <Note>
              Titans’ surprise-with-momentum mechanism is described here per the paper’s own framing;
              the headline claims, not the full derivation, are what’s been checked.
            </Note>
          </Reveal>
          <Reveal delay={0.05}>
            <H3 className="mt-12">The one-slide version</H3>
            <div className="mt-4 overflow-x-auto rounded-[10px] border border-(--card-line) bg-(--card-bg)">
              <table className="w-full min-w-[720px] border-collapse text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-(--card-line)">
                    {['Approach', 'Plasticity', 'Stability', 'Cost', 'Status 2026'].map((h) => (
                      <th
                        key={h}
                        className="font-display px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-(--note)"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRADEOFFS.map(([a, p, s, c, st]) => (
                    <tr key={a} className="border-b border-(--card-line) last:border-b-0">
                      <td className="px-4 py-2.5 font-medium text-(--soft)">{a}</td>
                      <td className="font-mono px-4 py-2.5 text-[12.5px] text-(--soft)">{p}</td>
                      <td className="font-mono px-4 py-2.5 text-[12.5px] text-(--soft)">{s}</td>
                      <td className="font-mono px-4 py-2.5 text-[12.5px] text-(--soft)">{c}</td>
                      <td className="px-4 py-2.5 text-(--note)">{st}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Body className="mt-8">
              So the 2026 answer to “can the weights learn after training?” is: mostly they don’t —
              replay-heavy retraining and frozen-weights-plus-context won the decade by being
              predictable. But the memory-layer and test-time-training lines are converging on the
              same thesis from two directions: give knowledge its own parameters, update them on
              their own clock, and the stability–plasticity dilemma stops being a dilemma and
              becomes a design axis.
            </Body>
          </Reveal>
        </Wrap>
      </Section>
    </ModuleLayout>
  )
}
