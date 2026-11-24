import { isDesktop } from '../lib/desktop'
import { siteDownload, useLatestRelease } from '../lib/releases'
import { useDetectedOS } from '../lib/platform'
import { DownloadIcon } from './Icons'

/** Convite para levar a loja para o desktop. Some quando já estamos dentro do app. */
export function DesktopPromo() {
  const release = useLatestRelease()
  const os = useDetectedOS()

  if (isDesktop) return null

  const download = siteDownload(release, os)

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-7">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <img
            src={`${import.meta.env.BASE_URL}icon.png`}
            alt="OpenStore"
            className="size-14 shrink-0 drop-shadow-[0_10px_22px_rgba(124,92,255,0.28)] sm:size-16"
          />
          <div className="max-w-[560px]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
              App para desktop
            </p>
            <h2 className="mt-1.5 font-display text-[19px] font-semibold leading-tight sm:text-[22px]">
              Instale a OpenStore e abra seus apps em um clique
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              No app você instala, abre a pasta local, move, procura automaticamente e desinstala qualquer app da
              loja — com o local de instalação sempre à mão. No navegador, você só navega e baixa.
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto">
          <a
            href={download.href}
            target="_blank"
            rel="noreferrer"
            className="glass-btn glass-btn-accent px-4 py-2.5 text-[13px] font-semibold"
          >
            <DownloadIcon className="size-4" /> {download.label}
          </a>
          <span className="text-center text-[10.5px] text-muted">{download.detail}</span>
        </div>
      </div>
    </section>
  )
}
