import { useEffect } from 'react'
import { Annotate } from '../components/Annotate'
import { Rail, TopProgress } from '../components/Rail'
import { TALK_SECTIONS } from '../data/talk'
import { HeroSection } from '../talk/HeroSection'
import { TaskSection } from '../talk/TaskSection'
import { BeforeSection } from '../talk/BeforeSection'
import { GoogleSection } from '../talk/GoogleSection'
import { LineageSection } from '../talk/LineageSection'
import { IdeaSection } from '../talk/IdeaSection'
import { TrainingSection } from '../talk/TrainingSection'
import { ImpactSection } from '../talk/ImpactSection'
import { DebtSection } from '../talk/DebtSection'
import { CodaSection } from '../talk/CodaSection'
import { MODULES } from '../data/modules'
import { MODULE_COMPONENTS } from '../modules/index'

/** The full talk: one continuous scroll, sections in TALK_SECTIONS order. */
export function TalkPage() {
  useEffect(() => {
    document.title = 'Attention Is All You Need'
  }, [])

  // ←/→ jump between sections (presenter-friendly)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const y = scrollY + innerHeight * 0.5
      const els = TALK_SECTIONS.map((s) => document.getElementById(s.id)).filter(
        (el): el is HTMLElement => el !== null,
      )
      let idx = els.findIndex((el) => el.offsetTop <= y && el.offsetTop + el.offsetHeight > y)
      if (idx < 0) idx = 0
      idx = Math.max(0, Math.min(els.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)))
      els[idx].scrollIntoView({ behavior: 'smooth' })
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="relative">
      <TopProgress />
      <Rail />
      <Annotate />
      <HeroSection />
      <TaskSection />
      <BeforeSection />
      <GoogleSection />
      <LineageSection />
      <IdeaSection />
      <TrainingSection />
      <ImpactSection />
      <DebtSection />
      {MODULES.map((m) => {
        const Module = MODULE_COMPONENTS[m.slug]
        return <Module key={m.slug} />
      })}
      <CodaSection />
    </main>
  )
}
