import { useCallback, useEffect, useRef, useState } from 'react'
import { Note } from '../../components/Type'

/** Four embedding dimensions: geometrically spaced frequencies, token colors. */
const DIMS = [
  { f: 1, token: '--color-clay' },
  { f: 2.4, token: '--color-sky' },
  { f: 5.8, token: '--color-olive' },
  { f: 14, token: '--color-stone' },
]

const CELLS = 16

/**
 * Sinusoidal positional-encoding explorer: four frequencies on a dark canvas,
 * a position slider with a dashed cursor, and the 16-cell "barcode" the token
 * at that position carries into the model.
 */
export function PECanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pos, setPos] = useState(28)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const styles = getComputedStyle(canvas)
    const token = (name: string) => styles.getPropertyValue(name).trim()

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = 220
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = token('--color-carddark')
    ctx.fillRect(0, 0, W, H)

    const px = (pos / 100) * (W - 40) + 20
    for (const d of DIMS) {
      ctx.beginPath()
      ctx.strokeStyle = token(d.token)
      ctx.lineWidth = 1.8
      ctx.globalAlpha = 0.9
      for (let x = 0; x <= W - 40; x++) {
        const t = (x / (W - 40)) * 100
        const y = H / 2 - Math.sin(t / d.f) * (H / 2 - 26)
        if (x === 0) ctx.moveTo(x + 20, y)
        else ctx.lineTo(x + 20, y)
      }
      ctx.stroke()
    }

    // Dashed cursor at the slider position.
    ctx.globalAlpha = 1
    ctx.strokeStyle = token('--color-paper')
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(px, 12)
    ctx.lineTo(px, H - 12)
    ctx.stroke()
    ctx.setLineDash([])
  }, [pos])

  // Draw on mount and whenever the slider moves.
  useEffect(() => {
    draw()
  }, [draw])

  // Redraw at the new width on resize.
  useEffect(() => {
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  // The barcode: 16 dims at geometrically spaced frequencies, sin/cos alternating.
  const cells = Array.from({ length: CELLS }, (_, i) => {
    const f = Math.pow(1.55, i * 0.55)
    const v = i % 2 ? Math.cos(pos / f) : Math.sin(pos / f)
    const a = (v + 1) / 2
    return `color-mix(in srgb, var(--color-clay) ${Math.round(a * 100)}%, var(--color-carddark))`
  })

  return (
    <div className="mt-[26px] rounded-[14px] border border-(--card-line) bg-(--card-bg) p-7 max-sm:p-5">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Sinusoidal positional encodings at several frequencies"
        className="block h-[220px] w-full rounded-lg"
      />
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Position along the sequence"
        className="mt-[18px] w-full"
      />
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <span className="font-display text-[11px] font-semibold tracking-[0.14em] uppercase text-(--note)">
          The PE vector at this position · one cell per dimension
        </span>
        <span
          aria-hidden="true"
          className="flex flex-none items-center gap-1.5 font-mono text-[11px] text-(--note)"
        >
          −1
          <span className="inline-block h-[11px] w-[26px] rounded-[3px] bg-[linear-gradient(90deg,var(--color-carddark),var(--color-clay))]" />
          +1
        </span>
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-[3px]">
        {cells.map((bg, i) => (
          <div key={i} className="h-[26px] flex-1 rounded-[3px]" style={{ background: bg }} />
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between font-mono text-[11px] text-(--note)">
        <span>dim 0 · fastest wave</span>
        <span>dim 15 · slowest</span>
      </div>
      <Note className="text-[14px]">
        The strip is the encoding vector the token at the dashed cursor carries into the model:
        each cell is one embedding dimension read off its wave at that position (the canvas shows
        four of the sixteen), with brightness standing in for the value. Drag the slider — the
        fast dimensions on the left flicker between tokens while the slow ones on the right drift
        across the whole sequence.
      </Note>
    </div>
  )
}
