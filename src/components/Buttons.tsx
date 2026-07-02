import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Round-cornered action button. `primary` = filled clay. */
export function Btn({
  primary = false,
  className = '',
  children,
  ...rest
}: { primary?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const style = primary
    ? 'bg-clay border-clay text-paper hover:bg-[#c4633f] hover:border-[#c4633f]'
    : 'border-current bg-transparent hover:bg-ink hover:text-paper [.sec-dark_&]:hover:bg-paper [.sec-dark_&]:hover:text-ink'
  return (
    <button
      type="button"
      className={`font-display cursor-pointer rounded-full border-[1.5px] px-5 py-2 text-[13px] font-semibold tracking-[0.06em] transition-colors ${style} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Toggle pill with a colored swatch dot; pass `pressed` for aria + style. */
export function Pill({
  pressed,
  swatch,
  className = '',
  children,
  ...rest
}: {
  pressed: boolean
  swatch?: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`font-display inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-4 py-1.5 text-[12.5px] font-semibold transition-all ${
        pressed ? 'border-current opacity-100' : 'border-(--card-line) opacity-40'
      } text-(--soft) ${className}`}
      {...rest}
    >
      {swatch && (
        <span className="h-[9px] w-[9px] rounded-full" style={{ background: swatch }} />
      )}
      {children}
    </button>
  )
}
