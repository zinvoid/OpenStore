import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { App } from '../lib/types'
import { AppTile } from './AppTile'
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from './Icons'
import { assetUrl, formatCount, formatPrice } from '../lib/format'

export function Hero({ apps }: { apps: App[] }) {
  const slides = apps.filter((a) => a.cover_url).slice(0, 5)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 8000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  if (!slides.length) return null
  const current = slides[Math.min(index, slides.length - 1)]

  return (
    <section className="relative overflow-hidden rounded-[14px] border border-line bg-[#101010]">
      <div className="relative flex h-[300px] flex-col justify-end sm:h-[360px] lg:h-[420px]">
        {slides.map((app, i) => (
          <img
            key={app.id}
            src={assetUrl(app.cover_url)}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-1000 ${
              i === index ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'
            }`}
            draggable={false}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a14]/92 via-[#070a14]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a14]/92 via-[#070a14]/25 to-transparent" />

        <div className="relative flex flex-col p-5 sm:p-8 lg:p-10">
          <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
            Em destaque
          </span>
          <div className="flex items-center gap-3.5">
            <AppTile app={current} size={68} radius={19} glow />
            <div className="min-w-0">
              <h1 className="title-soft font-display text-[28px] font-semibold leading-[1.05] text-white sm:text-[34px] lg:text-[40px]">
                {current.name}
              </h1>
              <p className="mt-1.5 text-[12px] text-white/60">
                {current.publisher} · {formatPrice(current.price_cents, current.currency)} ·{' '}
                {formatCount(current.downloads_count)} downloads
              </p>
            </div>
          </div>
          <p className="mt-3.5 max-w-[520px] text-[12.5px] leading-relaxed text-white/70 line-clamp-2 sm:text-[13.5px]">
            {current.tagline}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              to={`/app/${current.slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-[#101010] transition hover:bg-white/90"
            >
              <DownloadIcon className="size-4" />
              Baixar agora
            </Link>
            <Link
              to={`/app/${current.slug}`}
              className="rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white/90 transition hover:border-white/40 hover:bg-white/15"
            >
              Ver detalhes
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              aria-label="Destaque anterior"
              className="absolute left-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-black/45 text-white/85 transition hover:bg-black/65 sm:flex"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              aria-label="Próximo destaque"
              className="absolute right-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-black/45 text-white/85 transition hover:bg-black/65 sm:flex"
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <div className="absolute right-6 top-6 flex items-center gap-1.5">
              {slides.map((app, i) => (
                <button
                  key={app.id}
                  type="button"
                  aria-label={`Ir para ${app.name}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-white' : 'w-2 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
