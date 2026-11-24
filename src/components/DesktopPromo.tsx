import { useEffect, useState } from 'react'
import { isDesktop } from '../lib/desktop'
import { latestRelease, openRelease, type Release } from '../lib/releases'
import { DownloadIcon } from './Icons'

/** Convite para levar a loja para o desktop. Some quando já estamos dentro do app. */
export function DesktopPromo() {
  const [release, setRelease] = useState<Release | null>(null)

  useEffect(() => {
    if (isDesktop) return
    let alive = true
    latestRelease()
      .then((value) => {
        if (alive) setRelease(value)
      })
      .catch(() => {
        /* sem releases publicadas ainda */
      })
    return () => {
      alive = false
    }
  }, [])

  if (isDesktop) return null

  return (
    <section className="relative overflow-hidden rounded-[14px] border border-line bg-gradient-to-br from-[#2b2255] via-[#241f42] to-[#171326] p-5 sm:p-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: 'radial-gradient(70% 120% at 12% 0%, rgba(124,92,255,0.45) 0%, rgba(124,92,255,0) 60%)',
        }}
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <img
            src={`${import.meta.env.BASE_URL}icon.png`}
            alt="OpenStore"
            className="size-14 shrink-0 drop-shadow-[0_12px_28px_rgba(124,92,255,0.5)] sm:size-16"
          />
          <div className="max-w-[560px]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-accent">App para Windows</p>
            <h2 className="mt-1.5 font-display text-[19px] font-semibold leading-tight text-white sm:text-[22px]">
              Instale a OpenStore e abra seus apps em um clique
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
              No app você instala, abre, move, procura automaticamente e desinstala qualquer app da loja — com o local
              de instalação sempre à mão. No navegador, você só navega e baixa.
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto">
          {release?.url ? (
            <button
              type="button"
              onClick={() => openRelease(release)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-[13px] font-semibold text-[#15121f] transition hover:bg-white/90"
            >
              <DownloadIcon className="size-4" /> Baixar para Windows
            </button>
          ) : (
            <span className="inline-flex items-center justify-center rounded-md bg-white/10 px-4 py-2.5 text-center text-[12px] font-medium text-white/70">
              Instalador ainda não publicado
            </span>
          )}
          <span className="text-center text-[10.5px] text-white/45">
            {release ? `Versão ${release.version} · Windows 10/11 · x64` : 'Windows 10/11 · x64'}
          </span>
        </div>
      </div>
    </section>
  )
}
