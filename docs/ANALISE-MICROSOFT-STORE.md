# Análise da Microsoft Store — e o que o OpenStore replica

> Documento de referência do projeto OpenStore. Resume a arquitetura, a estrutura de
> informação, o layout, o fluxo de instalação e a responsividade do app Microsoft Store
> do Windows 11, e mapeia cada elemento para a implementação equivalente nesta loja.

## 1. O que é a Microsoft Store, por dentro

A Microsoft Store não é um site: é um **app empacotado (MSIX)** que hospeda uma webview
moderna para a vitrine e delega as partes privilegiadas ao sistema.

Camadas:

1. **Casca nativa (WinUI / XAML Islands)** — janela, título, navegação lateral, barra de
   busca, notificações de progresso de download/instalação, integração com o Windows
   Update e com a Central de Ações.
2. **Vitrine (web)** — o conteúdo das páginas vem de serviços REST da Microsoft
   (`storeedgefd`, catálogo, avaliações). É uma SPA que renderiza cards, rails e a página
   de produto; por isso o comportamento visual é idêntico ao de um site moderno.
3. **Serviços de plataforma**:
   - **Catálogo/ingestão**: pacotes `.msix`/`.msixbundle`, manifesto do app, ícones,
     capturas, classificação, preço, mercados e idiomas.
   - **Identidade e licenças**: conta Microsoft, licença por dispositivo/usuário,
     assinatura de pacote e verificação de integridade.
   - **Entrega**: CDN da Microsoft, downloads retomáveis, patches diferenciais.
   - **Instalação**: AppX Deployment Service (`AppXSvc`) faz o deploy do MSIX com
     sandbox, identidade e atualizações automáticas.
   - **Confiança**: revisão de pacote, assinatura de código, políticas de idade e
     relatórios de uso/erro.

Consequência de design: a loja precisa mostrar **um único botão de ação** ("Obter" /
"Instalar" / "Baixar") que resolve tudo sozinho — o usuário nunca escolhe instalador,
arquitetura ou origem. Esse é o contrato central que o OpenStore reproduz de forma
transparente: detecta o SO e entrega o arquivo certo, mas deixa as outras opções visíveis.

## 2. Estrutura de informação

| Área | Conteúdo | Papel |
| --- | --- | --- |
| Início | Hero rotativo, "Em destaque", rails por categoria, ofertas | descoberta |
| Apps / Jogos / Filmes e TV | catálogo filtrado por tipo | navegação |
| Busca global | query única sobre nome, editor, categoria | resgate |
| Página de produto | mídia, descrição, avaliações, requisitos, downloads | decisão |
| Biblioteca | apps comprados/instalados, atualizações | pós-instalação |
| Conta | pedidos, métodos de pagamento, dispositivos | gestão |

Hierarquia visual do Windows 11: **navegação lateral persistente** (ícones + rótulo),
**top bar com busca centralizada** e **conteúdo em cartões arredondados sobre fundo
Mica**. A densidade é alta: 12–13 px de texto, cards de ~150–300 px, muito espaço em
branco horizontal e rails que rolam lateralmente com snap.

## 3. Layout (detalhado)

### Navegação
- Sidebar fixa de ~68 px (colapsada) ou ~220 px (expandida), com item ativo em pílula
  de acento; ícones de linha de 16–20 px.
- Em telas estreitas a sidebar desaparece e surge uma **barra inferior** com 4–5 itens.
- Top bar de 48–56 px, com título da seção, busca em formato de pílula com atalho `/`
  e botões de conta/biblioteca à direita.

### Início
- Hero de ~300–380 px de altura, imagem sangrando nas bordas, gradiente escuro para
  legibilidade, CTA primário no canto inferior esquerdo.
- Rails horizontais: cada um com título, "Ver tudo" e cards de 150–200 px, rolagem
  horizontal com `scroll-snap` e setas no desktop.
- Cards: imagem 16:9, nome em uma linha, editor e nota em texto secundário; hover
  levanta o card 2 px e intensifica a borda.

### Página de produto
- Cabeçalho com capa desfocada ao fundo e ícone grande (104 px) sobreposto.
- Título, editor, nota com estrelas, contagem de avaliações e classificação de idade.
- **Painel de ação** à direita: botão único e proeminente, metadados (formato, tamanho,
  preço) e link "ver todas as plataformas".
- Abas fixas: visão geral, requisitos, avaliações, relacionados.
- Galeria com lightbox, descrição em parágrafos, "novidades desta versão", tags.
- Coluna lateral com ficha técnica (editor, versão, tamanho, plataformas, idiomas,
  data) e resumo de avaliações com distribuição por estrelas.

### Biblioteca
- Lista de itens com ícone, nome, versão, tamanho, botão "Abrir" e menu de contexto;
  estado vazio com ilustração e CTA para a loja.

## 4. Responsividade

- **≥ 1024 px**: sidebar + conteúdo em duas colunas (principal + 296–338 px de aside).
- **768–1023 px**: sidebar colapsada em ícones; aside desce para baixo do conteúdo.
- **< 768 px**: navegação inferior, top bar compacta, hero de 180–230 px, galeria com
  cards de 300 px, painel de download de largura total acima das abas, tabelas com
  rolagem horizontal e grids de 2 colunas.
- Tipografia e espaçamento aumentam em degraus (`sm:`/`lg:`), nunca de forma fluida
  caótica; alvos de toque ≥ 32 px.

## 5. Fluxo de instalação (o que o usuário sente)

1. Abre a página → a loja sabe o dispositivo (Windows, arquitetura) e mostra **Obter**.
2. Clique → aquisição de licença (se paga) → download em segundo plano com progresso na
   própria página e na Central de Ações.
3. Instalação delegada ao `AppXSvc`, com atualização automática depois.
4. O app aparece em **Biblioteca** e no menu Iniciar.

O ponto de fricção real é que **nada disso é escolha do usuário**: sem seleção de
arquitetura, sem espelho de download, sem instalação fora da loja.

## 6. O que o OpenStore replica — e onde ele difere de propósito

| Elemento da Microsoft Store | No OpenStore |
| --- | --- |
| Sidebar + top bar com busca `/` | `Sidebar`, `MobileNav`, `TopBar` |
| Hero rotativo + rails horizontais | `Hero`, `Rail`, `AppCard` |
| Página de produto com abas e aside | `pages/AppDetail.tsx` |
| Detecção de SO e botão único | `detectOS()` + `bestDownload()` |
| "Ver todas as plataformas" | seletor de SO simulado + lista completa |
| Biblioteca local | `pages/Library.tsx` (localStorage) |
| Publicação só para editores aprovados | **cadastro público** em `pages/Publish.tsx` |
| Instalação via MSIX + `AppXSvc` | download direto do arquivo (`.exe`, `.msi`, `.deb`, `.AppImage`, `.apk`…) |
| Assinatura e revisão de pacote | **sem verificação** nesta primeira versão |
| Tema claro/escuro automático | `prefers-color-scheme` nos tokens CSS |

### Detecção de plataforma
`src/lib/platform.ts` mapeia extensão → plataforma (`exe/msi/msix` → Windows,
`dmg/pkg` → macOS, `deb/rpm/appimage/tar.gz` → Linux, `apk/aab` → Android, `ipa` → iOS)
e `detectOS()` lê `userAgentData.platform`, `navigator.platform` e o user agent. O painel
de download escolhe a arquitetura provável (ARM64 quando o UA indica ARM) e cai para
`universal`, mantendo todos os downloads acessíveis em um clique extra — exatamente o
equilíbrio entre simplicidade da Store e liberdade de uma loja aberta.

### Publicação aberta
O formulário cobre tudo o que a Store exige de um editor: nome, publicador, tagline,
descrição, categoria, versão, preço, site, suporte, classificação etária, idiomas, tags,
cor de destaque, logo, capa, até 8 capturas e **múltiplos downloads** com plataforma,
arquitetura, formato, rótulo, sistema mínimo, tamanho e URL ou upload do binário. Ao
publicar, o app entra no catálogo imediatamente (Supabase + Storage) e já pode ser
baixado por qualquer visitante.

## 7. Tokens visuais usados

- Fundo `#f3f3f7` / escuro `#141418`; superfícies brancas / `#1e1e24`.
- Acento roxo `#7c5cff` (fantasminha), com variação clara/escura.
- Raio de card 10 px, ícones de app 18–22 px, sombras muito suaves.
- Tipografia Segoe UI Variable (fallback `system-ui`); display 24–30 px, corpo 12–13 px.
- Movimento discreto: fade-up de 350 ms, hover de 180 ms, sem parallax.

## 8. Limitações conhecidas desta primeira versão

- Sem autenticação de autor e sem moderação: qualquer pessoa publica, como pedido.
- Sem assinatura/verificação de binários; a loja não atesta segurança do arquivo.
- Sem atualizações automáticas nem instalador gerenciado: o download é direto.
- Contagem de downloads é um contador no banco (`increment_downloads`), não telemetria.
- A Biblioteca é local ao dispositivo (localStorage), não sincronizada com conta.
