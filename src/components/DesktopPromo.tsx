import { isDesktop } from '../lib/desktop'
import { siteDownload, useGithubRelease, useLatestRelease } from '../lib/releases'
import { useDetectedOS } from '../lib/platform'
import { DownloadIcon } from './Icons'
import { GhostBadge } from './GhostLogo'

/** Convite para levar a loja para o desktop. Some quando já estamos dentro do app. */
export function DesktopPromo() {
  const release = useLatestRelease()
  const github = useGithubRelease()
  const os = useDetectedOS()

  if (isDesktop) return null

  const download = siteDownload(release, os, github)

  return (
    <section className="glass-panel p-5 sm:p-7">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <GhostBadge size={64} className="mt-0.5" />
          <div className="max-w-[560px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">App para desktop</p>
            <h2 className="title-soft mt-2 font-display text-[19px] font-semibold leading-tight sm:text-[23px]">
              Instale a OpenStore e abra seus apps em um clique
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
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
            className="glass-btn glass-btn-accent px-5 py-2.5 text-[13px] font-semibold"
          >
            <DownloadIcon className="size-4" /> {download.label}
          </a>
          <span className="text-center text-[10.5px] text-muted">{download.detail}</span>
        </div>
      </div>
    </section>
  )
}
