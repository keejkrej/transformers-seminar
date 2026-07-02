import { useEffect, useState } from 'react'
import { TALK_SECTIONS } from '../data/talk'

/**
 * Fixed left progress rail for the talk page. Tracks the section under the
 * viewport center; label colors flip on dark sections. Hidden below 1180px.
 */
export function Rail() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const s of TALK_SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  const onDark = TALK_SECTIONS.find((s) => s.id === active)?.dark ?? false

  return (
    <nav
      aria-label="Talk sections"
      className="fixed top-1/2 left-[26px] z-50 hidden -translate-y-1/2 flex-col gap-2.5 min-[1180px]:flex"
    >
      {TALK_SECTIONS.map((s) => {
        const isActive = s.id === active
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`group flex items-center gap-2.5 no-underline transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-45 hover:opacity-100'
            }`}
          >
            <span
              className={`h-[7px] w-[7px] flex-none rounded-full transition-all ${
                isActive ? 'bg-clay scale-150' : onDark ? 'bg-paper' : 'bg-ink'
              }`}
            />
            <span
              className={`font-display text-[10px] font-semibold tracking-[0.14em] uppercase whitespace-nowrap transition-all ${
                onDark ? 'text-paper' : 'text-ink'
              } ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}
            >
              {s.label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}

/** Thin clay scroll-progress bar pinned to the top of the viewport. */
export function TopProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      setPct((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      aria-hidden="true"
      className="bg-clay fixed top-0 left-0 z-60 h-[3px]"
      style={{ width: `${pct}%` }}
    />
  )
}
