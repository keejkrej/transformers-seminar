import { useState } from 'react'
import { Pill } from '../../components/Buttons'
import { Tag } from '../../components/Card'
import { H3 } from '../../components/Type'

/**
 * KV-cache size calculator for a 70B-class model: pick an attention
 * variant (MHA / GQA / MLA), sweep context length on a log₂ slider,
 * read the cache bill in GB against H100/B200 capacity markers.
 */

const BYTES_PER_GB = 1073741824
const H100_GB = 80
const TRACK_MAX_GB = 400

const KV = {
  mha: {
    name: 'MHA · 2017 style',
    swatch: 'var(--color-stone)',
    bytesPerToken: 2.62e6,
    meta: 'MHA (all 64 kv-heads cached): 80 layers × 64 heads × 128 dims × 2 (K,V) × 2 bytes ≈ 2.6 MB/token',
  },
  gqa: {
    name: 'GQA · 8 kv-heads',
    swatch: 'var(--color-sky)',
    bytesPerToken: 3.28e5,
    meta: 'GQA-8 (Llama-style): 80 layers × 8 kv-heads × 128 dims × 2 × 2 bytes ≈ 0.33 MB/token — 8× smaller',
  },
  mla: {
    name: 'MLA · latent compression',
    swatch: 'var(--color-olive)',
    bytesPerToken: 9.2e4,
    meta: 'MLA (DeepSeek-style latent, 576 dims): ≈ 0.09 MB/token — ~28× smaller than MHA',
  },
} as const

type KvMode = keyof typeof KV
const MODE_ORDER: readonly KvMode[] = ['mha', 'gqa', 'mla']

const MARKS = [
  { gb: 80, label: 'H100 · 80 GB' },
  { gb: 192, label: 'B200 · 192 GB' },
]

export function KVCalculator() {
  const [mode, setMode] = useState<KvMode>('gqa')
  const [exp, setExp] = useState(17)

  const tokens = Math.round(2 ** exp)
  const gb = (tokens * KV[mode].bytesPerToken) / BYTES_PER_GB
  const gbText = gb < 10 ? gb.toFixed(1) : Math.round(gb).toLocaleString('en-US')
  const fillPct = Math.min(100, (gb / TRACK_MAX_GB) * 100)
  const h100s = Math.ceil(gb / H100_GB)

  return (
    <div className="rounded-[14px] border border-(--card-line) bg-(--card-bg) px-[30px] py-8">
      <Tag accent="clay">Debt №1 · inference memory</Tag>
      <H3 className="mt-2.5">The KV cache: attention's rent, in gigabytes</H3>
      <p className="max-w-[62ch] text-[15px] text-(--soft)">
        To avoid recomputing the past at every generated token, you cache every layer's keys and
        values — trading the quadratic recompute for a memory bill that grows with every token of
        context. For a 70B-class model:
      </p>

      <div className="my-[18px] mb-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Attention variant">
        {MODE_ORDER.map((m) => (
          <Pill key={m} pressed={mode === m} swatch={KV[m].swatch} onClick={() => setMode(m)}>
            {KV[m].name}
          </Pill>
        ))}
      </div>

      <label className="font-mono text-[13px] text-(--note)" htmlFor="kvRange">
        context length:{' '}
        <strong className="text-paper">{tokens.toLocaleString('en-US')}</strong> tokens
      </label>
      <input
        id="kvRange"
        type="range"
        min={10}
        max={20}
        step={0.25}
        value={exp}
        onChange={(e) => setExp(Number(e.target.value))}
        aria-label="Context length (log scale)"
        className="mt-[26px] w-full"
      />

      <div className="font-display text-clay mt-4 text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.1] font-bold tracking-[-0.02em]">
        {gbText} GB{' '}
        <span className="text-[0.45em] font-semibold text-(--note)">of cache — before weights</span>
      </div>

      <div className="bg-linedark relative mt-5 h-[30px] rounded-[7px]">
        <div
          className="bg-clay absolute top-0 bottom-0 left-0 max-w-full rounded-[7px] transition-[width] duration-[350ms]"
          style={{ width: `${fillPct}%` }}
        />
        {MARKS.map((mk) => (
          <div
            key={mk.label}
            className="bg-paper absolute -top-[7px] -bottom-[7px] w-[2px] opacity-70"
            style={{ left: `${(mk.gb / TRACK_MAX_GB) * 100}%` }}
          >
            <span className="font-mono absolute -top-[22px] -left-2 text-[10.5px] whitespace-nowrap text-(--note)">
              {mk.label}
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono mt-3.5 text-[13px] text-(--note)">
        {KV[mode].meta} · this cache alone needs {h100s} × H100{h100s > 1 ? 's' : ''}
      </p>
    </div>
  )
}
