import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GhostMark } from '../components/GhostLogo'
import {
  CheckIcon,
  ChevronRightIcon,
  DownloadIcon,
  GlobeIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  UploadIcon,
} from '../components/Icons'
import { fetchRepoStats, GITHUB_RELEASES, GITHUB_URL, LICENSE_NAME, type RepoStats } from '../lib/site'

const SECTIONS = [
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'recursos', label: 'Recursos' },
]

function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Landing() {
  const [repo, setRepo] = useState<RepoStats | null>(null)

  useEffect(() => {
    let alive = true
    fetchRepoStats().then((data) => {
      if (alive) setRepo(data)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="scroll-area h-full overflow-y-auto bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[58px] w-full max-w-[1120px] items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <GhostMark className="size-7" />
            <span className="font-display text-[15px] font-semibold tracking-tight">OpenStore</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => goTo(section.id)}
                className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="glass-btn glass-btn-quiet px-3 py-1.5 text-[11.5px] font-medium"
              title="Repositório no GitHub"
            >
              <GlobeIcon className="size-3.5" />
              <span className="hidden sm:inline">GitHub</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                <StarIcon className="size-2.5 text-amber-400" />
                {repo ? repo.stars : '—'}
              </span>
            </a>
            <Link to="/home" className="glass-btn glass-btn-accent px-3.5 py-1.5 text-[12px] font-semibold">
              Entrar na loja
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------- hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(70% 90% at 12% 0%, rgba(124,92,255,0.20) 0%, rgba(124,92,255,0) 60%), radial-gradient(60% 80% at 95% 10%, rgba(91,61,245,0.16) 0%, rgba(91,61,245,0) 62%)',
            }}
          />
          <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_440px]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-ink backdrop-blur">
                <SparkIcon className="size-3" />
                Loja aberta de aplicativos
              </span>
              <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[46px]">
                O que a comunidade cria, cabe num só lugar.
              </h1>
              <p className="mt-4 max-w-[520px] text-[13.5px] leading-relaxed text-ink-soft">
                A OpenStore é uma loja de apps feita por quem publica. Qualquer pessoa pode subir seu programa, e
                qualquer pessoa pode instalar — com o download certo para o sistema dela, direto no app.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to="/home" className="glass-btn glass-btn-accent px-5 py-2.5 text-[13px] font-semibold">
                  Explorar a loja
                  <ChevronRightIcon className="size-3.5" />
                </Link>
                <a
                  href={GITHUB_RELEASES}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-btn px-4 py-2.5 text-[13px] font-semibold"
                >
                  <DownloadIcon className="size-4" />
                  Baixar para Windows
                </a>
              </div>

              <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted">
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-emerald-500" /> Grátis e sem comissão
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-emerald-500" /> Código aberto ({LICENSE_NAME})
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-emerald-500" /> Windows 10 e 11
                </li>
              </ul>
            </div>

            <StoreMock />
          </div>
        </section>

        {/* ------------------------------------------------------ como funciona */}
        <Section id="como-funciona" eyebrow="Como funciona" title="Três passos, sem intermediário">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: <UploadIcon className="size-4" />,
                title: 'Publique em minutos',
                text: 'Crie a conta, envie o executável e a arte. O app entra na loja na hora, com versão e downloads.',
              },
              {
                icon: <DownloadIcon className="size-4" />,
                title: 'Instale com um clique',
                text: 'O app do desktop baixa, confere o arquivo e instala na pasta do OpenStore — com abrir, mover e desinstalar.',
              },
              {
                icon: <SparkIcon className="size-4" />,
                title: 'Atualize sozinho',
                text: 'Quando sai versão nova, o site mostra na hora e o app avisa para atualizar sem você procurar.',
              },
            ].map((step, index) => (
              <article key={step.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent-ink">
                    {step.icon}
                  </span>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Passo {index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[13.5px] font-semibold">{step.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------- segurança */}
        <Section
          id="seguranca"
          eyebrow="Segurança"
          title="O arquivo é conferido antes de rodar"
          description="Nenhum executável é aberto sem passar pela checagem. O caminho é o mesmo para todo mundo que publica."
        >
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
            <div className="mx-auto flex max-w-[680px] flex-col items-stretch gap-2">
              <FlowCard icon={<UploadIcon className="size-4" />} title="Upload de aplicativo" text="Arquivo enviado pelo desenvolvedor" />
              <FlowArrow />
              <FlowCard
                icon={<ShieldIcon className="size-4" />}
                title="Validação no envio"
                text="Formato permitido, tamanho e hash SHA-256 calculados"
              />
              <FlowArrow />
              <div className="grid gap-2 sm:grid-cols-2">
                <FlowCard
                  icon={<ShieldIcon className="size-4" />}
                  title="ClamAV (local)"
                  text="Analisa o executável na sua máquina antes de abrir o instalador"
                  tone="emerald"
                />
                <FlowCard
                  icon={<GlobeIcon className="size-4" />}
                  title="Registro no anúncio"
                  text="Status de verificação visível na página do app"
                  tone="sky"
                />
              </div>
              <FlowArrow />
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-center">
                <p className="text-[12.5px] font-semibold">Resultado da análise</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Limpo · Suspeito · Bloqueado — e o motivo sempre aparece para quem vai instalar.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ----------------------------------------------------------- recursos */}
        <Section id="recursos" eyebrow="Recursos" title="Uma loja que respeita seu PC">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Gerenciador de apps', text: 'Abrir, ver o local instalado, mudar a pasta, buscar o executável, desinstalar.' },
              { title: 'Versões lado a lado', text: 'Cada app pode ter vários downloads por sistema, arquitetura e formato.' },
              { title: 'Detecção automática', text: 'O download recomendado é escolhido pelo sistema de quem visita.' },
              { title: 'Contas opcionais', text: 'Navegar e baixar é livre. Conta só é necessária para publicar.' },
              { title: 'Edição a qualquer hora', text: 'Quem publicou edita textos, arte, versão e arquivos quando quiser.' },
              { title: 'Atualização da loja', text: 'Aviso de versão nova aparece no site e dentro do app.' },
            ].map((feature) => (
              <article key={feature.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <h3 className="text-[13px] font-semibold">{feature.title}</h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{feature.text}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------- open source */}
        <section className="mx-auto w-full max-w-[1120px] px-4 pb-14 sm:px-6">
          <div className="relative overflow-hidden rounded-[16px] border border-line bg-gradient-to-br from-[#2a2350] via-[#241f3d] to-[#161425] p-6 sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background: 'radial-gradient(70% 120% at 90% 0%, rgba(155,130,255,0.35) 0%, rgba(155,130,255,0) 60%)',
              }}
            />
            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="max-w-[520px]">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent">Código aberto</p>
                <h2 className="mt-2 font-display text-[21px] font-semibold text-white sm:text-[24px]">
                  O projeto inteiro está no GitHub
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">
                  Loja, app desktop e banco. Leia o código, abra uma issue ou mande sua melhoria — a loja é da
                  comunidade.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-white/70">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1">
                    <StarIcon className="size-3 text-amber-300" />
                    {repo ? `${repo.stars} estrelas` : 'estrelas no GitHub'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1">
                    Licença {LICENSE_NAME}
                  </span>
                </div>
              </div>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-[#15121f] transition hover:bg-white/90"
              >
                <GlobeIcon className="size-4" />
                Ver no GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-4 py-6 text-[11.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <GhostMark className="size-5" />
            <span>OpenStore — loja aberta de aplicativos</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
              GitHub
            </a>
            <a href={GITHUB_RELEASES} target="_blank" rel="noreferrer" className="hover:text-ink">
              Releases
            </a>
            <Link to="/home" className="hover:text-ink">
              Entrar na loja
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// -------------------------------------------------------------- peças visuais

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-[1120px] scroll-mt-16 px-4 py-10 sm:px-6">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-ink">{eyebrow}</p>
      <h2 className="mt-1.5 font-display text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">{title}</h2>
      {description && <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function FlowCard({
  icon,
  title,
  text,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  title: string
  text: string
  tone?: 'neutral' | 'emerald' | 'sky'
}) {
  const tones = {
    neutral: 'border-line bg-surface-2 text-ink',
    emerald: 'border-emerald-500/25 bg-emerald-500/[0.06] text-ink',
    sky: 'border-sky-500/25 bg-sky-500/[0.06] text-ink',
  }
  const iconTones = {
    neutral: 'bg-accent-soft text-accent-ink',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  }
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${iconTones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{text}</p>
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5 text-muted/60" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 5v14m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/** Mock da loja montado em CSS — sem imagem, sem depender de app publicado. */
function StoreMock() {
  const apps = [
    { name: 'Ferramentas', publisher: 'comunidade', accent: '#7c5cff', glyph: 'A' },
    { name: 'Utilitários', publisher: 'comunidade', accent: '#0ea5e9', glyph: 'B' },
    { name: 'Segurança', publisher: 'comunidade', accent: '#10b981', glyph: 'C' },
  ]
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-[0_40px_80px_-50px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 items-center gap-1.5 border-b border-line bg-surface-2 px-3">
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-amber-400/70" />
          <span className="size-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2 truncate text-[10px] text-muted">openstore</span>
        </div>
        <div className="flex">
          <div className="hidden w-[52px] shrink-0 flex-col items-center gap-3 border-r border-line bg-surface-2 py-3 sm:flex">
            <GhostMark className="size-6" />
            {['#7c5cff', '#9c9cab', '#9c9cab'].map((color, index) => (
              <span
                key={index}
                className="size-5 rounded-md"
                style={{ background: index === 0 ? 'var(--color-accent-soft)' : 'transparent', boxShadow: `inset 0 0 0 1.5px ${color}55` }}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1 p-3">
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[10.5px] text-muted">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" strokeLinecap="round" />
              </svg>
              Pesquisar apps
            </div>
            <div className="mt-3 h-[86px] overflow-hidden rounded-lg" style={{ background: 'linear-gradient(120deg,#2a2350,#1b1830 60%,#161425)' }}>
              <div className="flex h-full items-center justify-between px-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">Em destaque</p>
                  <p className="mt-1 text-[13px] font-semibold text-white">Publicado pela comunidade</p>
                  <p className="mt-0.5 text-[10px] text-white/60">instale em um clique</p>
                </div>
                <GhostMark className="size-10 opacity-90" glow />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {apps.map((app) => (
                <div key={app.name} className="rounded-lg border border-line bg-surface-2 p-1.5">
                  <div
                    className="grid aspect-square w-full place-items-center rounded-md text-[13px] font-semibold text-white"
                    style={{ background: `linear-gradient(145deg, ${app.accent}, ${app.accent}aa)` }}
                  >
                    {app.glyph}
                  </div>
                  <p className="mt-1 truncate text-[9.5px] font-semibold">{app.name}</p>
                  <p className="truncate text-[8.5px] text-muted">{app.publisher}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-2 hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-ink shadow-sm sm:flex">
        <ShieldIcon className="size-3 text-emerald-500" /> verificado no envio
      </div>
    </div>
  )
}
