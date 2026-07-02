import type { ReactNode } from 'react'
import { moduleBySlug } from '../data/modules'
import { Section, Wrap } from './Section'
import { Reveal } from './Reveal'
import { Eyebrow, Lede } from './Type'

export interface Reference {
  label: string
  url?: string
}

/**
 * Shell for an extension module, rendered inline in the talk scroll: a dark
 * hero with the module identity, optional hero stat chips, content (children),
 * and a references block. Emits a fragment of `Section`s (no `<main>`) so it
 * drops straight into the page between the talk's own sections. The hero gets
 * `id={slug}` so links can anchor-scroll to it.
 *
 * Children are rendered inside a light `Section` unless `bare` is set, in which
 * case the module supplies its own `Section`s.
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
  if (!meta) return null

  return (
    <>
      <Section variant="dark" id={slug} className="min-h-[62vh] py-[12vh]">
        <Wrap>
          <Reveal>
            <Eyebrow accent={meta.accent}>Extension module {meta.num}</Eyebrow>
            <h2 className="font-display mb-6 max-w-[16ch] text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] font-bold tracking-[-0.02em]">
              {meta.title}
            </h2>
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

      {references.length > 0 && (
        <Section variant="dark" className="py-[8vh]">
          <Wrap>
            <p className="font-display text-stone mb-4 text-[11px] font-semibold tracking-[0.2em] uppercase">
              References · {meta.num}
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
          </Wrap>
        </Section>
      )}
    </>
  )
}
