import { Link } from 'react-router-dom'
import { SiteLayout } from '../components/site/SiteLayout'
import { DownloadIcon, GithubIcon } from '../components/Icons'
import { useGithubRelease, useLatestRelease, siteDownload, BUILD_VERSION } from '../lib/releases'
import { platformFromExtension, extensionOf, PLATFORMS, useDetectedOS } from '../lib/platform'
import { GITHUB_RELEASES } from '../lib/site'

const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(PLATFORMS).map((meta) => [meta.key, meta.label]),
)

export default function DownloadPage() {
  const github = useGithubRelease()
  const release = useLatestRelease()
  const os = useDetectedOS()
  const target = siteDownload(release, os, github)

  const version = github?.version ?? release?.version ?? BUILD_VERSION
  const assets = (github?.assets ?? []).filter((asset) =>
    /\.(exe|msi|msix|appx|dmg|pkg|appimage|deb|rpm|zip|apk)$/i.test(asset.name),
  )

  return (
    <SiteLayout>
      <div className="site-container pb-20 pt-14 sm:pt-16">
        <p className="eyebrow">Download</p>
        <h1 className="doc-title mt-2">Baixar a OpenStore</h1>
        <p className="doc-summary">
          Aplicativo de desktop para Windows 10/11 e Linux x64. Serve para navegar na loja, instalar programas
          com verificação de arquivo e gerenciar o que já está na máquina.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href={target.href}
            target="_blank"
            rel="noreferrer"
            className="site-btn site-btn-primary site-btn-lg"
          >
            <DownloadIcon className="size-4" />
            {target.label}
          </a>
          <Link to="/guia/instalacao" className="site-btn site-btn-lg">
            Guia de instalação
          </Link>
        </div>
        <p className="mt-3 font-mono text-[12px] text-[color:var(--s-muted)]">
          Versão {version} · {target.detail}
        </p>

        <section className="mt-12">
          <h2 className="section-title">Sistemas e arquivos</h2>
          <div className="mt-4 table-wrap">
            <table className="site-table">
              <thead>
                <tr>
                  <th scope="col">Sistema</th>
                  <th scope="col">Arquivo</th>
                  <th scope="col">Como instalar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Windows 10/11</td>
                  <td>
                    <code>OpenStore.Setup.{version}.exe</code>
                  </td>
                  <td>Instalador com escolha de pasta e atalhos no menu Iniciar</td>
                </tr>
                <tr>
                  <td>Windows portátil</td>
                  <td>
                    <code>OpenStore-{version}-portable.exe</code>
                  </td>
                  <td>Executa sem instalar; bom para pendrive</td>
                </tr>
                <tr>
                  <td>Linux</td>
                  <td>
                    <code>OpenStore-{version}-x86_64.AppImage</code>
                  </td>
                  <td>
                    <code>chmod +x</code> e execute
                  </td>
                </tr>
                <tr>
                  <td>Debian, Ubuntu</td>
                  <td>
                    <code>OpenStore-{version}-amd64.deb</code>
                  </td>
                  <td>
                    <code>sudo apt install ./OpenStore-{version}-amd64.deb</code>
                  </td>
                </tr>
                <tr>
                  <td>macOS</td>
                  <td>—</td>
                  <td>Compilação em desenvolvimento, ainda não publicada</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="section-title">Arquivos desta versão</h2>
            <a
              href={github?.page ?? GITHUB_RELEASES}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--s-accent)] hover:underline"
            >
              <GithubIcon className="size-3.5" />
              Todas as versões e notas
            </a>
          </div>

          {assets.length > 0 ? (
            <div className="mt-4 table-wrap">
              <table className="site-table">
                <thead>
                  <tr>
                    <th scope="col">Arquivo</th>
                    <th scope="col">Sistema</th>
                    <th scope="col">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const platform = platformFromExtension(extensionOf(asset.name))
                    return (
                      <tr key={asset.name}>
                        <td>
                          <code>{asset.name}</code>
                        </td>
                        <td>{platform ? PLATFORM_LABEL[platform] ?? platform : 'Outro'}</td>
                        <td className="text-right">
                          <a
                            href={asset.url}
                            className="text-[13px] text-[color:var(--s-accent)] hover:underline"
                          >
                            Baixar
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-[color:var(--s-muted)]">
              A lista é carregada direto do GitHub. Se ela não aparecer, os arquivos estão em{' '}
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noreferrer"
                className="text-[color:var(--s-accent)] hover:underline"
              >
                github.com/zinvoid/OpenStore/releases
              </a>
              .
            </p>
          )}
        </section>

        <section className="mt-12 grid gap-3 sm:grid-cols-2">
          <div className="site-card">
            <p className="site-card-title">Depois de instalar</p>
            <p className="site-card-text">
              A vitrine abre direto, sem conta. O gerenciador fica em <strong>Meus apps</strong>, onde é possível
              abrir, mover, analisar e remover cada programa.
            </p>
            <Link
              to="/guia/instalacao"
              className="mt-3 inline-block text-[13px] text-[color:var(--s-accent)] hover:underline"
            >
              Passo a passo da instalação
            </Link>
          </div>
          <div className="site-card">
            <p className="site-card-title">Confira o arquivo</p>
            <p className="site-card-text">
              O SHA-256 de cada binário fica na página da versão. Compare com o hash local antes de executar o
              instalador.
            </p>
            <Link
              to="/guia/seguranca"
              className="mt-3 inline-block text-[13px] text-[color:var(--s-accent)] hover:underline"
            >
              Como verificar o hash
            </Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  )
}
