const MONO = { fontFamily: 'var(--font-mono)' } as const
const DISPLAY = { fontFamily: 'var(--font-display)' } as const

const LANES = [
  { y: 44, color: 'var(--color-clay)', head: 'head 1', find: 'e.g. local syntax' },
  { y: 148, color: 'var(--color-sky)', head: 'head 2', find: 'e.g. coreference' },
  { y: 286, color: 'var(--color-olive)', head: 'head 8', find: 'e.g. long-range links' },
]

function Box({
  x,
  y,
  w,
  h,
  stroke,
  title,
  sub,
}: {
  x: number
  y: number
  w: number
  h: number
  stroke: string
  title: string
  sub?: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="none" stroke={stroke} strokeWidth={1.6} />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 4 : h / 2 + 5)}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        style={DISPLAY}
        fill="currentColor"
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 16}
          textAnchor="middle"
          fontSize={11}
          style={MONO}
          fill="var(--note)"
        >
          {sub}
        </text>
      )}
    </g>
  )
}

/**
 * Multi-head attention as a pipeline: one 512-dim token vector fans out
 * through eight per-head projections into 64-dim subspaces (three lanes shown,
 * the rest elided), each runs scaled dot-product attention independently, and
 * the results are concatenated back to 512 dims and mixed by W^O.
 */
export function MultiHeadDiagram() {
  return (
    <figure className="mt-[26px]">
      <svg
        viewBox="0 0 1000 400"
        role="img"
        aria-label="Multi-head attention pipeline: a 512-dimensional input fans out to eight parallel 64-dimensional attention heads, whose outputs are concatenated and mixed by an output projection."
        className="block h-auto w-full"
      >
        <defs>
          <marker id="mh-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--note)" />
          </marker>
        </defs>

        {/* input */}
        <Box x={16} y={158} w={128} h={84} stroke="var(--wire)" title="token x" sub="512 dims" />

        {/* lanes */}
        {LANES.map((l) => (
          <g key={l.head}>
            {/* input fan-out */}
            <path
              d={`M 144 200 C 190 200, 190 ${l.y + 42}, 232 ${l.y + 42}`}
              fill="none"
              stroke="var(--wire)"
              strokeWidth={1.4}
              markerEnd="url(#mh-arrow)"
            />
            <Box
              x={236}
              y={l.y}
              w={188}
              h={84}
              stroke={l.color}
              title={`${l.head} · W_Q W_K W_V`}
              sub="project 512 → 64"
            />
            <line
              x1={424}
              y1={l.y + 42}
              x2={464}
              y2={l.y + 42}
              stroke="var(--wire)"
              strokeWidth={1.4}
              markerEnd="url(#mh-arrow)"
            />
            <Box
              x={468}
              y={l.y}
              w={212}
              h={84}
              stroke={l.color}
              title="attention in 64 dims"
              sub={l.find}
            />
            {/* into concat */}
            <path
              d={`M 680 ${l.y + 42} C 722 ${l.y + 42}, 722 200, 758 200`}
              fill="none"
              stroke="var(--wire)"
              strokeWidth={1.4}
              markerEnd="url(#mh-arrow)"
            />
          </g>
        ))}

        {/* elision between lane 2 and lane 8 */}
        <text x={560} y={262} textAnchor="middle" fontSize={20} fill="var(--note)">
          ⋮
        </text>
        <text x={560} y={280} textAnchor="middle" fontSize={11} style={MONO} fill="var(--note)">
          heads 3–7
        </text>

        {/* concat + output projection */}
        <Box x={762} y={158} w={104} h={84} stroke="var(--wire)" title="concat" sub="8 × 64 = 512" />
        <line
          x1={866}
          y1={200}
          x2={898}
          y2={200}
          stroke="var(--wire)"
          strokeWidth={1.4}
          markerEnd="url(#mh-arrow)"
        />
        <Box x={902} y={158} w={82} h={84} stroke="var(--color-clay)" title="W_O" sub="mix · 512" />
      </svg>
      <figcaption className="mt-3 max-w-[70ch] text-[13.5px] text-(--note)">
        One token's path through the eight heads. Each head sees the same input through its own
        learned projections, attends in its own 64-dimensional subspace, and the concatenation
        restores the original width — parallel perspectives at roughly the price of one.
      </figcaption>
    </figure>
  )
}
