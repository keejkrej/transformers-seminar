import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Btn, Pill } from '../../components/Buttons'
import { Note } from '../../components/Type'

/**
 * KV-cache budget calculator. Four architectures plotted on one log axis
 * (total cache bytes at the chosen context) against GPU HBM reference
 * lines. All arithmetic follows M_KV = 2·L·n_kv·d_h·b, with MLA caching
 * 576 elements (d_c 512 + d_R 64) per token per layer instead.
 */

type Arch = 'mha' | 'gqa' | 'mqa' | 'mla'
type PrecId = 'fp16' | 'fp8' | 'int4' | 'int2'

const D_HEAD = 128
const MLA_ELEMS = 576 // d_c = 512 latent + d_R = 64 decoupled-RoPE key

const ARCHES: ReadonlyArray<{ id: Arch; label: string }> = [
  { id: 'mha', label: 'MHA' },
  { id: 'gqa', label: 'GQA-8' },
  { id: 'mqa', label: 'MQA' },
  { id: 'mla', label: 'MLA' },
]

const PRECS: ReadonlyArray<{ id: PrecId; label: string }> = [
  { id: 'fp16', label: 'FP16' },
  { id: 'fp8', label: 'FP8' },
  { id: 'int4', label: 'INT4' },
  { id: 'int2', label: '2-bit' },
]

const PREC_BYTES: Record<PrecId, number> = { fp16: 2, fp8: 1, int4: 0.5, int2: 0.25 }

interface Preset {
  label: string
  layers: number
  heads: number
  arch: Arch
  prec: PrecId
  ctxExp: number
}

const PRESETS: ReadonlyArray<Preset> = [
  { label: '70B as pure MHA', layers: 80, heads: 64, arch: 'mha', prec: 'fp16', ctxExp: 17 },
  { label: 'Llama 2 70B · GQA-8', layers: 80, heads: 64, arch: 'gqa', prec: 'fp16', ctxExp: 17 },
  { label: 'DeepSeek-V3 · MLA', layers: 61, heads: 128, arch: 'mla', prec: 'fp16', ctxExp: 17 },
]

function kvBytesPerToken(arch: Arch, layers: number, heads: number, bytes: number): number {
  if (arch === 'mla') return layers * MLA_ELEMS * bytes
  const kvHeads = arch === 'mha' ? heads : arch === 'gqa' ? Math.min(8, heads) : 1
  return 2 * layers * kvHeads * D_HEAD * bytes
}

function fmtBytes(n: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  const s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)
  return `${s} ${units[i]}`
}

function fmtCtx(exp: number): string {
  return exp >= 20 ? '1M' : `${2 ** (exp - 10)}K`
}

/* chart geometry — log2 axis from 1 MiB (2^20) to 8 TiB (2^43) */
const X0 = 74
const X1 = 760
const LOG_MIN = 20
const LOG_MAX = 43

function xOf(bytes: number): number {
  const l = Math.min(LOG_MAX, Math.max(LOG_MIN, Math.log2(Math.max(bytes, 1))))
  return X0 + ((l - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (X1 - X0)
}

const GIB = 2 ** 30
const TICKS = [
  { v: GIB, label: '1 GiB' },
  { v: 10 * GIB, label: '10 GiB' },
  { v: 100 * GIB, label: '100 GiB' },
  { v: 1024 * GIB, label: '1 TiB' },
]
const HBM = [
  { v: 24 * GIB, label: '24 GB', ly: 26 },
  { v: 80 * GIB, label: '80 GB', ly: 12 },
  { v: 141 * GIB, label: '141 GB', ly: 26 },
]

function SliderRow({
  label,
  display,
  min,
  max,
  step,
  value,
  disabled = false,
  onChange,
}: {
  label: string
  display: string
  min: number
  max: number
  step: number
  value: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <label className={`block ${disabled ? 'opacity-40' : ''}`}>
      <span className="font-mono flex justify-between text-[12px] text-(--note)">
        <span>{label}</span>
        <span className="text-(--soft)">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  )
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-sky text-[clamp(1.05rem,2vw,1.45rem)] font-bold">{value}</div>
      <div className="font-display mt-1 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-(--note)">
        {label}
      </div>
    </div>
  )
}

export default function KVBudgetCalculator() {
  const reduced = useReducedMotion()
  const [layers, setLayers] = useState(80)
  const [heads, setHeads] = useState(64)
  const [arch, setArch] = useState<Arch>('mha')
  const [prec, setPrec] = useState<PrecId>('fp16')
  const [ctxExp, setCtxExp] = useState(17)

  const ctx = 2 ** ctxExp
  const rows = ARCHES.map((a) => {
    const bpt = kvBytesPerToken(a.id, layers, heads, PREC_BYTES[prec])
    return { ...a, bpt, total: bpt * ctx }
  })
  const sel = rows.find((r) => r.id === arch) ?? rows[0]
  const ratio = rows[0].bpt / sel.bpt
  const ratioLabel = ratio >= 10 ? Math.round(ratio).toString() : ratio.toFixed(1)
  const gpus = Math.ceil(sel.total / (80 * GIB))

  function applyPreset(p: Preset) {
    setLayers(p.layers)
    setHeads(p.heads)
    setArch(p.arch)
    setPrec(p.prec)
    setCtxExp(p.ctxExp)
  }

  return (
    <div className="rounded-[10px] border border-(--card-line) bg-(--card-bg) p-5 md:p-7">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-display mr-1 text-[11px] font-semibold tracking-[0.16em] uppercase text-(--note)">
          Presets
        </span>
        {PRESETS.map((p) => (
          <Btn key={p.label} onClick={() => applyPreset(p)}>
            {p.label}
          </Btn>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <span className="font-display mr-1 w-[72px] text-[11px] font-semibold tracking-[0.16em] uppercase text-(--note)">
          Cache as
        </span>
        {ARCHES.map((a) => (
          <Pill
            key={a.id}
            pressed={arch === a.id}
            swatch={arch === a.id ? 'var(--color-sky)' : 'var(--color-stone)'}
            onClick={() => setArch(a.id)}
          >
            {a.label}
          </Pill>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <span className="font-display mr-1 w-[72px] text-[11px] font-semibold tracking-[0.16em] uppercase text-(--note)">
          Stored in
        </span>
        {PRECS.map((p) => (
          <Pill
            key={p.id}
            pressed={prec === p.id}
            swatch={prec === p.id ? 'var(--color-clay)' : 'var(--color-stone)'}
            onClick={() => setPrec(p.id)}
          >
            {p.label}
          </Pill>
        ))}
      </div>

      <div className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-3">
        <SliderRow
          label="layers L"
          display={String(layers)}
          min={8}
          max={96}
          step={1}
          value={layers}
          onChange={setLayers}
        />
        <SliderRow
          label="query heads"
          display={arch === 'mla' ? '— (latent)' : String(heads)}
          min={8}
          max={128}
          step={8}
          value={heads}
          disabled={arch === 'mla'}
          onChange={setHeads}
        />
        <SliderRow
          label="context"
          display={`${fmtCtx(ctxExp)} tok`}
          min={10}
          max={20}
          step={1}
          value={ctxExp}
          onChange={setCtxExp}
        />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
        <Readout label="bytes / token" value={fmtBytes(sel.bpt)} />
        <Readout label={`cache @ ${fmtCtx(ctxExp)} ctx`} value={fmtBytes(sel.total)} />
        <Readout
          label="vs MHA, same bits"
          value={arch === 'mha' ? '1×' : `${ratioLabel}× less`}
        />
        <Readout label="80 GB GPUs, cache alone" value={`≥ ${gpus}`} />
      </div>

      <div className="mt-7 overflow-x-auto">
        <svg
          viewBox="0 0 860 244"
          role="img"
          aria-label={`Total KV cache at ${fmtCtx(ctxExp)} context: ${rows
            .map((r) => `${r.label} ${fmtBytes(r.total)}`)
            .join(', ')}. HBM reference lines at 24, 80 and 141 GB.`}
          className="w-full min-w-[560px]"
        >
          {/* axis ticks */}
          {TICKS.map((t) => (
            <g key={t.label}>
              <line
                x1={xOf(t.v)}
                y1={34}
                x2={xOf(t.v)}
                y2={210}
                style={{ stroke: 'var(--wire)', strokeWidth: 1 }}
              />
              <text
                x={xOf(t.v)}
                y={230}
                textAnchor="middle"
                style={{
                  fill: 'var(--color-stone)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {t.label}
              </text>
            </g>
          ))}
          <line
            x1={X0}
            y1={210}
            x2={X1}
            y2={210}
            style={{ stroke: 'var(--wire)', strokeWidth: 1 }}
          />

          {/* HBM reference lines */}
          {HBM.map((h) => (
            <g key={h.label}>
              <line
                x1={xOf(h.v)}
                y1={32}
                x2={xOf(h.v)}
                y2={210}
                strokeDasharray="4 4"
                style={{ stroke: 'var(--color-clay)', strokeWidth: 1.25 }}
              />
              <text
                x={xOf(h.v)}
                y={h.ly}
                textAnchor="middle"
                style={{
                  fill: 'var(--color-clay)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {h.label}
              </text>
            </g>
          ))}

          {/* one bar per architecture */}
          {rows.map((r, i) => {
            const y = 42 + i * 44
            const w = Math.max(2, xOf(r.total) - X0)
            const selected = r.id === arch
            return (
              <g key={r.id} onClick={() => setArch(r.id)} style={{ cursor: 'pointer' }}>
                <text
                  x={X0 - 10}
                  y={y + 15}
                  textAnchor="end"
                  style={{
                    fill: selected ? 'var(--color-sky)' : 'var(--soft)',
                    fontSize: 12,
                    fontWeight: selected ? 700 : 400,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {r.label}
                </text>
                <rect
                  x={X0}
                  y={y}
                  width={w}
                  height={22}
                  rx={3}
                  style={{
                    fill: selected ? 'var(--color-sky)' : 'var(--color-stone)',
                    opacity: selected ? 1 : 0.35,
                    transition: reduced
                      ? undefined
                      : 'width 0.45s cubic-bezier(0.2, 0.6, 0.2, 1)',
                  }}
                />
                <text
                  x={X0 + w + 8}
                  y={y + 15}
                  style={{
                    fill: 'var(--soft)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {fmtBytes(r.total)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <Note>
        Assumptions: head dim fixed at 128, GQA fixed at 8 groups, MLA caches 576 elements per
        token per layer (512-dim latent + 64-dim decoupled rotary key) regardless of head count.
        Totals are KV cache only — no weights, no activations. HBM lines: 24 / 80 / 141 GB.
      </Note>
    </div>
  )
}
