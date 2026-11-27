import { Link } from 'react-router-dom'

/**
 * Texto do guia com marcação mínima: `código`, **negrito** e [links](/destino).
 * Mantém o conteúdo dos guias em texto simples, sem JSX espalhado.
 */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={index}>{part.slice(1, -1)}</code>
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (link) {
          const [, label, href] = link
          return href.startsWith('/') ? (
            <Link key={index} to={href}>
              {label}
            </Link>
          ) : (
            <a key={index} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
