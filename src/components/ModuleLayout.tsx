import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { moduleBySlug, moduleNeighbors } from '../data/modules'
import { Section, Wrap } from './Section'
import { Reveal } from './Reveal'
import { Eyebrow, Lede } from './Type'

export interface Reference {
  label: string
  url?: string
}

/**
 * Shared shell for the six extension-module deep-dive pages: dark hero with
 * the module identity, optional hero stat chips, content (children), a
 * references block, and prev/next module navigation.
 *
 * Children are rendered inside a light `Section`; pass your own `Section`s
 * instead via `bare` if the page needs multiple variants.
 */
export function ModuleLayout({
  slug,
  heroExtra,
  chips = [],
  references = [],
  bare = false,
  children,
}: {
  slug: string
  /** rendered under the tagline in the hero — e.g. a lede paragraph */
  heroExtra?: ReactNode
  /** short mono facts shown as chips in the hero */
  chips?: string[]
  references?: Reference[]
  bare?: boolean
  children: ReactNode
}) {
  const meta = moduleBySlug(slug)
  const { prev, next } = moduleNeighbors(slug)

  useEffect(() => {
    if (meta) document.title = `${meta.title} — extension module ${meta.num}`
  }, [meta])

  if (!meta) return null

  return (
    <main>
      <Section variant="dark" className="min-h-[62vh] py-[12vh]">
        <Wrap>
          <Reveal>
            <Link
              to="/"
              hash="debt"
              className="font-display text-stone hover:text-paper mb-10 inline-block text-[12px] font-semibold tracking-[0.14em] uppercase no-underline transition-colors"
            >
              ← The talk · Part 08
            </Link>
            <Eyebrow accent={meta.accent}>Extension module {meta.num}</Eyebrow>
            <h1 className="font-display mb-6 max-w-[16ch] text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] font-bold tracking-[-0.02em]">
              {meta.title}
            </h1>
            <Lede>{meta.tagline}</Lede>
            {heroExtra}
            {chips.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="font-mono border-linedark text-fog rounded-full border px-3.5 py-1.5 text-[12px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </Reveal>
        </Wrap>
      </Section>

      {bare ? children : <Section variant="paper">{children}</Section>}

      <Section variant="dark" className="py-[8vh]">
        <Wrap>
          {references.length > 0 && (
            <div className="mb-14">
              <p className="font-display text-stone mb-4 text-[11px] font-semibold tracking-[0.2em] uppercase">
                References
              </p>
              <div className="columns-1 gap-11 text-[13.5px] text-[#8a887e] md:columns-2">
                {references.map((r) => (
                  <div key={r.label} className="mb-2.5 break-inside-avoid">
                    {r.url ? (
                      <a href={r.url} className="text-fog decoration-linedark hover:text-paper">
                        {r.label}
                      </a>
                    ) : (
                      r.label
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="font-display flex flex-wrap items-center justify-between gap-4 text-[13px] font-semibold">
            {prev ? (
              <Link
                to="/m/$slug"
                params={{ slug: prev.slug }}
                className="text-fog hover:text-paper no-underline transition-colors"
              >
                ← {prev.num} · {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to="/m/$slug"
                params={{ slug: next.slug }}
                className="text-fog hover:text-paper no-underline transition-colors"
              >
                {next.num} · {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </Wrap>
      </Section>
    </main>
  )
}
