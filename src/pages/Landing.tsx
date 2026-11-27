import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteLayout } from '../components/site/SiteLayout'
import { GhostMark } from '../components/GhostLogo'
import { CheckIcon, ChevronRightIcon, DownloadIcon, GithubIcon, ShieldIcon } from '../components/Icons'
import { fetchRepoStats, GITHUB_URL, LICENSE_NAME, type RepoStats } from '../lib/site'
import { siteDownload, useGithubRelease, useLatestRelease } from '../lib/releases'
import { useDetectedOS } from '../lib/platform'
import { DOCS } from '../lib/docs'

const FEATURES = [
  {
    title: 'Publicação direta',
    text: 'Quem desenvolve cria a conta, envia o binário e a arte, e a página do app entra no ar na hora. Sem fila de aprovação e sem comissão sobre o que é distribuído.',
  },
  {
    title: 'O arquivo do seu sistema',
    text: 'Cada app reúne os downloads por sistema, arquitetura e formato. A loja reconhece o sistema do visitante e aponta para o binário que vai rodar ali.',
  },
  {
    title: 'Conferência antes de executar',
    text: 'Formato, tamanho e SHA-256 são validados no envio. Na instalação, o aplicativo analisa o arquivo com o ClamAV da própria máquina antes de abrir o instalador.',
  },
]

const STEPS = [
  {
    title: 'Publique',
    text: 'Envie o executável e as informações do app. O SHA-256 é calculado no navegador e gravado junto com o arquivo.',
  },
  {
    title: 'Instale',
    text: 'O gerenciador baixa o binário certo, analisa com o antivírus local e instala na pasta do OpenStore, com o progresso na tela.',
  },
  {
    title: 'Mantenha',
    text: 'Abra, mova, analise de novo ou remova cada program. Quando sai versão nova, o aviso aparece no app.',
  },
]

const MOCK_APPS = [
  { name: 'Editor de texto', version: '2.4.1 · Windows x64', glyph: 'E' },
  { name: 'Utilitário de disco', version: '1.0.8 · Windows x64', glyph: 'U' },
  { name: 'Cliente de rede', version: '3.2.0 · Linux x64', glyph: 'C' },
]

function StoreMock() {
  return (
    <div className="mock-window">
      <div className="mock-bar">
        <span className="mock-dot" />
        <span className="mock-dot" />
        <span className="mock-dot" />
        <span className="mock-bar-title">openstore</span>
      </div>
      <div className="mock-body">
        <div className="mock-search">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" strokeLinecap="round" />
          </svg>
          Pesquisar no catálogo
        </div>
        <div className="mt-2">
          {MOCK_APPS.map((app) => (
            <div key={app.name} className="mock-row">
              <span className="mock-icon">{app.glyph}</span>
              <div className="min-w-0 flex-1">
                <p className="mock-name truncate">{app.name}</p>
                <p className="mock-sub truncate">{app.version}</p>
              </div>
              <span className="mock-btn">Instalar</span>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] text-[color:var(--s-muted)]">
          vitrine da comunidade · sem apps de exemplo
        </p>
      </div>
    </div>
  )
}

export default function Landing() {
  const [repo, setRepo] = useState<RepoStats | null>(null)
  const installer = useLatestRelease()
  const github = useGithubRelease()
  const os = useDetectedOS()
  const download = siteDownload(installer, os, github)

  useEffect(() => {
    let alive = true
    fetchRepoStats().then((data) => {
      if (alive) setRepo(data)
    })
    return () => {
      alive = false
    }
  }, [])

  const guides = DOCS.filter((doc) => doc.group === 'Guia')

  return (
    <SiteLayout>
      {/* ------------------------------------------------------------ início */}
      <div className="site-container pb-16 pt-16 sm:pt-20 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="flex items-center gap-3.5">
              <GhostMark className="size-12" />
              <p className="eyebrow">Loja aberta de aplicativos</p>
            </div>
            <h1 className="hero-title mt-3">
              Programas da comunidade, instalados com o arquivo certo e verificação antes de executar.
            </h1>
            <p className="hero-lead">
              A OpenStore é uma loja de desktop em que a publicação é gratuita e aberta. Quem desenvolve publica
              direto; quem usa baixa o binário do próprio sistema e acompanha tudo em um gerenciador de apps.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={download.href}
                target="_blank"
                rel="noreferrer"
                className="site-btn site-btn-primary site-btn-lg"
              >
                <DownloadIcon className="size-4" />
                {download.label}
              </a>
              <Link to="/guia/instalacao" className="site-btn site-btn-lg">
                Guia de instalação
              </Link>
            </div>
            <p className="mt-3 font-mono text-[11.5px] text-[color:var(--s-muted)]">{download.detail}</p>

            <ul className="fact-list mt-5">
              <li>
                <CheckIcon className="size-3.5 text-[color:var(--s-accent)]" />
                Windows 10/11 e Linux
              </li>
              <li>
                <CheckIcon className="size-3.5 text-[color:var(--s-accent)]" />
                Licença {LICENSE_NAME}
              </li>
              <li>
                <CheckIcon className="size-3.5 text-[color:var(--s-accent)]" />
                Sem comissão
              </li>
            </ul>
          </div>

          <StoreMock />
        </div>
      </div>

      {/* ---------------------------------------------------------- recursos */}
      <section className="section">
        <div className="site-container">
          <p className="eyebrow">O que a loja faz</p>
          <h2 className="section-title mt-2">Três decisões que mudam a experiência</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="site-card">
                <h3 className="site-card-title">{feature.title}</h3>
                <p className="site-card-text">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ como funciona */}
      <section className="section">
        <div className="site-container">
          <p className="eyebrow">Como funciona</p>
          <h2 className="section-title mt-2">Do envio à atualização</h2>
          <p className="section-desc">
            O mesmo fluxo serve para qualquer sistema: o arquivo publicado é o arquivo entregue, e a pasta de
            cada app fica sob controle do gerenciador.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="site-card">
                <span className="step-num">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="site-card-title mt-3">{step.title}</h3>
                <p className="site-card-text">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="rule mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-[13px] text-[color:var(--s-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldIcon className="size-4" />
              SHA-256 no envio e ClamAV na instalação
            </span>
            <Link to="/guia/seguranca" className="text-[color:var(--s-accent)] hover:underline">
              Ver o que a verificação cobre
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- guias */}
      <section className="section">
        <div className="site-container">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Documentação</p>
              <h2 className="section-title mt-2">Guias e referência</h2>
            </div>
            <Link to="/guia" className="site-btn site-btn-sm">
              Todos os guias
              <ChevronRightIcon className="size-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((doc) => (
              <Link key={doc.slug} to={`/guia/${doc.slug}`} className="site-card">
                <p className="site-card-title">{doc.nav}</p>
                <p className="site-card-text">{doc.summary}</p>
              </Link>
            ))}
            <Link to="/guia/configuracoes-e-arquivos" className="site-card">
              <p className="site-card-title">Configurações e arquivos</p>
              <p className="site-card-text">
                Onde ficam a lista de apps, os programas instalados e os arquivos temporários em cada sistema.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ download */}
      <section className="section" id="download">
        <div className="site-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
            <div>
              <p className="eyebrow">Download</p>
              <h2 className="section-title mt-2">Instale em um minuto</h2>
              <p className="section-desc">
                Instalador para Windows, versão portátil e pacotes para Linux. A compilação para macOS está em
                desenvolvimento.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={download.href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-btn site-btn-primary"
                >
                  <DownloadIcon className="size-4" />
                  {download.label}
                </a>
                <Link to="/download" className="site-btn">
                  Todas as versões
                </Link>
              </div>
              <p className="mt-3 font-mono text-[11.5px] text-[color:var(--s-muted)]">{download.detail}</p>
            </div>

            <div className="table-wrap">
              <table className="site-table">
                <thead>
                  <tr>
                    <th scope="col">Sistema</th>
                    <th scope="col">Arquivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Windows 10/11</td>
                    <td>
                      <code>Setup .exe</code> ou portátil
                    </td>
                  </tr>
                  <tr>
                    <td>Linux</td>
                    <td>
                      <code>AppImage</code> ou <code>.deb</code>
                    </td>
                  </tr>
                  <tr>
                    <td>macOS</td>
                    <td>Em desenvolvimento</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- código aberto */}
      <section className="section">
        <div className="site-container">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-[34em]">
              <div className="flex items-center gap-2.5">
                <GhostMark className="size-9" />
                <p className="eyebrow">Código aberto</p>
              </div>
              <h2 className="section-title mt-2">O projeto inteiro está no GitHub</h2>
              <p className="section-desc">
                Site, aplicativo de desktop e schema do banco, sob licença {LICENSE_NAME}. Leia o código, abra
                uma issue ou envie a sua melhoria. As releases são geradas por GitHub Actions a cada tag.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="site-chip">licença {LICENSE_NAME}</span>
                {repo && repo.stars > 0 && <span className="site-chip">{repo.stars} estrelas</span>}
                {repo && repo.forks > 0 && <span className="site-chip">{repo.forks} forks</span>}
              </div>
            </div>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-btn">
              <GithubIcon className="size-4" />
              Ver no GitHub
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
