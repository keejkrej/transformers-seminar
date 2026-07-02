const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'] as const

const CX = 200
const CY = 170
const R = 118
const NODE_R = 24

/** Node centers, evenly spaced on a circle starting at the top. */
const NODES = TOKENS.map((_, i) => {
  const a = (-90 + (360 / TOKENS.length) * i) * (Math.PI / 180)
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }
})

/** Every unordered pair of node indices — the edges of the complete graph. */
const EDGES: [number, number][] = []
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) EDGES.push([i, j])
}

const FOCUS = 0

/**
 * A complete graph over six tokens. Every pair is connected (faint) — and one
 * focus node's edges are highlighted in clay to stand for a single token
 * attending to all others: one round of message passing.
 */
export function CompleteGraph() {
  return (
    <svg
      viewBox="0 0 400 340"
      role="img"
      aria-label="Six tokens as nodes of a fully connected graph; one node's connections to all others are highlighted."
      className="block h-auto w-full"
    >
      {/* faint edges: every token pair */}
      {EDGES.map(([i, j]) => (
        <line
          key={`e${i}-${j}`}
          x1={NODES[i].x}
          y1={NODES[i].y}
          x2={NODES[j].x}
          y2={NODES[j].y}
          stroke="var(--color-stone)"
          strokeWidth={1}
          opacity={0.5}
        />
      ))}

      {/* highlighted edges from the focus node to every other */}
      {NODES.map((n, i) =>
        i === FOCUS ? null : (
          <line
            key={`f${i}`}
            x1={NODES[FOCUS].x}
            y1={NODES[FOCUS].y}
            x2={n.x}
            y2={n.y}
            stroke="var(--color-clay)"
            strokeWidth={2}
          />
        ),
      )}

      {/* nodes */}
      {NODES.map((n, i) => {
        const focus = i === FOCUS
        return (
          <g key={`n${i}`}>
            <circle
              cx={n.x}
              cy={n.y}
              r={NODE_R}
              fill={focus ? 'var(--color-clay)' : 'var(--card-bg)'}
              stroke={focus ? 'var(--color-clay)' : 'var(--color-fog)'}
              strokeWidth={1.6}
            />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              fontSize={13}
              style={{ fontFamily: 'var(--font-mono)' }}
              fill='var(--color-paper)'
            >
              {TOKENS[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
