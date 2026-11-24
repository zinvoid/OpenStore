/** Endereços públicos do projeto — usados na landing page e no rodapé. */
export const GITHUB_REPO = 'zinvoid/OpenStore'
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`
export const GITHUB_RELEASES = `${GITHUB_URL}/releases`
export const GITHUB_ISSUES = `${GITHUB_URL}/issues`
export const LICENSE_NAME = 'MIT'

export interface RepoStats {
  stars: number
  forks: number
  url: string
}

/** Estrelas e forks do repositório, direto da API pública do GitHub. */
export async function fetchRepoStats(): Promise<RepoStats | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { stargazers_count?: number; forks_count?: number; html_url?: string }
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      url: data.html_url ?? GITHUB_URL,
    }
  } catch {
    return null
  }
}
