import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

interface Props {
  title: string
  subtitle?: string
  seeAllTo?: string
  children: ReactNode
  tight?: boolean
}

export function Rail({ title, subtitle, seeAllTo, children, tight }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 300), behavior: 'smooth' })
  }

  return (
    <section className="relative">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {seeAllTo && (
            <Link
              to={seeAllTo}
              className="rounded-md px-2 py-1 text-[12px] font-medium text-accent-ink hover:bg-accent-soft"
            >
              Ver tudo
            </Link>
          )}
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Rolar para a esquerda"
            className="hidden size-7 items-center justify-center rounded-md border border-line bg-surface text-ink-soft hover:border-line-strong sm:flex"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Rolar para a direita"
            className="hidden size-7 items-center justify-center rounded-md border border-line bg-surface text-ink-soft hover:border-line-strong sm:flex"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className={`no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 ${tight ? '' : 'snap-x snap-mandatory'}`}
      >
        {children}
      </div>
    </section>
  )
}
