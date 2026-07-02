const N = 14
const X0 = 60
const X1 = 940
const Y1 = 92
const Y2 = 178
const R = 7

const XS = Array.from({ length: N }, (_, i) => X0 + ((X1 - X0) * i) / (N - 1))

/**
 * Signal-path length visual: n−1 adjacent hops for recurrence versus a single
 * long-range hop for self-attention. Static SVG, no animation.
 */
export function PathViz() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 1000 190"
        role="img"
        aria-label="Signal path length: n hops for recurrence, one hop for attention"
        className="block h-auto w-full"
      >
        <text
          x={0}
          y={18}
          fontSize={12}
          fontWeight={600}
          letterSpacing={2}
          style={{ fontFamily: 'var(--font-display)' }}
          fill="var(--color-inksoft)"
        >
          SIGNAL TRAVEL: FIRST WORD → LAST WORD
        </text>
        <g>
          <text
            x={0}
            y={66}
            fontSize={12}
            style={{ fontFamily: 'var(--font-mono)' }}
            fill="var(--color-sky)"
          >
            recurrent · n−1 hops
          </text>
          {XS.slice(0, -1).map((x, i) => (
            <path
              key={i}
              d={`M ${x} ${Y1 - 10} Q ${(x + XS[i + 1]) / 2} ${Y1 - 30} ${XS[i + 1]} ${Y1 - 10}`}
              fill="none"
              stroke="var(--color-sky)"
              strokeWidth={1.6}
            />
          ))}
          {XS.map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={Y1}
              r={R}
              fill="var(--color-mist)"
              stroke="var(--color-ink)"
              strokeWidth={1.4}
            />
          ))}
        </g>
        <g>
          <text
            x={0}
            y={156}
            fontSize={12}
            style={{ fontFamily: 'var(--font-mono)' }}
            fill="var(--color-clay)"
          >
            self-attention · 1 hop
          </text>
          <path
            d={`M ${XS[0]} ${Y2 - 10} Q ${(XS[0] + XS[N - 1]) / 2} ${Y2 - 52} ${XS[N - 1]} ${Y2 - 10}`}
            fill="none"
            stroke="var(--color-clay)"
            strokeWidth={2.4}
          />
          {XS.map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={Y2}
              r={R}
              fill="var(--color-mist)"
              stroke="var(--color-ink)"
              strokeWidth={1.4}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
