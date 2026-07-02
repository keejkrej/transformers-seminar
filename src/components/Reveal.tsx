import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Scroll-triggered fade-up. Respects prefers-reduced-motion by rendering
 * a plain div. Use around blocks, not around inline text.
 */
export function Reveal({
  delay = 0,
  className = '',
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.6, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
