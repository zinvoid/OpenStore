import { useEffect, useState } from 'react'
import { findUpdate, openRelease, type Release } from '../lib/releases'
import { desktop, isDesktop } from '../lib/desktop'

const DISMISS_KEY = 'openstore.update.dismissed'
const CHANNEL_KEY = 'openstore.update.channel'

function dismissedVersion(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

export function UpdateDialog() {
  const [data, setData] = useState<{ release: Release; current: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [stage, setStage] = useState<'idle' | 'download' | 'launch' | 'error' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    findUpdate()
      .then((found) => {
        if (!alive || !found) return
        if (dismissedVersion() === found.release.version) return
        setData(found)
      })
      .catch(() => {
        /* sem conexão: nada a avisar */
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const off = desktop?.onUpdateProgress((event) => {
      if (event.phase === 'launch') {
        setStage('launch')
        setProgress(100)
        return
      }
      setStage('download')
      setProgress(event.total ? Math.min(100, Math.round((event.received / event.total) * 100)) : null)
    })
    return off
  }, [])

  if (!data || dismissed) return null
  const { release, current } = data

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, release.version)
    } catch {
      /* armazenamento indisponível */
    }
    setDismissed(true)
  }

  const autoInstall = Boolean(desktop && desktop.platform === 'win32')

  async function startUpdate() {
    if (!release.url) return
    // O instalador do canal é o .exe: fora do Windows, abre a página da versão.
    if (!desktop || !autoInstall) {
      openRelease(release)
      return
    }
    setBusy(true)
    setError(null)
    setStage('download')
    setProgress(null)
    const result = await desktop.update({ url: release.url! })
    if (!result.ok) {
      setStage('error')
      setError(result.error ?? 'Não foi possível baixar a atualização.')
      setBusy(false)
      return
    }
    setStage('done')
  }

  const percentLabel = progress === null ? 'Baixando o instalador…' : `Baixando ${progress}%`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
      className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"
    >
      <div
        className="glass-float animate-fade-up relative w-full max-w-[470px] overflow-hidden rounded-[14px]"
      >
        <div className="relative p-5">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt=""
              className="ghost-mark size-16 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
                {stage === 'done' ? 'Atualização iniciada' : 'Atualização disponível'}
              </p>
              <h2 id="update-title" className="mt-0.5 font-display text-[19px] font-semibold leading-tight">
                OpenStore {release.version}
              </h2>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar"
              className="ml-auto self-start rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
            {stage === 'done'
              ? 'O instalador foi aberto. A OpenStore vai fechar para concluir a atualização — seus apps instalados continuam no lugar.'
              : stage === 'launch'
                ? 'Abrindo o instalador…'
                : busy || stage === 'download'
                  ? percentLabel
                  : (
                    <>
                      Você está na versão <span className="font-semibold text-ink">{current}</span>. Atualize para
                      receber as melhorias mais recentes da loja, do gerenciador de apps e das correções de segurança.
                    </>
                  )}
          </p>

          {(busy || stage === 'download') && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress ?? 12}%` }}
              />
            </div>
          )}

          {release.notes && stage !== 'done' && (
            <div className="glass-inset mt-3 p-3 text-[12px] leading-relaxed text-ink-soft">
              {release.notes}
            </div>
          )}

          {error && <p className="mt-2 text-[11.5px] text-red-500">{error}</p>}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={dismiss}
              className="glass-btn glass-btn-quiet px-4 py-2 text-[12.5px] font-medium"
            >
              Depois
            </button>
            {release.url ? (
              <button
                type="button"
                onClick={() => void startUpdate()}
                disabled={busy}
                className="glass-btn glass-btn-accent px-4 py-2 text-[12.5px] font-semibold disabled:cursor-progress"
              >
                {stage === 'done'
                  ? 'Instalador aberto'
                  : busy
                    ? 'Atualizando…'
                    : autoInstall
                      ? 'Atualizar agora'
                      : 'Baixar atualização'}
              </button>
            ) : (
              <span className="rounded-md bg-accent-soft px-4 py-2 text-center text-[12px] font-medium text-accent-ink">
                Instalador em breve
              </span>
            )}
          </div>

          <p className="mt-3 text-[10.5px] text-muted">
            {!isDesktop
              ? 'Você será levado para o download do instalador.'
              : autoInstall
                ? 'O download é feito aqui e o instalador abre em seguida.'
                : 'Você será levado para a página da versão no GitHub.'}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Canal de atualização usado pelo app (reservado para canais futuros). */
export function updateChannel(): string {
  try {
    return localStorage.getItem(CHANNEL_KEY) ?? 'stable'
  } catch {
    return 'stable'
  }
}
