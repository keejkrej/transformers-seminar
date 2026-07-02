import katex from 'katex'
import { useMemo } from 'react'

/**
 * KaTeX renderer. Children is a LaTeX string (use String.raw`...`).
 * Inline by default; `block` for display mode.
 */
export function Math({
  children,
  block = false,
  className = '',
}: {
  children: string
  block?: boolean
  className?: string
}) {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
      }),
    [children, block],
  )
  if (block) {
    return (
      <div
        className={`overflow-x-auto py-2 ${className}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
