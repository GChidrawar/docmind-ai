import { Brain } from 'lucide-react'
import clsx from 'clsx'

const sizes = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 18 },
  md: { box: 'h-11 w-11 rounded-xl', icon: 24 },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 30 },
} as const

/** The DocMind logo (a brain on the brand gradient), shared by the header, auth and error screens. */
export default function BrandMark({ size = 'sm', className }: { size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size]
  return (
    <span
      aria-hidden="true"
      className={clsx('flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-from to-brand-to text-white shadow-md shadow-brand/30', s.box, className)}
    >
      <Brain size={s.icon} />
    </span>
  )
}
