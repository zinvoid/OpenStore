import { Link, useParams } from 'react-router-dom'
import { SiteLayout, scrollToId } from '../components/site/SiteLayout'
import { Inline } from '../components/site/Inline'
import { ChevronRightIcon, GithubIcon } from '../components/Icons'
import { DOCS, DOC_GROUPS, docPager, findDoc, type DocBlock, type DocGroup } from '../lib/docs'
import { GITHUB_ISSUES, GITHUB_URL } from '../lib/site'

function DocNav({ current }: { current?: string }) {
  return (
    <nav aria-label="Guias e referência">
      {DOC_GROUPS.map((group) => (
        <div key={group}>
          <p className="doc-group-label">{group}</p>
          {DOCS.filter((doc) => doc.group === group).map((doc) => (
            <Link
              key={doc.slug}
              to={`/guia/${doc.slug}`}
              className="doc-link"
              aria-current={current === doc.slug ? 'page' : undefined}
            >
              {doc.nav}
            </Link>
          ))}
        </div>
      ))}
      <p className="doc-group-label">Projeto</p>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="doc-link">
        <GithubIcon className="size-3.5" />
        Código no GitHub
      </a>
      <a href={GITHUB_ISSUES} target="_blank" rel="noreferrer" className="doc-link">
        Abrir uma issue
      </a>
    </nav>
  )
}

function Blocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'h2':
            return (
              <h2 key={index} id={block.id}>
                {block.text}
              </h2>
            )
          case 'h3':
            return <h3 key={index}>{block.text}</h3>
          case 'p':
            return (
              <p key={index}>
                <Inline text={block.text} />
              </p>
            )
          case 'ul':
            return (
              <ul key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <div key={index}>
                {block.caption && <p className="eyebrow mt-4">{block.caption}</p>}
                <pre>
                  <code>{block.text}</code>
                </pre>
              </div>
            )
          case 'table':
            return (
              <div key={index} className="table-wrap">
                <table className="site-table">
                  <thead>
                    <tr>
                      {block.head.map((cell) => (
                        <th key={cell} scope="col">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'note':
            return (
              <div key={index} className={`note note-${block.tone}`}>
                <div className="note-title">{block.title}</div>
                <div>
                  <Inline text={block.text} />
                </div>
              </div>
            )
          default:
            return null
        }
      })}
    </>
  )
}

function GroupSection({ group, description }: { group: DocGroup; description: string }) {
  return (
    <section className="mt-12">
      <div className="rule flex items-baseline justify-between gap-4 border-b pb-2">
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{group}</h2>
        <span className="text-[12.5px] text-[color:var(--s-muted)]">{description}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {DOCS.filter((doc) => doc.group === group).map((doc) => (
          <Link key={doc.slug} to={`/guia/${doc.slug}`} className="site-card">
            <div className="flex items-start justify-between gap-3">
              <p className="site-card-title">{doc.nav}</p>
              <ChevronRightIcon className="site-card-arrow size-4 shrink-0" />
            </div>
            <p className="site-card-text">{doc.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Índice dos guias. */
export default function GuideHub() {
  return (
    <SiteLayout>
      <div className="site-container pb-16 pt-14 sm:pt-16">
        <p className="eyebrow">Documentação</p>
        <h1 className="doc-title mt-2">Guias da OpenStore</h1>
        <p className="doc-summary">
          Instalação, publicação e os detalhes de funcionamento do aplicativo: onde ele grava os arquivos, o
          que a verificação cobre e o que fazer quando algo não funciona.
        </p>

        <GroupSection group="Guia" description="Para começar a usar e a publicar" />
        <GroupSection group="Referência" description="Arquivos, verificação e diagnóstico" />

        <div className="rule mt-14 grid gap-3 border-t pt-8 sm:grid-cols-2">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-card">
            <p className="site-card-title">Código-fonte</p>
            <p className="site-card-text">
              Site, aplicativo de desktop e banco de dados, sob licença MIT. Cada versão é gerada por GitHub
              Actions a partir de uma tag.
            </p>
          </a>
          <a href={GITHUB_ISSUES} target="_blank" rel="noreferrer" className="site-card">
            <p className="site-card-title">Problemas e sugestões</p>
            <p className="site-card-text">
              Erros, pedidos de recurso e denúncias de arquivos suspeitos entram pelas issues do repositório.
            </p>
          </a>
        </div>
      </div>
    </SiteLayout>
  )
}

/** Uma página de guia. */
export function GuidePage() {
  const { slug } = useParams()
  const doc = findDoc(slug)

  if (!doc) {
    return (
      <SiteLayout>
        <div className="site-container py-24 text-center">
          <p className="eyebrow">404</p>
          <h1 className="doc-title mt-2">Guia não encontrado</h1>
          <p className="doc-summary mx-auto">O endereço não corresponde a nenhuma página da documentação.</p>
          <Link to="/guia" className="site-btn site-btn-primary mt-6">
            Ver todos os guias
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const toc = doc.blocks.filter((block): block is Extract<DocBlock, { kind: 'h2' }> => block.kind === 'h2')
  const { prev, next } = docPager(doc.slug)

  return (
    <SiteLayout>
      <div className="site-container">
        <div className="grid gap-10 pb-20 pt-10 sm:pt-12 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_192px]">
          <aside className="doc-side hidden lg:block">
            <DocNav current={doc.slug} />
          </aside>

          <article className="min-w-0">
            <details className="doc-mobile lg:hidden">
              <summary>Navegar pela documentação</summary>
              <div className="mt-3">
                <DocNav current={doc.slug} />
              </div>
            </details>

            <p className="eyebrow">
              <Link to="/guia" className="hover:underline">
                Guias
              </Link>{' '}
              / {doc.group}
            </p>
            <h1 className="doc-title mt-2">{doc.title}</h1>
            <p className="doc-summary">{doc.summary}</p>
            <div className="doc-meta">
              <span>Atualizado em {doc.updated}</span>
              <span aria-hidden="true">·</span>
              <span>{toc.length} seções</span>
            </div>

            <div className="prose">
              <Blocks blocks={doc.blocks} />
            </div>

            <nav className="pager" aria-label="Páginas da documentação">
              {prev ? (
                <Link to={`/guia/${prev.slug}`} className="pager-link">
                  <span className="pager-dir">Anterior</span>
                  <span className="pager-label">{prev.nav}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link to={`/guia/${next.slug}`} className="pager-link pager-next">
                  <span className="pager-dir">Próxima</span>
                  <span className="pager-label">{next.nav}</span>
                </Link>
              ) : (
                <Link to="/download" className="pager-link pager-next">
                  <span className="pager-dir">Próxima</span>
                  <span className="pager-label">Download</span>
                </Link>
              )}
            </nav>
          </article>

          <div className="toc hidden xl:block">
            <p className="toc-title">Nesta página</p>
            {toc.map((heading) => (
              <button key={heading.id} type="button" className="toc-link" onClick={() => scrollToId(heading.id)}>
                {heading.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
