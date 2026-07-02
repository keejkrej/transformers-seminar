import type { ReactNode } from 'react'

export type SectionVariant = 'paper' | 'tint' | 'dark'

/**
 * The site is dark throughout; the old light variants map to two shades of
 * dark so adjacent sections keep a visible rhythm. `--sec-bg` exposes the
 * actual section background to widgets that must match it exactly.
 */
const VARIANT: Record<SectionVariant, string> = {
  paper: 'sec-dark bg-ink text-paper [--sec-bg:var(--color-ink)]',
  tint: 'sec-dark bg-inktint text-paper [--sec-bg:var(--color-inktint)]',
  dark: 'sec-dark bg-ink text-paper [--sec-bg:var(--color-ink)]',
}

/**
 * Full-width talk/page section. Sets the variant context vars
 * (--soft, --card-bg, --card-line, --note) that kit components consume.
 */
export function Section({
  id,
  variant = 'paper',
  className = '',
  children,
}: {
  id?: string
  variant?: SectionVariant
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`relative py-[15vh] ${VARIANT[variant]} ${className}`}>
      {children}
    </section>
  )
}

/** Centered content column, 1060px max. */
export function Wrap({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto max-w-[1060px] px-7 ${className}`}>{children}</div>
}
