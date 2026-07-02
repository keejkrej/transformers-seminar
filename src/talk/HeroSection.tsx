import { Fragment, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Section, Wrap } from '../components/Section'
import { Reveal } from '../components/Reveal'
import { PAPER } from '../data/paper'

const WORDS = ['Attention', 'Is', 'All', 'You', 'Need'] as const

/** Arc colors cycle clay → sky → olive, matching the site accent order. */
const ARC_COLORS = [
  'var(--color-clay)',
  'var(--color-sky)',
  'var(--color-olive)',
]

const CHIPS = [
  PAPER.venue,
  'Google Brain · Google Research',
  `${PAPER.authors} authors, equal contribution`,
  `${PAPER.pages} pages`,
  `arXiv:${PAPER.arxiv.split('/abs/')[1]}`,
]

/** Static arc pairs shown when the user prefers reduced motion. */
const STATIC_ARCS: [number, number][] = [
  [0, 4],
  [0, 2],
  [1, 3],
]

/** 00 · Opening — title screen with ambient attention arcs over the words. */
export function HeroSection() {
  const reduced = useReducedMotion()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const svg = svgRef.current
    const title = titleRef.current
    if (!svg || !title) return
    const words = wordRefs.current.filter((w): w is HTMLSpanElement => w !== null)
    if (words.length < WORDS.length) return

    const size = () => {
      const r = title.getBoundingClientRect()
      svg.setAttribute('width', String(r.width))
      svg.setAttribute('height', String(r.height + 60))
      svg.setAttribute('viewBox', `0 -60 ${r.width} ${r.height + 60}`)
    }

    const anchor = (w: HTMLSpanElement) => {
      const wr = w.getBoundingClientRect()
      const tr = title.getBoundingClientRect()
      return { x: wr.left - tr.left + wr.width / 2, y: wr.top - tr.top + 6 }
    }

    const makePath = (d: string, stroke: string, width: string, opacity: string) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', d)
      p.setAttribute('stroke', stroke)
      p.setAttribute('stroke-width', width)
      p.setAttribute('opacity', opacity)
      p.setAttribute('fill', 'none')
      p.setAttribute('stroke-linecap', 'round')
      return p
    }

    const clearArcs = () => {
      while (svg.firstChild) svg.removeChild(svg.firstChild)
    }

    const timeouts = new Set<number>()
    let arcTick = 0

    // One ambient arc: 60% of arcs originate from "Attention"; quadratic
    // curve to a random other word, stroke-dash draw-in, then fade out.
    const drawArc = () => {
      const i = Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 4)
      let j: number
      do {
        j = Math.floor(Math.random() * 5)
      } while (j === i)
      const a = anchor(words[i])
      const b = anchor(words[j])
      const mx = (a.x + b.x) / 2
      const lift = Math.max(30, Math.abs(b.x - a.x) * 0.22) + Math.abs(a.y - b.y) * 0.4
      const my = Math.min(a.y, b.y) - lift
      const p = makePath(
        `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`,
        ARC_COLORS[arcTick++ % 3],
        '2.2',
        '0.85',
      )
      svg.appendChild(p)
      const len = p.getTotalLength()
      p.style.strokeDasharray = String(len)
      p.style.strokeDashoffset = String(len)
      p.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)'
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          p.style.strokeDashoffset = '0'
        }),
      )
      timeouts.add(
        window.setTimeout(() => {
          p.style.transition = 'opacity .9s'
          p.style.opacity = '0'
        }, 1700),
      )
      timeouts.add(window.setTimeout(() => p.remove(), 2700))
    }

    const drawStatic = () => {
      clearArcs()
      STATIC_ARCS.forEach(([i, j], n) => {
        const a = anchor(words[i])
        const b = anchor(words[j])
        svg.appendChild(
          makePath(
            `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 60} ${b.x} ${b.y}`,
            ARC_COLORS[n % 3],
            '2',
            '0.6',
          ),
        )
      })
    }

    size()
    const onResize = () => {
      size()
      if (reduced) drawStatic()
    }
    window.addEventListener('resize', onResize)

    let interval = 0
    if (reduced) {
      drawStatic()
    } else {
      interval = window.setInterval(drawArc, 1300)
      timeouts.add(window.setTimeout(drawArc, 400))
    }

    return () => {
      window.removeEventListener('resize', onResize)
      if (interval) window.clearInterval(interval)
      timeouts.forEach((t) => window.clearTimeout(t))
      clearArcs()
    }
  }, [reduced])

  return (
    <Section id="hero" variant="dark" className="flex min-h-screen items-center overflow-hidden">
      <Wrap className="w-full">
        <Reveal>
          <p className="font-display text-clay mb-[34px] text-[12.5px] font-semibold tracking-[0.28em] uppercase">
            A seminar in one continuous scroll · Vaswani et al., 2017
          </p>
          <h1
            ref={titleRef}
            className="font-display relative max-w-[14ch] text-[clamp(2.6rem,8.2vw,6.2rem)] leading-[1.04] font-bold tracking-[-0.02em]"
          >
            <svg
              ref={svgRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-[-60px] left-0 z-[1] h-[calc(100%+60px)] w-full overflow-visible"
            />
            {WORDS.map((word, n) => (
              <Fragment key={word}>
                <span
                  ref={(el) => {
                    wordRefs.current[n] = el
                  }}
                  className="relative z-[2] inline-block"
                >
                  {word}
                </span>
                {n < WORDS.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-[38px] max-w-[56ch] text-[clamp(1rem,1.4vw,1.2rem)] text-(--soft)">
            Eight people at Google threw away recurrence, kept one mechanism, and accidentally
            built the substrate of modern AI. This page is the talk — just keep scrolling.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-[30px] flex flex-wrap gap-2.5">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="font-display text-stone rounded-full border border-(--card-line) px-[15px] py-[7px] text-[12px] font-semibold tracking-[0.08em]"
              >
                {chip}
              </span>
            ))}
          </div>
        </Reveal>
      </Wrap>
      <div className="font-display absolute bottom-[34px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 text-[11px] font-semibold tracking-[0.24em] uppercase text-(--note)">
        Scroll
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          animate={reduced ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
        >
          <path
            d="M3 6l5 5 5-5"
            stroke="var(--color-clay)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.svg>
      </div>
    </Section>
  )
}
