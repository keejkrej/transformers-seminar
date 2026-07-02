import type { ReactNode } from 'react'
import type { Accent } from '../data/modules'

const TAG_COLOR: Record<Accent | 'gray', string> = {
  clay: 'text-clay',
  sky: 'text-sky',
  olive: 'text-olive',
  gray: 'text-stone',
}

/** Bordered content card; adapts to light/dark sections via context vars. */
export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-[10px] border border-(--card-line) bg-(--card-bg) p-6 [&_p]:text-[15px] [&_p]:text-(--soft) ${className}`}
    >
      {children}
    </div>
  )
}

/** Small caps label at the top of a card. */
export function Tag({
  accent = 'clay',
  className = '',
  children,
}: {
  accent?: Accent | 'gray'
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`${TAG_COLOR[accent]} font-display mb-3.5 inline-block text-[11px] font-semibold tracking-[0.16em] uppercase ${className}`}
    >
      {children}
    </span>
  )
}

/** Big number + small caps label, for stat grids. */
export function Stat({
  num,
  label,
  accent = 'clay',
}: {
  num: ReactNode
  label: ReactNode
  accent?: Accent
}) {
  return (
    <div className="px-1 py-5">
      <div
        className={`${TAG_COLOR[accent]} font-display text-[clamp(1.7rem,3vw,2.5rem)] leading-none font-bold tracking-[-0.02em]`}
      >
        {num}
      </div>
      <div className="font-display text-stone mt-2 text-[11.5px] font-semibold tracking-[0.14em] uppercase">
        {label}
      </div>
    </div>
  )
}
