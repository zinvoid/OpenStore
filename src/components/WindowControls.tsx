import { desktop, isDesktop } from '../lib/desktop'

/** Botões de janela do app desktop (a janela do .exe não usa a barra do Windows). */
export function WindowControls() {
  if (!isDesktop || desktop?.platform !== 'win32') return null

  const send = (action: 'minimize' | 'maximize' | 'close') => {
    void desktop?.windowControl(action)
  }

  return (
    <div className="-mr-3 flex h-[56px] shrink-0 items-stretch sm:-mr-5">
      <button
        type="button"
        onClick={() => send('minimize')}
        aria-label="Minimizar"
        className="grid w-[46px] place-items-center text-muted transition hover:bg-surface-2 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => send('maximize')}
        aria-label="Maximizar ou restaurar"
        className="grid w-[46px] place-items-center text-muted transition hover:bg-surface-2 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => send('close')}
        aria-label="Fechar"
        className="grid w-[46px] place-items-center text-muted transition hover:bg-[#c42b1c] hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
