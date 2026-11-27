import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GhostBadge } from '../components/GhostLogo'
import { CheckIcon } from '../components/Icons'
import {
  isStrongPassword,
  passwordChecks,
  signIn,
  signUp,
  usernameProblem,
} from '../lib/auth'

type Mode = 'login' | 'signup'

export default function SignIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checks = passwordChecks(password)
  const signup = mode === 'signup'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (signup) {
      const problem = usernameProblem(username)
      if (problem) return setError(problem)
      if (!isStrongPassword(password)) return setError('A senha precisa de 8 caracteres, com letras e números.')
    } else if (!username.trim() || !password) {
      return setError('Preencha usuário e senha.')
    }

    setBusy(true)
    try {
      if (signup) await signUp({ username, email, password })
      else await signIn({ username, password })
      navigate(next, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col px-4 py-10 sm:py-16">
      <div className="flex flex-col items-center text-center">
        <GhostBadge size={96} />
        <h1 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.02em]">
          {signup ? 'Criar conta no OpenStore' : 'Entrar no OpenStore'}
        </h1>
        <p className="mt-1 max-w-[330px] text-[12.5px] leading-relaxed text-muted">
          {signup
            ? 'Escolha um nome de usuário único. O e-mail é opcional e a senha só pode ser usada por você.'
            : 'Use seu nome de usuário e senha. Sua biblioteca e seus apps continuam aqui.'}
        </p>
      </div>

      <div className="glass-inset mt-5 grid grid-cols-2 gap-1 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`rounded-[10px] py-1.5 text-[12px] font-medium transition ${
            !signup ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup')
            setError(null)
          }}
          className={`rounded-[10px] py-1.5 text-[12px] font-medium transition ${
            signup ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={submit} className="glass-card mt-4 p-5">
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-medium text-ink-soft">Nome de usuário</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className="field pl-6"
              placeholder="seu_nome"
              autoComplete="username"
              maxLength={20}
              autoFocus
            />
          </div>
        </label>

        {signup && (
          <label className="mt-3 block">
            <span className="mb-1 flex items-center justify-between text-[11.5px] font-medium text-ink-soft">
              E-mail <span className="text-[10px] font-normal text-muted">opcional</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="voce@exemplo.com"
              autoComplete="email"
            />
          </label>
        )}

        <label className="mt-3 block">
          <span className="mb-1 block text-[11.5px] font-medium text-ink-soft">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder={signup ? 'mínimo 8 caracteres' : 'sua senha'}
            autoComplete={signup ? 'new-password' : 'current-password'}
          />
        </label>

        {signup && (
          <ul className="mt-2 grid gap-1">
            {checks.map((c) => (
              <li
                key={c.label}
                className={`flex items-center gap-1.5 text-[10.5px] transition ${
                  c.ok ? 'text-emerald-500' : 'text-muted'
                }`}
              >
                <span
                  className={`grid size-3.5 place-items-center rounded-full border ${
                    c.ok ? 'border-emerald-500 bg-emerald-500/15' : 'border-line-strong'
                  }`}
                >
                  {c.ok && <CheckIcon className="size-2.5" />}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-2 text-[11.5px] text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="glass-btn glass-btn-accent mt-3.5 w-full py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed"
        >
          {busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}
        </button>

        <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-muted">
          {signup
            ? 'Sem confirmação de e-mail. O nome de usuário fica visível nos apps que você publicar.'
            : 'Conta é opcional para navegar e baixar. Só é necessária para publicar.'}
        </p>
      </form>

      <p className="mt-4 text-center text-[11.5px] text-muted">
        {signup ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(signup ? 'login' : 'signup')
            setError(null)
          }}
          className="font-medium text-accent-ink hover:underline"
        >
          {signup ? 'Entrar' : 'Criar uma agora'}
        </button>
      </p>
      <Link to="/home" className="mt-2 text-center text-[11px] text-muted hover:text-ink">
        Continuar sem conta
      </Link>
    </div>
  )
}
