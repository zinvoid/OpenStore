/** Contas de usuário do OpenStore (usuário único, e-mail opcional, senha com hash no banco). */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'

export interface Account {
  id: string
  username: string
  email: string | null
  /** Token de sessão emitido pelo banco; obrigatório para publicar. */
  token?: string | null
}

const SESSION_KEY = 'openstore.session'

let cached: Account | null | undefined
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function readSession(): Account | null {
  if (cached !== undefined) return cached
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    cached = raw ? (JSON.parse(raw) as Account) : null
  } catch {
    cached = null
  }
  return cached
}

function saveSession(account: Account | null) {
  cached = account
  try {
    if (account) localStorage.setItem(SESSION_KEY, JSON.stringify(account))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* armazenamento indisponível: a sessão vale só nesta janela */
  }
  emit()
}

export function signOut() {
  saveSession(null)
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useAccount(): Account | null {
  return useSyncExternalStore(subscribe, readSession, () => null)
}

// ---------------------------------------------------------------- validação

export function passwordChecks(password: string) {
  return [
    { label: 'Pelo menos 8 caracteres', ok: password.length >= 8 },
    { label: 'Ao menos uma letra', ok: /[A-Za-z]/.test(password) },
    { label: 'Ao menos um número', ok: /\d/.test(password) },
  ]
}

export function isStrongPassword(password: string) {
  return passwordChecks(password).every((c) => c.ok)
}

export function usernameProblem(username: string): string | null {
  const value = username.trim()
  if (value.length < 3) return 'O nome de usuário precisa de pelo menos 3 caracteres.'
  if (value.length > 20) return 'Use no máximo 20 caracteres.'
  if (!/^[A-Za-z0-9_.]+$/.test(value)) return 'Use apenas letras, números, ponto e sublinhado.'
  return null
}

const MESSAGES: Record<string, string> = {
  username_taken: 'Esse nome de usuário já está em uso. Escolha outro.',
  username_invalid: 'O nome de usuário precisa ter entre 3 e 20 caracteres.',
  username_chars: 'Use apenas letras, números, ponto e sublinhado no nome de usuário.',
  email_taken: 'Já existe uma conta com esse e-mail.',
  email_invalid: 'Digite um e-mail válido ou deixe o campo vazio.',
  password_weak: 'A senha precisa de 8 caracteres, com letras e números.',
}

function translate(error: unknown): string {
  const raw = String((error as { message?: string })?.message ?? error ?? '')
  const key = Object.keys(MESSAGES).find((k) => raw.includes(k))
  if (key) return MESSAGES[key]
  if (/failed to fetch|network/i.test(raw)) return 'Sem conexão com o servidor. Verifique sua internet.'
  return 'Não foi possível concluir agora. Tente novamente.'
}

// ------------------------------------------------------------------- ações

export async function signUp(input: {
  username: string
  email?: string
  password: string
}): Promise<Account> {
  const { data, error } = await supabase.rpc('openstore_signup', {
    p_username: input.username.trim(),
    p_email: input.email?.trim() || null,
    p_password: input.password,
  })
  if (error) throw new Error(translate(error))
  const account = data as Account
  saveSession(account)
  return account
}

export async function signIn(input: { username: string; password: string }): Promise<Account> {
  const { data, error } = await supabase.rpc('openstore_login', {
    p_username: input.username.trim(),
    p_password: input.password,
  })
  if (error) throw new Error(translate(error))
  if (!data) throw new Error('Usuário ou senha incorretos.')
  const account = data as Account
  saveSession(account)
  return account
}
