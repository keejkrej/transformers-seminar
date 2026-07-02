const MONO = { fontFamily: 'var(--font-mono)' } as const
const DISPLAY = { fontFamily: 'var(--font-display)' } as const

/** One unrolled time step: a shared cell "A" with an input below and output above. */
function Step({ cx, sub }: { cx: number; sub: string }) {
  return (
    <g>
      {/* output yₜ, arrow up out of the cell */}
      <line x1={cx} y1={138} x2={cx} y2={104} stroke="var(--soft)" strokeWidth={1.6} markerEnd="url(#rnn-arrow-ink)" />
      <text x={cx} y={94} textAnchor="middle" fontSize={14} style={MONO} fill="var(--soft)">
        y{sub}
      </text>

      {/* the cell */}
      <rect x={cx - 43} y={140} width={86} height={72} rx={12} fill="none" stroke="var(--color-sky)" strokeWidth={1.8} />
      <text x={cx} y={184} textAnchor="middle" fontSize={22} fontWeight={600} style={DISPLAY} fill="var(--color-paper)">
        A
      </text>

      {/* input xₜ, arrow up into the cell */}
      <line x1={cx} y1={250} x2={cx} y2={214} stroke="var(--soft)" strokeWidth={1.6} markerEnd="url(#rnn-arrow-ink)" />
      <text x={cx} y={270} textAnchor="middle" fontSize={14} style={MONO} fill="var(--soft)">
        x{sub}
      </text>
    </g>
  )
}

/**
 * The classic RNN figure: a single recurrent cell (left) is equivalent to the
 * same cell unrolled across time (right). The clay horizontal arrows are the
 * hidden state hₜ carried forward — the connection that forces sequential
 * computation. Static SVG; matches the site's diagram language.
 */
export function RNNDiagram() {
  return (
    <figure className="rounded-xl border border-(--card-line) bg-(--card-bg) px-7 py-[30px]">
      <svg
        viewBox="0 0 1000 300"
        role="img"
        aria-label="A recurrent cell and the same cell unrolled across three time steps; the hidden state is passed from each step to the next."
        className="block h-auto w-full"
      >
        <defs>
          <marker id="rnn-arrow-ink" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--soft)" />
          </marker>
          <marker id="rnn-arrow-clay" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-clay)" />
          </marker>
        </defs>

        <text x={0} y={20} fontSize={12} fontWeight={600} letterSpacing={2} style={DISPLAY} fill="var(--soft)">
          ONE RECURRENT CELL, UNROLLED IN TIME
        </text>

        {/* ── Folded form ─────────────────────────────── */}
        <line x1={105} y1={138} x2={105} y2={104} stroke="var(--soft)" strokeWidth={1.6} markerEnd="url(#rnn-arrow-ink)" />
        <text x={105} y={94} textAnchor="middle" fontSize={14} style={MONO} fill="var(--soft)">
          yₜ
        </text>
        <rect x={62} y={140} width={86} height={72} rx={12} fill="none" stroke="var(--color-sky)" strokeWidth={1.8} />
        <text x={105} y={184} textAnchor="middle" fontSize={22} fontWeight={600} style={DISPLAY} fill="var(--color-paper)">
          A
        </text>
        <line x1={105} y1={250} x2={105} y2={214} stroke="var(--soft)" strokeWidth={1.6} markerEnd="url(#rnn-arrow-ink)" />
        <text x={105} y={270} textAnchor="middle" fontSize={14} style={MONO} fill="var(--soft)">
          xₜ
        </text>
        {/* self-loop: the recurrence */}
        <path
          d="M148,158 C 196,146 196,206 150,194"
          fill="none"
          stroke="var(--color-clay)"
          strokeWidth={1.8}
          markerEnd="url(#rnn-arrow-clay)"
        />
        <text x={202} y={180} fontSize={12} style={MONO} fill="var(--color-clay)">
          hₜ
        </text>

        {/* equals */}
        <text x={250} y={185} textAnchor="middle" fontSize={26} style={DISPLAY} fill="var(--color-olive)">
          =
        </text>

        {/* ── Unrolled form ───────────────────────────── */}
        {/* hidden-state chain (clay) running left → right through every step */}
        <line x1={300} y1={176} x2={347} y2={176} stroke="var(--color-clay)" strokeWidth={2.2} strokeDasharray="4 4" markerEnd="url(#rnn-arrow-clay)" />
        <line x1={393} y1={176} x2={517} y2={176} stroke="var(--color-clay)" strokeWidth={2.2} markerEnd="url(#rnn-arrow-clay)" />
        <line x1={583} y1={176} x2={707} y2={176} stroke="var(--color-clay)" strokeWidth={2.2} markerEnd="url(#rnn-arrow-clay)" />
        <line x1={773} y1={176} x2={862} y2={176} stroke="var(--color-clay)" strokeWidth={2.2} strokeDasharray="4 4" markerEnd="url(#rnn-arrow-clay)" />

        <text x={455} y={166} textAnchor="middle" fontSize={12} style={MONO} fill="var(--color-clay)">
          hₜ₋₁
        </text>
        <text x={645} y={166} textAnchor="middle" fontSize={12} style={MONO} fill="var(--color-clay)">
          hₜ
        </text>

        <Step cx={370} sub="ₜ₋₁" />
        <Step cx={560} sub="ₜ" />
        <Step cx={750} sub="ₜ₊₁" />

        {/* time axis */}
        <text x={880} y={270} fontSize={12} style={MONO} fill="var(--color-stone)">
          time →
        </text>
      </svg>

      <figcaption className="mt-4 max-w-[70ch] text-[14px] text-(--soft)">
        The same cell <span className="font-mono text-[0.85em]">A</span> — one fixed set of weights —
        is applied at every position. Reading it left to right is the whole story: the{' '}
        <span className="text-clay">hidden state</span> from one step is required input to the next,
        so the steps cannot run at the same time.
      </figcaption>
    </figure>
  )
}
