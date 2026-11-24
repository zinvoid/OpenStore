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
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  if (!slides.length) return null
  const current = slides[Math.min(index, slides.length - 1)]
  const cover = assetUrl(current.cover_url)

  return (
    <section className="relative overflow-hidden rounded-[14px] border border-line bg-[#101014] shadow-[0_24px_60px_-40px_rgba(0,0,0,0.8)]">
      <div className="relative h-[280px] sm:h-[340px] lg:h-[380px]">
        {slides.map((app, i) => (
          <img
            key={app.id}
            src={assetUrl(app.cover_url)}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080b]/95 via-[#08080b]/70 to-[#08080b]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080b]/80 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-5 sm:p-7 lg:p-9">
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-wider text-white/85 backdrop-blur">
            Em destaque
          </span>
          <div className="flex items-center gap-3">
            <AppTile app={current} size={60} radius={14} glow />
            <div className="min-w-0">
              <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[32px] lg:text-[38px]">
                {current.name}
              </h1>
              <p className="mt-0.5 text-[12.5px] text-white/65">
                {current.publisher} · {formatPrice(current.price_cents, current.currency)} ·{' '}
                {formatCount(current.downloads_count)} downloads
              </p>
            </div>
          </div>
          <p className="mt-3 max-w-[540px] text-[12.5px] leading-relaxed text-white/75 line-clamp-2 sm:text-[13.5px]">
            {current.tagline}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              to={`/app/${current.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-[#111114] transition hover:bg-white/90"
            >
              <DownloadIcon className="size-4" />
              Baixar agora
            </Link>
            <Link
              to={`/app/${current.slug}`}
              className="rounded-md border border-white/25 bg-white/5 px-4 py-2 text-[13px] font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
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
              className="absolute left-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/80 backdrop-blur transition hover:bg-black/55 sm:flex"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              aria-label="Próximo destaque"
              className="absolute right-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/80 backdrop-blur transition hover:bg-black/55 sm:flex"
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <div className="absolute right-5 top-5 flex items-center gap-1.5">
              {slides.map((app, i) => (
                <button
                  key={app.id}
                  type="button"
                  aria-label={`Ir para ${app.name}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {cover && <span className="sr-only">{current.name}</span>}
    </section>
  )
}
