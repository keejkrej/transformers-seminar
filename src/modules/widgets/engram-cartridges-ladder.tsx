import { useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * "The price of context" — interactive economics of the middle memory tier.
 *
 * Two bars compare a raw 16-bit KV cache against a self-studied cartridge at
 * matched quality while a slider sweeps corpus size; a second slider amortizes
 * the one-off training run over query volume. Every anchor number is from the
 * Cartridges paper (arXiv:2506.06266): Llama-70B holds 84 GB of 16-bit KV at
 * 128k tokens; a cartridge matches ICL quality with 38.6× less memory on
 * average; an ICL-quality cartridge trains in ~30 min on one 8×H100 node.
 */

const KV_GB_AT_128K = 84 // Llama-70B, 16-bit KV cache at a 128k-token context
const WINDOW_TOKENS = 128_000
const CARTRIDGE_FACTOR = 38.6 // average memory reduction at ICL quality
const MIN_TOKENS = 1_000
const MAX_TOKENS = 500_000
const TRAIN_MINUTES = 30 // one-off self-study run, 8×H100, Llama-8B

const VIEW_W = 720
const VIEW_H = 234
const PLOT_X = 14
const PLOT_W = 512
const AXIS_Y = 196
const MAX_GB = (KV_GB_AT_128K * MAX_TOKENS) / WINDOW_TOKENS // 328.125 GB

const TICKS = [
  { gb: 0, label: '0' },
  { gb: 100, label: '100 GB' },
  { gb: 200, label: '200 GB' },
  { gb: 300, label: '300 GB' },
]

const Q_LABELS = ['1', '10', '100', '1k', '10k', '100k', '1M']

function fmtGB(gb: number): string {
  if (gb < 1) return `${Math.round(gb * 1000)} MB`
  if (gb >= 100) return `${Math.round(gb)} GB`
  if (gb >= 10) return `${gb.toFixed(1)} GB`
  return `${gb.toFixed(2)} GB`
}

function fmtTokens(n: number): string {
  return `${Math.round(n / 1000)}k`
}

function fmtAmortized(queries: number): string {
  const secs = (TRAIN_MINUTES * 60) / queries
  if (secs >= 120) return `${Math.round(secs / 60)} min`
  if (secs >= 1) return `${secs.toFixed(1)} s`
  return `${(secs * 1000).toFixed(1)} ms`
}

/** Interactive KV-cache vs. cartridge cost comparison for the M6 deep dive. */
export default function EngramCartridgesLadder() {
  const reduced = useReducedMotion()
  const [tokens, setTokens] = useState(WINDOW_TOKENS)
  const [qExp, setQExp] = useState(3)

  const kvGB = (KV_GB_AT_128K * tokens) / WINDOW_TOKENS
  const cartGB = kvGB / CARTRIDGE_FACTOR
  const overWindow = tokens > WINDOW_TOKENS
  const queries = 10 ** qExp
  const qLabel = Q_LABELS[qExp] ?? '1'

  const xOf = (gb: number) => PLOT_X + (gb / MAX_GB) * PLOT_W
  const kvW = Math.max(2, (kvGB / MAX_GB) * PLOT_W)
  const cartW = Math.max(2, (cartGB / MAX_GB) * PLOT_W)
  const windowX = xOf(KV_GB_AT_128K)
  const barStyle = reduced
    ? undefined
    : { transition: 'width 0.35s cubic-bezier(0.2, 0.6, 0.2, 1)' }

  return (
    <div className="rounded-[10px] border border-(--card-line) bg-(--card-bg) p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="font-display text-clay text-[11px] font-semibold tracking-[0.16em] uppercase">
          The price of context
        </span>
        <span className="font-mono text-[11.5px] text-(--note)">
          Llama-70B · 16-bit KV · anchors from arXiv:2506.06266
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label={`At ${fmtTokens(tokens)} tokens of corpus, the raw KV cache holds ${fmtGB(kvGB)} while a quality-matched cartridge holds ${fmtGB(cartGB)}.`}
      >
        {/* 128k window marker */}
        <line
          x1={windowX}
          y1={30}
          x2={windowX}
          y2={AXIS_Y}
          stroke="var(--color-stone)"
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
        <text
          x={windowX + 8}
          y={38}
          fontSize={11}
          fill="var(--note)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          128k window · 84 GB
        </text>

        {/* raw KV cache bar */}
        <text
          x={PLOT_X}
          y={64}
          fontSize={12}
          fontWeight={600}
          fill="var(--soft)"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Raw KV cache — re-held by every request
        </text>
        <rect
          x={PLOT_X}
          y={72}
          width={kvW}
          height={30}
          rx={4}
          fill="var(--color-sky)"
          style={barStyle}
        />
        <text
          x={PLOT_X + kvW + 9}
          y={92}
          fontSize={13}
          fontWeight={700}
          fill="var(--soft)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {fmtGB(kvGB)}
        </text>

        {/* cartridge bar */}
        <text
          x={PLOT_X}
          y={138}
          fontSize={12}
          fontWeight={600}
          fill="var(--soft)"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Cartridge — trained once, matched quality (÷38.6 avg)
        </text>
        <rect
          x={PLOT_X}
          y={146}
          width={cartW}
          height={30}
          rx={4}
          fill="var(--color-clay)"
          style={barStyle}
        />
        <text
          x={PLOT_X + cartW + 9}
          y={166}
          fontSize={13}
          fontWeight={700}
          fill="var(--soft)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {fmtGB(cartGB)}
        </text>

        {/* axis */}
        <line
          x1={PLOT_X}
          y1={AXIS_Y}
          x2={PLOT_X + PLOT_W}
          y2={AXIS_Y}
          stroke="var(--wire)"
          strokeWidth={1.5}
        />
        {TICKS.map((t) => (
          <g key={t.gb}>
            <line
              x1={xOf(t.gb)}
              y1={AXIS_Y}
              x2={xOf(t.gb)}
              y2={AXIS_Y + 6}
              stroke="var(--wire)"
              strokeWidth={1.5}
            />
            <text
              x={xOf(t.gb)}
              y={AXIS_Y + 22}
              textAnchor={t.gb === 0 ? 'start' : 'middle'}
              fontSize={11}
              fill="var(--note)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {t.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-col gap-3">
        <label className="flex items-center gap-4">
          <span className="font-mono w-44 shrink-0 text-[12px] text-(--soft)">
            corpus · {fmtTokens(tokens)} tokens
          </span>
          <input
            type="range"
            min={MIN_TOKENS}
            max={MAX_TOKENS}
            step={1000}
            value={tokens}
            onChange={(e) => setTokens(Number(e.currentTarget.value))}
            className="min-w-0 flex-1"
            aria-label="Corpus size in tokens"
          />
        </label>
        <label className="flex items-center gap-4">
          <span className="font-mono w-44 shrink-0 text-[12px] text-(--soft)">
            queries · {qLabel}
          </span>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={qExp}
            onChange={(e) => setQExp(Number(e.currentTarget.value))}
            className="min-w-0 flex-1"
            aria-label="Number of queries against this corpus, in powers of ten"
          />
        </label>
      </div>

      <p className="font-mono mt-4 text-[12.5px] leading-relaxed text-(--soft)">
        {overWindow
          ? `${fmtTokens(tokens)} tokens is past the 128k window — ICL cannot prefill this corpus at all. A cartridge trained through 484k tokens (MTOB) beat truncated ICL by +11.0 chrF.`
          : `Every request against this corpus re-holds ${fmtGB(kvGB)} of KV in HBM. The cartridge holds ${fmtGB(cartGB)}, once, served like a shared cached prefix.`}
      </p>
      <p className="font-mono mt-2 text-[12.5px] text-(--note)">
        self-study once (~30 min · 8×H100) ÷ {qLabel}{' '}
        {queries === 1 ? 'query' : 'queries'} = {fmtAmortized(queries)} of training per query
      </p>
    </div>
  )
}
