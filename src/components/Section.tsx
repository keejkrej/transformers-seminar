import type { ReactNode } from 'react'

export type SectionVariant = 'paper' | 'tint' | 'dark'

const VARIANT: Record<SectionVariant, string> = {
  paper: 'sec-paper bg-paper text-ink',
  tint: 'sec-tint bg-mist text-ink',
  dark: 'sec-dark bg-ink text-paper',
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
