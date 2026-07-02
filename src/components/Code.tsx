import type { ReactNode } from 'react'
import type { Accent } from '../data/modules'

const ACCENT_TEXT: Record<Accent, string> = {
  clay: 'text-clay',
  sky: 'text-sky',
  olive: 'text-olive',
}

/** Code-block background: 'card' matches the formula cards, 'ink' sits darker inside a Card. */
const TONE_BG: Record<'card' | 'ink', string> = {
  card: 'bg-(--card-bg)',
  ink: 'bg-ink',
}

const PY_KEYWORDS = new Set([
  'def',
  'return',
  'if',
  'else',
  'elif',
  'for',
  'in',
  'is',
  'not',
  'and',
  'or',
  'import',
  'from',
  'as',
  'with',
  'lambda',
  'class',
  'None',
  'True',
  'False',
])

const TOKEN_CLASS: Record<string, string> = {
  comment: 'text-(--note) italic',
  string: 'text-olive',
  number: 'text-sky',
  keyword: 'text-clay',
}

const TOKEN_RX =
  /(#[^\n]*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(\b\d[\w.]*\b)|(\b[A-Za-z_]\w*\b)/g

/** Minimal Python tokenizer — enough for the short teaching snippets on this site. */
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of code.matchAll(TOKEN_RX)) {
    const at = m.index ?? 0
    if (at > last) out.push(code.slice(last, at))
    const [text, comment, string, number, ident] = m
    const kind = comment
      ? 'comment'
      : string
        ? 'string'
        : number
          ? 'number'
          : ident && PY_KEYWORDS.has(ident)
            ? 'keyword'
            : undefined
    out.push(
      kind ? (
        <span key={at} className={TOKEN_CLASS[kind]}>
          {text}
        </span>
      ) : (
        text
      ),
    )
    last = at + text.length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

/** Strip surrounding blank lines and the common leading indentation. */
function dedent(code: string): string {
  const lines = code.replace(/^\n+|\s+$/g, '').split('\n')
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length)
  const cut = Math.min(...indents)
  return lines.map((l) => l.slice(cut)).join('\n')
}

/**
 * Teaching code block, styled to sit beside the KaTeX formula cards.
 * `children` is the raw Python source as a string.
 */
export function Code({
  label,
  accent = 'clay',
  tone = 'card',
  className = '',
  children,
}: {
  label?: ReactNode
  accent?: Accent
  tone?: 'card' | 'ink'
  className?: string
  children: string
}) {
  return (
    <figure
      className={`overflow-hidden rounded-[14px] border border-(--card-line) ${TONE_BG[tone]} ${className}`}
    >
      {label && (
        <figcaption className="border-b border-(--card-line) px-[26px] py-3">
          <span
            className={`${ACCENT_TEXT[accent]} font-display text-[11px] font-semibold tracking-[0.16em] uppercase`}
          >
            {label}
          </span>
        </figcaption>
      )}
      <pre className="overflow-x-auto px-[26px] py-5">
        <code className="font-mono text-fog text-[13.5px] leading-[1.75]">
          {highlight(dedent(children))}
        </code>
      </pre>
    </figure>
  )
}
