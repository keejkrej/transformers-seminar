import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Presenter annotation layer: freehand pen strokes and text highlights over
 * the talk, persisted to localStorage so they survive reloads.
 *
 * Anchoring: strokes are stored in coordinates normalized to the bounding box
 * of the `section[id]` they start over, so they track their content across
 * window sizes and content edits elsewhere on the page. Highlights are stored
 * as child-index paths from their section root to the start/end text nodes
 * (the rendered DOM is deterministic), and painted with the CSS Custom
 * Highlight API — no DOM mutation. Entries that no longer resolve after a
 * content edit are skipped silently.
 */

type Tool = 'off' | 'pen' | 'highlight' | 'erase'

interface Stroke {
  section: string
  /** points normalized to the section box: [x/w, y/h] */
  pts: [number, number][]
}

interface StoredHighlight {
  section: string
  start: number[]
  startOffset: number
  end: number[]
  endOffset: number
}

interface Saved {
  strokes: Stroke[]
  highlights: StoredHighlight[]
  history: ('stroke' | 'hl')[]
}

const STORAGE_KEY = 'talk-annotations-v1'
const HIGHLIGHT_NAME = 'talk-annotations'
const HL_SUPPORTED = typeof CSS !== 'undefined' && 'highlights' in CSS

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Saved
  } catch {
    /* corrupted or unavailable storage — start clean */
  }
  return { strokes: [], highlights: [], history: [] }
}

function save(data: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* storage full or blocked — annotations stay in-memory */
  }
}

/** Child-index path from `root` down to `node`. */
function nodePath(node: Node, root: Element): number[] | null {
  const path: number[] = []
  let cur: Node = node
  while (cur !== root) {
    const parent: Node | null = cur.parentNode
    if (!parent) return null
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, cur))
    cur = parent
  }
  return path
}

function resolvePath(root: Element, path: number[]): Node | null {
  let cur: Node = root
  for (const i of path) {
    const next: Node | undefined = cur.childNodes[i]
    if (!next) return null
    cur = next
  }
  return cur
}

/** Document-space rect of a section element. */
function sectionRect(id: string): { left: number; top: number; w: number; h: number } | null {
  const el = document.getElementById(id)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left + scrollX, top: r.top + scrollY, w: r.width, h: r.height }
}

/** Rebuild a live Range from a stored highlight; null if the path is stale. */
function resolveHighlight(h: StoredHighlight): Range | null {
  const root = document.getElementById(h.section)
  if (!root) return null
  const s = resolvePath(root, h.start)
  const e = resolvePath(root, h.end)
  if (!s || !e) return null
  try {
    const r = new Range()
    r.setStart(s, h.startOffset)
    r.setEnd(e, h.endOffset)
    return r
  } catch {
    return null
  }
}

/** Distance from point p to segment ab, all in the same coordinate space. */
function segDist(p: [number, number], a: [number, number], b: [number, number]): number {
  const vx = b[0] - a[0]
  const vy = b[1] - a[1]
  const len2 = vx * vx + vy * vy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2))
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy))
}

function strokePath(pts: [number, number][]): string {
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

const BTN =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-colors'

/** Inline icon paths from Lucide (lucide.dev, ISC license). */
const ICONS = {
  pencil: [
    'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    'm15 5 4 4',
  ],
  highlighter: ['m9 11-6 6v3h9l3-3', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'],
  eraser: [
    'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21',
    'M22 21H7',
    'm5 11 9 9',
  ],
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11'],
  trash: [
    'M3 6h18',
    'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
    'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
} as const

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {ICONS[name].map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

export function Annotate() {
  const [tool, setTool] = useState<Tool>('off')
  const [saved, setSaved] = useState<Saved>(load)
  const [docHeight, setDocHeight] = useState(0)
  const [, setLayoutTick] = useState(0)
  const [live, setLive] = useState<[number, number][] | null>(null)

  const drawing = useRef<{ pts: [number, number][]; clientStart: [number, number] } | null>(null)
  const savedRef = useRef(saved)
  savedRef.current = saved

  const update = useCallback((next: Saved) => {
    setSaved(next)
    save(next)
  }, [])

  // Track document height and re-anchor strokes when layout changes.
  useEffect(() => {
    const measure = () => {
      setDocHeight(document.documentElement.scrollHeight)
      setLayoutTick((t) => t + 1)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      removeEventListener('resize', measure)
    }
  }, [])

  // Paint stored highlights through the CSS Custom Highlight API.
  useEffect(() => {
    if (!HL_SUPPORTED) return
    const ranges = saved.highlights
      .map(resolveHighlight)
      .filter((r): r is Range => r !== null)
    CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges))
    return () => {
      CSS.highlights.delete(HIGHLIGHT_NAME)
    }
  }, [saved.highlights])

  // Highlight tool: capture the selection on pointerup, store, then clear it.
  useEffect(() => {
    if (tool !== 'highlight' || !HL_SUPPORTED) return
    const onUp = () => {
      setTimeout(() => {
        const sel = getSelection()
        if (!sel || sel.isCollapsed) return
        const additions: StoredHighlight[] = []
        for (let i = 0; i < sel.rangeCount; i++) {
          const r = sel.getRangeAt(i)
          const anchor =
            r.commonAncestorContainer instanceof Element
              ? r.commonAncestorContainer
              : r.commonAncestorContainer.parentElement
          const section = anchor?.closest('section[id]')
          if (!section) continue
          const start = nodePath(r.startContainer, section)
          const end = nodePath(r.endContainer, section)
          if (!start || !end) continue
          additions.push({
            section: section.id,
            start,
            startOffset: r.startOffset,
            end,
            endOffset: r.endOffset,
          })
        }
        if (!additions.length) return
        sel.removeAllRanges()
        const cur = savedRef.current
        update({
          ...cur,
          highlights: [...cur.highlights, ...additions],
          history: [...cur.history, ...additions.map(() => 'hl' as const)],
        })
      }, 0)
    }
    document.addEventListener('pointerup', onUp)
    return () => document.removeEventListener('pointerup', onUp)
  }, [tool, update])

  // Escape exits the active tool.
  useEffect(() => {
    if (tool === 'off') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTool('off')
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [tool])

  const onPenDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool !== 'pen') return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = {
      pts: [[e.clientX + scrollX, e.clientY + scrollY]],
      clientStart: [e.clientX, e.clientY],
    }
    setLive(drawing.current.pts)
  }

  const onPenMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drawing.current
    if (!d) return
    const p: [number, number] = [e.clientX + scrollX, e.clientY + scrollY]
    const last = d.pts[d.pts.length - 1]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 3) return
    d.pts.push(p)
    setLive([...d.pts])
  }

  const onPenUp = () => {
    const d = drawing.current
    drawing.current = null
    setLive(null)
    if (!d || d.pts.length < 2) return
    // Anchor to the section under the stroke's first point.
    const section = document
      .elementsFromPoint(d.clientStart[0], d.clientStart[1])
      .find((el): el is Element => el instanceof Element && el.matches('section[id]'))
    if (!section) return
    const r = sectionRect(section.id)
    if (!r || r.w === 0 || r.h === 0) return
    const pts = d.pts.map(
      ([x, y]) => [(x - r.left) / r.w, (y - r.top) / r.h] as [number, number],
    )
    const cur = savedRef.current
    update({
      ...cur,
      strokes: [...cur.strokes, { section: section.id, pts }],
      history: [...cur.history, 'stroke'],
    })
  }

  /** Remove one annotation and its matching history entry. */
  const removeAt = (kind: 'stroke' | 'hl', idx: number) => {
    const cur = savedRef.current
    let seen = -1
    let hIdx = -1
    for (let i = 0; i < cur.history.length; i++) {
      if (cur.history[i] === kind && ++seen === idx) {
        hIdx = i
        break
      }
    }
    update({
      strokes: kind === 'stroke' ? cur.strokes.filter((_, i) => i !== idx) : cur.strokes,
      highlights: kind === 'hl' ? cur.highlights.filter((_, i) => i !== idx) : cur.highlights,
      history: hIdx >= 0 ? cur.history.filter((_, i) => i !== hIdx) : cur.history,
    })
  }

  /** Eraser click: nearest stroke within reach first, then any highlight under the point. */
  const onErase = (e: React.PointerEvent<SVGSVGElement>) => {
    const doc: [number, number] = [e.clientX + scrollX, e.clientY + scrollY]
    const cur = savedRef.current

    let best = { dist: 12, idx: -1 }
    cur.strokes.forEach((stroke, idx) => {
      const r = sectionRect(stroke.section)
      if (!r) return
      const pts = stroke.pts.map(
        ([nx, ny]) => [r.left + nx * r.w, r.top + ny * r.h] as [number, number],
      )
      for (let i = 1; i < pts.length; i++) {
        const d = segDist(doc, pts[i - 1], pts[i])
        if (d < best.dist) best = { dist: d, idx }
      }
    })
    if (best.idx >= 0) {
      removeAt('stroke', best.idx)
      return
    }

    const PAD = 3
    for (let idx = 0; idx < cur.highlights.length; idx++) {
      const range = resolveHighlight(cur.highlights[idx])
      if (!range) continue
      for (const rect of range.getClientRects()) {
        if (
          e.clientX >= rect.left - PAD &&
          e.clientX <= rect.right + PAD &&
          e.clientY >= rect.top - PAD &&
          e.clientY <= rect.bottom + PAD
        ) {
          removeAt('hl', idx)
          return
        }
      }
    }
  }

  const undo = () => {
    const cur = savedRef.current
    const kind = cur.history[cur.history.length - 1]
    if (!kind) return
    update({
      strokes: kind === 'stroke' ? cur.strokes.slice(0, -1) : cur.strokes,
      highlights: kind === 'hl' ? cur.highlights.slice(0, -1) : cur.highlights,
      history: cur.history.slice(0, -1),
    })
  }

  const clearAll = () => {
    if (saved.strokes.length + saved.highlights.length === 0) return
    if (!confirm('Remove all annotations on this page?')) return
    update({ strokes: [], highlights: [], history: [] })
  }

  const toggle = (t: Tool) => setTool((cur) => (cur === t ? 'off' : t))

  return (
    <>
      {/* Drawing overlay: spans the whole document, transparent to input
          except while the pen is active. */}
      <svg
        aria-hidden="true"
        width="100%"
        height={docHeight}
        className="absolute top-0 left-0 z-[55]"
        style={{
          pointerEvents: tool === 'pen' || tool === 'erase' ? 'auto' : 'none',
          cursor: tool === 'pen' ? 'crosshair' : tool === 'erase' ? 'pointer' : undefined,
          touchAction: tool === 'pen' || tool === 'erase' ? 'none' : undefined,
        }}
        onPointerDown={(e) => (tool === 'erase' ? onErase(e) : onPenDown(e))}
        onPointerMove={onPenMove}
        onPointerUp={onPenUp}
        onPointerCancel={onPenUp}
      >
        {saved.strokes.map((s, i) => {
          const r = sectionRect(s.section)
          if (!r) return null
          const pts = s.pts.map(
            ([nx, ny]) => [r.left + nx * r.w, r.top + ny * r.h] as [number, number],
          )
          return (
            <path
              key={i}
              d={strokePath(pts)}
              fill="none"
              stroke="var(--color-clay)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          )
        })}
        {live && (
          <path
            d={strokePath(live)}
            fill="none"
            stroke="var(--color-clay)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        )}
      </svg>

      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Annotations"
        className="bg-paper border-mist text-ink fixed right-5 bottom-5 z-[70] flex items-center gap-1.5 rounded-full border p-1.5 shadow-[0_4px_18px_rgba(20,20,19,0.18)]"
      >
        <button
          type="button"
          aria-pressed={tool === 'pen'}
          title="Pen — draw on the page (Esc to stop)"
          onClick={() => toggle('pen')}
          className={`${BTN} ${tool === 'pen' ? 'bg-clay border-clay text-paper' : 'border-transparent hover:border-stone'}`}
        >
          <Icon name="pencil" />
        </button>
        <button
          type="button"
          aria-pressed={tool === 'highlight'}
          title={
            HL_SUPPORTED
              ? 'Highlighter — select text to highlight it (Esc to stop)'
              : 'Highlighting is not supported in this browser'
          }
          disabled={!HL_SUPPORTED}
          onClick={() => toggle('highlight')}
          className={`${BTN} ${tool === 'highlight' ? 'bg-clay border-clay text-paper' : 'border-transparent hover:border-stone'} disabled:cursor-not-allowed disabled:opacity-35`}
        >
          <Icon name="highlighter" />
        </button>
        <button
          type="button"
          aria-pressed={tool === 'erase'}
          title="Eraser — click an annotation to remove it (Esc to stop)"
          onClick={() => toggle('erase')}
          className={`${BTN} ${tool === 'erase' ? 'bg-clay border-clay text-paper' : 'border-transparent hover:border-stone'}`}
        >
          <Icon name="eraser" />
        </button>
        <span aria-hidden="true" className="bg-mist h-5 w-px" />
        <button
          type="button"
          title="Undo last annotation"
          onClick={undo}
          disabled={saved.history.length === 0}
          className={`${BTN} border-transparent hover:border-stone disabled:cursor-not-allowed disabled:opacity-35`}
        >
          <Icon name="undo" />
        </button>
        <button
          type="button"
          title="Remove all annotations"
          onClick={clearAll}
          disabled={saved.strokes.length + saved.highlights.length === 0}
          className={`${BTN} border-transparent hover:border-stone disabled:cursor-not-allowed disabled:opacity-35`}
        >
          <Icon name="trash" />
        </button>
      </div>
    </>
  )
}
