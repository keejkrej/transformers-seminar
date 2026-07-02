import type { ReactNode } from 'react'
import type { Accent } from '../data/modules'

const ACCENT_TEXT: Record<Accent, string> = {
  clay: 'text-clay',
  sky: 'text-sky',
  olive: 'text-olive',
}

/** Small caps kicker above a section heading, with a leading dash. */
export function Eyebrow({
  accent = 'clay',
  className = '',
  children,
}: {
  accent?: Accent
  className?: string
  children: ReactNode
}) {
  return (
    <p
      className={`${ACCENT_TEXT[accent]} font-display mb-6 flex items-center gap-3.5 text-xs font-semibold tracking-[0.22em] uppercase before:h-0.5 before:w-[34px] before:bg-current before:content-[''] ${className}`}
    >
      {children}
    </p>
  )
}

export function H2({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <h2
      className={`font-display mb-6 max-w-[19ch] text-[clamp(2rem,4.6vw,3.3rem)] leading-[1.08] font-bold tracking-[-0.015em] ${className}`}
    >
      {children}
    </h2>
  )
}

export function H3({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <h3
      className={`font-display mb-3 text-[clamp(1.15rem,2vw,1.45rem)] leading-tight font-semibold ${className}`}
    >
      {children}
    </h3>
  )
}

/** Section intro paragraph — bigger, soft color. */
export function Lede({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`max-w-[60ch] text-[clamp(1.06rem,1.5vw,1.28rem)] text-(--soft) ${className}`}>
      {children}
    </p>
  )
}

export function Body({ className = '', children }: { className?: string; children: ReactNode }) {
  return <p className={`mt-4 max-w-[62ch] text-(--soft) ${className}`}>{children}</p>
}

/** Small italic aside. */
export function Note({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`mt-3.5 max-w-[60ch] text-[13.5px] text-(--note) italic ${className}`}>
      {children}
    </p>
  )
}
