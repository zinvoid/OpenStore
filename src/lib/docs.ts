export type DocBlock =
  | { kind: 'h2'; id: string; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; text: string; caption?: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'note'; tone: 'info' | 'warn'; title: string; text: string }

export type DocGroup = 'Guia' | 'Referência'

export interface DocPage {
  slug: string
  title: string
  nav: string
  summary: string
  group: DocGroup
  updated: string
  blocks: DocBlock[]
}

const UPDATED = '27 de novembro de 2026'

export const DOCS: DocPage[] = [
  {
    slug: 'o-que-e-a-openstore',
    title: 'O que é a OpenStore',
    nav: 'O que é a OpenStore',
    group: 'Guia',
    updated: UPDATED,
    summary:
      'Uma loja de aplicativos em que o catálogo é da comunidade, a publicação é gratuita e o arquivo entregue é o do sistema de quem baixa.',
    blocks: [
      { kind: 'h2', id: 'por-que-existe', text: 'Por que existe' },
      {
        kind: 'p',
        text: 'Lojas de aplicativos costumam ser fechadas: alguém decide o que entra, alguém cobra a comissão e alguém escolhe qual versão você recebe. A OpenStore inverte isso. Quem desenvolve publica direto, quem usa baixa direto, e o binário entregue é sempre o do sistema de quem está baixando.',
      },
      {
        kind: 'p',
        text: 'O projeto tem duas partes que compartilham a mesma interface: o site, onde a loja e os guias vivem, e o aplicativo de desktop, que instala, abre, move, atualiza e remove os programas baixados.',
      },
      { kind: 'h2', id: 'o-que-faz', text: 'O que a OpenStore faz' },
      {
        kind: 'ul',
        items: [
          '**Publica sem intermediário.** A pessoa cria a conta, envia o executável e a arte, e a página do app é gerada na hora. Não existe fila de aprovação manual.',
          '**Entrega o arquivo certo.** Cada app pode ter vários downloads, separados por sistema, arquitetura e formato. A loja lê o sistema do visitante e aponta para o binário correspondente.',
          '**Confere o que baixa.** Formato, tamanho e SHA-256 são validados no envio. O app de desktop analisa o binário com o ClamAV da máquina antes de executar qualquer instalador.',
          '**Organiza o que foi instalado.** O gerenciador guarda a pasta de cada programa, encontra o executável, permite mover a instalação e desinstalar.',
          '**Avisa sobre versões novas.** Quando sai uma versão, o site mostra a nota e o app oferece a atualização sem que ninguém procure o instalador.',
          '**Funciona sem conta para navegar.** A conta só é necessária para publicar ou editar um app.',
        ],
      },
      { kind: 'h2', id: 'como-se-encaixa', text: 'Como as partes se encaixam' },
      {
        kind: 'table',
        head: ['Parte', 'Tecnologia', 'O que faz'],
        rows: [
          ['Site', 'React 19, Vite 7, Tailwind 4', 'Landing, guias, catálogo, página do app, envio de arquivos e contas'],
          ['App de desktop', 'Electron 38', 'Instala, abre, move, atualiza e desinstala os apps do catálogo'],
          ['Banco e arquivos', 'Postgres e Storage', 'Apps, downloads, avaliações e os binários enviados'],
        ],
      },
      {
        kind: 'p',
        text: 'O site é uma aplicação de página única. O app de desktop carrega a mesma interface e adiciona uma camada que conversa com o sistema operacional: detecta o executável instalado, registra a pasta de cada app, revela o arquivo no explorador e executa o desinstalador do fabricante quando ele existe.',
      },
      {
        kind: 'p',
        text: 'O cliente não escreve direto nas tabelas. Cadastro e login emitem um token de sessão, e toda publicação ou edição passa por uma função no servidor que confere a sessão e o dono do app antes de gravar.',
      },
      { kind: 'h2', id: 'limites', text: 'O que ainda não existe' },
      {
        kind: 'ul',
        items: [
          '**macOS.** A compilação para macOS está no roadmap e ainda não é publicada.',
          '**Pagamentos.** A loja não processa cobranças. Publicar é gratuito e não há comissão sobre o que é distribuído.',
          '**Análise na nuvem.** O antivírus roda na máquina de quem instala, com o ClamAV instalado. Se ele não estiver presente, o app avisa que a verificação não foi feita em vez de fingir que passou.',
          '**Atualização silenciosa.** O app avisa quando existe versão nova e baixa o instalador, mas não se atualiza sem confirmação. No Linux, a atualização segue o pacote usado (AppImage ou .deb).',
        ],
      },
      { kind: 'h2', id: 'licenca', text: 'Licença e comunidade' },
      {
        kind: 'p',
        text: 'A OpenStore é distribuída sob a licença MIT. O código do site, o do app de desktop e o schema do banco ficam no [repositório do GitHub](https://github.com/zinvoid/OpenStore). Erros e sugestões entram como issue, e cada versão é gerada por GitHub Actions a partir de uma tag.',
      },
      {
        kind: 'note',
        tone: 'info',
        title: 'Projeto independente',
        text: 'A OpenStore não tem relação com a Microsoft, a Apple ou o Google. Os programas distribuídos são enviados pelos próprios autores, que respondem pelo conteúdo dos arquivos que publicam.',
      },
    ],
  },
  {
    slug: 'instalacao',
    title: 'Instalação',
    nav: 'Instalação',
    group: 'Guia',
    updated: UPDATED,
    summary:
      'Como instalar a OpenStore no Windows e no Linux, rodar a versão portátil, atualizar e desinstalar sem perder os apps que já estão na máquina.',
    blocks: [
      { kind: 'h2', id: 'requisitos', text: 'Requisitos' },
      {
        kind: 'table',
        head: ['Sistema', 'Versão', 'Arquitetura'],
        rows: [
          ['Windows', '10 ou 11', 'x64'],
          ['Linux', 'Distribuições com glibc, incluindo Debian, Ubuntu, Fedora e Arch', 'x64'],
          ['macOS', 'Compilação em desenvolvimento, ainda não publicada', '—'],
        ],
      },
      {
        kind: 'p',
        text: 'Reserve cerca de 250 MB para o aplicativo e mais espaço para os programas que você instalar pela loja. Não é preciso ter conta para navegar, baixar ou instalar.',
      },
      { kind: 'h2', id: 'windows', text: 'Windows 10 e 11' },
      {
        kind: 'ol',
        items: [
          'Abra a [página de download](/download) e baixe o instalador, `OpenStore.Setup.<versão>.exe`.',
          'Execute o arquivo. Se o Windows SmartScreen exibir um aviso, clique em **Mais informações** e depois em **Executar assim mesmo**.',
          'Escolha a pasta de instalação e confirme. O instalador cria atalhos na área de trabalho e no menu Iniciar.',
          'Abra a OpenStore pelo atalho. A loja carrega direto na vitrine, sem pedir login.',
        ],
      },
      {
        kind: 'note',
        tone: 'warn',
        title: 'Por que o SmartScreen avisa',
        text: 'Assinaturas de código exigem um certificado comercial pago e renovado todo ano. Enquanto o projeto não tiver um, o Windows trata o instalador como desconhecido. O código-fonte é público, e cada binário é gerado por GitHub Actions a partir de uma tag do repositório.',
      },
      { kind: 'h2', id: 'portatil', text: 'Versão portátil (Windows)' },
      {
        kind: 'p',
        text: 'O arquivo `OpenStore-<versão>-portable.exe` roda sem instalar nada. É útil em pendrive e em máquinas sem permissão de administrador.',
      },
      {
        kind: 'ul',
        items: [
          'Não cria atalhos, entradas de desinstalação nem itens no menu Iniciar.',
          'Guarda a lista de apps no mesmo lugar do instalador (`%APPDATA%\\OpenStore`), então as duas versões enxergam os mesmos apps instalados.',
          'Para remover, basta apagar o executável. A pasta em `%APPDATA%\\OpenStore` pode ser apagada também.',
        ],
      },
      { kind: 'h2', id: 'linux', text: 'Linux' },
      { kind: 'h3', text: 'AppImage' },
      {
        kind: 'code',
        caption: 'Terminal',
        text: 'chmod +x OpenStore-<versão>-x86_64.AppImage\n./OpenStore-<versão>-x86_64.AppImage',
      },
      {
        kind: 'p',
        text: 'O AppImage não instala nada no sistema. Para integrar ao menu de aplicativos, use o AppImageLauncher ou crie um arquivo `.desktop` apontando para o arquivo executável.',
      },
      { kind: 'h3', text: 'Debian e Ubuntu (.deb)' },
      {
        kind: 'code',
        caption: 'Terminal',
        text: 'sudo apt install ./OpenStore-<versão>-amd64.deb',
      },
      {
        kind: 'p',
        text: 'Em Fedora e derivados, use o AppImage. O pacote `.rpm` ainda não é publicado.',
      },
      { kind: 'h2', id: 'primeira-execucao', text: 'Primeira execução' },
      {
        kind: 'ol',
        items: [
          'A janela abre na vitrine com os apps publicados pela comunidade.',
          'Clique em um app para ver a descrição, os arquivos disponíveis e o botão de instalação.',
          'O download, a conferência do arquivo e a instalação acontecem dentro do app, com o progresso no cartão do próprio app.',
        ],
      },
      {
        kind: 'p',
        text: 'O aviso de versão nova aparece no topo da janela quando existe uma release mais recente. Para publicar um app é que a conta passa a ser necessária.',
      },
      { kind: 'h2', id: 'atualizacoes', text: 'Atualizações' },
      {
        kind: 'p',
        text: 'No Windows, o aviso permite baixar o instalador novo e executá-lo dentro do próprio app, que fecha em seguida para dar lugar à versão atualizada. No Linux, baixe o AppImage novo ou atualize pelo gerenciador de pacotes quando o `.deb` for atualizado.',
      },
      { kind: 'h2', id: 'desinstalar', text: 'Desinstalar' },
      {
        kind: 'ul',
        items: [
          '**Windows, instalador:** Configurações → Aplicativos → OpenStore → Desinstalar. Os apps instalados pela loja continuam em disco; remova um a um em **Meus apps**.',
          '**Windows, portátil:** apague o `OpenStore-<versão>-portable.exe`. A pasta `%APPDATA%\\OpenStore` guarda o estado e pode ser apagada junto.',
          '**Linux (.deb):** `sudo apt remove openstore`. **AppImage:** apague o arquivo.',
        ],
      },
      {
        kind: 'note',
        tone: 'warn',
        title: 'Antes de apagar o estado',
        text: 'O arquivo `installed.json` guarda a pasta e o executável de cada app instalado. Sem ele, o gerenciador perde a referência dos apps, mesmo que os programas continuem funcionando. Veja [Configurações e arquivos](/guia/configuracoes-e-arquivos) para saber onde ele fica.',
      },
    ],
  },
  {
    slug: 'publicar',
    title: 'Publicar um aplicativo',
    nav: 'Publicar um aplicativo',
    group: 'Guia',
    updated: UPDATED,
    summary:
      'Formatos aceitos, limites de arquivo e o passo a passo para colocar um programa na loja e publicar versões novas.',
    blocks: [
      { kind: 'h2', id: 'antes-de-publicar', text: 'Antes de publicar' },
      {
        kind: 'ul',
        items: [
          'Uma conta na OpenStore, criada em **Entrar**.',
          'O binário do app, com no máximo **50 MB** por arquivo.',
          'Um ícone quadrado em PNG e, se quiser, uma imagem de capa para a página.',
          'Nome, resumo curto, descrição, categoria e número da versão.',
        ],
      },
      { kind: 'h2', id: 'formatos', text: 'Formatos aceitos' },
      {
        kind: 'p',
        text: 'O envio aceita pacotes e executáveis dos principais sistemas: `exe`, `msi`, `msix`, `appx`, `zip`, `7z`, `rar`, `tar`, `gz`, `tgz`, `deb`, `rpm`, `appimage`, `flatpak`, `dmg`, `pkg`, `apk`, `aab`, `ipa`, `jar`, `whl` e `bin`.',
      },
      {
        kind: 'p',
        text: 'Cada arquivo é gravado com sistema, arquitetura e formato. Um app pode ter vários arquivos, e na página dele eles aparecem em lista: o visitante recebe o download compatível com o sistema dele, e pode escolher outro manualmente.',
      },
      { kind: 'h2', id: 'passo-a-passo', text: 'Passo a passo' },
      {
        kind: 'ol',
        items: [
          'Abra **Publicar** no menu lateral da loja e entre na conta.',
          'Preencha nome, resumo, descrição, categoria, idiomas e site de suporte. O endereço da página (`/app/<slug>`) é gerado a partir do nome e pode ser ajustado antes do primeiro envio.',
          'Adicione os arquivos: escolha sistema, arquitetura e formato de cada um, e envie. O navegador calcula o SHA-256 antes de subir.',
          'Revise a lista. Arquivos fora dos formatos aceitos, vazios ou acima do limite são recusados na hora da seleção.',
          'Publique. A página fica disponível imediatamente, com o botão de download apontando para o arquivo correspondente.',
        ],
      },
      {
        kind: 'note',
        tone: 'info',
        title: 'Limite de 50 MB',
        text: 'O limite vem do plano de armazenamento em uso. Instaladores maiores precisam ser distribuídos fora da loja, com o endereço informado na descrição do app.',
      },
      { kind: 'h2', id: 'editar', text: 'Editar um app publicado' },
      {
        kind: 'p',
        text: 'Quem publicou pode alterar textos, arte, categoria, versão e arquivos a qualquer momento em **Publicar → Meus apps**. A edição passa pela mesma função de gravação do envio: o servidor confere o token de sessão e o dono do app antes de alterar qualquer campo.',
      },
      { kind: 'h2', id: 'nova-versao', text: 'Publicar uma versão nova' },
      {
        kind: 'p',
        text: 'Envie o binário novo, atualize o campo de versão e salve. A página passa a mostrar o arquivo novo, e o app de desktop avisa quem já tem o programa instalado de que existe uma atualização.',
      },
      {
        kind: 'p',
        text: 'Mantenha o número no formato que o projeto já usa (`1.5.0`, `v1.5.0` ou `1.5.0-beta`). A OpenStore compara versões por número, não por data de envio: `1.10.0` é mais novo que `1.9.0`.',
      },
      { kind: 'h2', id: 'regras', text: 'O que não publicar' },
      {
        kind: 'ul',
        items: [
          'Programas que não são seus, sem autorização do autor.',
          'Binários com malware, adware instalado em silêncio ou alterações no sistema que o usuário não autorizou.',
          'Programas que pedem credenciais de outros serviços fora do próprio fluxo de login.',
          'Conteúdo ilegal ou que viole direitos autorais.',
        ],
      },
      {
        kind: 'p',
        text: 'Denúncias podem ser abertas nas [issues do repositório](https://github.com/zinvoid/OpenStore/issues) com o link do app e o motivo. Arquivos marcados como bloqueados pela análise deixam de aparecer na lista de downloads.',
      },
    ],
  },
  {
    slug: 'configuracoes-e-arquivos',
    title: 'Configurações e arquivos',
    nav: 'Configurações e arquivos',
    group: 'Referência',
    updated: UPDATED,
    summary:
      'Onde a OpenStore guarda a lista de apps, os programas instalados, os arquivos temporários e as preferências de tema.',
    blocks: [
      { kind: 'h2', id: 'onde-ficam', text: 'Onde ficam os arquivos' },
      {
        kind: 'p',
        text: 'A OpenStore segue a convenção de cada sistema. Nos caminhos abaixo, `<slug>` é o identificador do app na loja, como `meu-programa`.',
      },
      {
        kind: 'table',
        head: ['O que', 'Windows', 'Linux', 'Observações'],
        rows: [
          [
            'Lista de apps instalados',
            '`%APPDATA%\\OpenStore\\installed.json`',
            '`~/.config/OpenStore/installed.json`',
            'JSON com pasta, executável, versão e resultado da última análise. Pode ser lido e copiado; o app reescreve o arquivo ao instalar, mover ou remover.',
          ],
          [
            'Programas instalados',
            '`%LOCALAPPDATA%\\OpenStore\\Apps\\<slug>`',
            '`~/.config/OpenStore/Apps/<slug>`',
            'Pasta padrão de instalação. Pode ser trocada por app, em **Meus apps**.',
          ],
          [
            'Downloads e análise',
            '`%TEMP%\\openstore`',
            '`/tmp/openstore`',
            'Arquivos temporários baixados para instalar. São apagados ao final da instalação ou do cancelamento.',
          ],
          [
            'Preferência de tema',
            '`localStorage` da janela',
            '`localStorage` da janela',
            'Chave `openstore.theme`, com os valores `light`, `dark` ou `system`.',
          ],
        ],
      },
      {
        kind: 'note',
        tone: 'info',
        title: 'Pastas por app',
        text: 'Cada app instalado pela loja vive em uma subpasta própria dentro de `Apps`. Quando o próprio instalador do fabricante é executado, a OpenStore passa a usar a pasta que ele registrou no sistema.',
      },
      { kind: 'h2', id: 'preferencias', text: 'Preferências do aplicativo' },
      {
        kind: 'p',
        text: 'Não existe uma tela de configurações centralizada. As escolhas ficam onde são usadas:',
      },
      {
        kind: 'ul',
        items: [
          '**Tema.** Claro, escuro ou o do sistema, no botão no topo da janela. A escolha fica salva na janela e vale para a próxima abertura.',
          '**Pasta de instalação.** Definida por app, em **Meus apps → Mover**. Os apps seguintes continuam usando a pasta padrão.',
          '**Atualizações.** O aviso aparece quando existe versão mais nova. Não há atualização em segundo plano.',
          '**Análise antivírus.** Roda na instalação e pode ser repetida pelo gerenciador. O resultado fica gravado no `installed.json`.',
        ],
      },
      { kind: 'h2', id: 'mover', text: 'Mover um app de pasta' },
      {
        kind: 'p',
        text: 'Em **Meus apps**, abra o menu do app e escolha **Mover**. Selecione a pasta de destino: a OpenStore cria uma subpasta com o nome do app, copia os arquivos e atualiza o caminho do executável. A pasta antiga vai para a lixeira.',
      },
      {
        kind: 'p',
        text: 'Se o app foi instalado pelo instalador do fabricante, mover copia a pasta registrada, mas os atalhos criados por ele continuam apontando para o local antigo. Nesse caso, reinstale pelo instalador se precisar que os atalhos acompanhem.',
      },
      { kind: 'h2', id: 'remover', text: 'Remover um app' },
      {
        kind: 'p',
        text: '**Remover** retira o app da lista e apaga a pasta gerenciada. Quando o app tem um desinstalador registrado no Windows, ele é executado em vez da remoção direta da pasta.',
      },
      { kind: 'h2', id: 'backup', text: 'Backup e limpeza' },
      {
        kind: 'ul',
        items: [
          'Copie o `installed.json` antes de formatar a máquina. Sem ele, a OpenStore não sabe onde estão os apps, mesmo que os arquivos continuem no disco.',
          'A pasta de downloads temporários pode ser apagada a qualquer momento com o app fechado.',
          'Os apps em si não têm backup automático: para recuperá-los, instale novamente pela loja.',
        ],
      },
    ],
  },
  {
    slug: 'seguranca',
    title: 'Segurança e verificação',
    nav: 'Segurança e verificação',
    group: 'Referência',
    updated: UPDATED,
    summary:
      'O que a OpenStore verifica em cada arquivo, quando verifica, o que fica registrado para quem baixa e o que essas checagens não garantem.',
    blocks: [
      { kind: 'h2', id: 'etapas', text: 'As três etapas' },
      {
        kind: 'ol',
        items: [
          '**No envio:** extensão permitida, tamanho máximo e SHA-256, calculados no navegador e gravados junto com o download.',
          '**Na instalação:** o app de desktop passa o binário pelo ClamAV instalado na máquina antes de executar qualquer instalador.',
          '**Na página do app:** o status da análise (pendente, aprovado, suspeito ou bloqueado) fica visível para quem vai baixar.',
        ],
      },
      {
        kind: 'p',
        text: 'As checagens do site e do app são independentes. A primeira garante que o arquivo publicado é o arquivo entregue. A segunda procura assinaturas de malware conhecidas no conteúdo.',
      },
      { kind: 'h2', id: 'hash', text: 'Integridade: SHA-256' },
      {
        kind: 'p',
        text: 'O hash é calculado no navegador antes do envio e exibido na página do app. Para conferir um arquivo já baixado:',
      },
      {
        kind: 'code',
        caption: 'Windows PowerShell',
        text: 'Get-FileHash .\\OpenStore.Setup.1.6.0.exe -Algorithm SHA256',
      },
      {
        kind: 'code',
        caption: 'Linux',
        text: 'sha256sum OpenStore-1.6.0-x86_64.AppImage',
      },
      {
        kind: 'p',
        text: 'Compare o resultado com o hash mostrado na página. Se os valores forem diferentes, o arquivo não é o que a loja registrou: apague-o e baixe de novo.',
      },
      { kind: 'h2', id: 'clamav', text: 'ClamAV na instalação' },
      {
        kind: 'p',
        text: 'Antes de executar qualquer instalador, o app procura o ClamAV nos caminhos padrão do sistema:',
      },
      {
        kind: 'ul',
        items: [
          '`C:\\Program Files\\ClamAV\\clamscan.exe`',
          '`C:\\Program Files (x86)\\ClamAV\\clamscan.exe`',
          '`/usr/bin/clamscan`',
          '`/usr/local/bin/clamscan`',
        ],
      },
      {
        kind: 'p',
        text: 'O código de saída do `clamscan` decide o que acontece. Zero significa limpo, um significa infecção, dois significa erro na análise.',
      },
      {
        kind: 'table',
        head: ['Resultado', 'O que acontece'],
        rows: [
          ['Limpo', 'A instalação continua normalmente.'],
          ['Infectado', 'O arquivo é apagado e a instalação é cancelada, com a linha do relatório do ClamAV na mensagem.'],
          [
            'ClamAV ausente',
            'A instalação continua, e o app registra que a análise não foi feita. Instalar o ClamAV habilita a verificação.',
          ],
          ['Erro na análise', 'O arquivo é mantido, a instalação não é bloqueada e o erro fica registrado no app.'],
        ],
      },
      { kind: 'h2', id: 'limites', text: 'O que a verificação não garante' },
      {
        kind: 'p',
        text: 'Hash e antivírus respondem a perguntas diferentes. O SHA-256 mostra que o arquivo é o mesmo que foi publicado. O ClamAV mostra que ele não corresponde a uma assinatura de malware conhecida naquele momento.',
      },
      {
        kind: 'p',
        text: 'Nenhum dos dois atesta que o programa é confiável. Um binário novo, sem assinatura conhecida, passa limpo mesmo que faça algo indesejado. Antes de instalar, vale ver quem publicou, quando a versão foi enviada e se existe código-fonte público.',
      },
      {
        kind: 'note',
        tone: 'warn',
        title: 'Instale apenas o que você reconhece',
        text: 'A OpenStore distribui programas enviados por terceiros. Quem publica responde pelo conteúdo do arquivo, e a análise automática não substitui esse julgamento.',
      },
      { kind: 'h2', id: 'reportar', text: 'Reportar um arquivo suspeito' },
      {
        kind: 'p',
        text: 'Abra uma issue em [github.com/zinvoid/OpenStore/issues](https://github.com/zinvoid/OpenStore/issues) com o link do app, o nome do arquivo e o resultado da análise. Se o ClamAV apontou uma ameaça, cole a linha do relatório.',
      },
    ],
  },
  {
    slug: 'problemas',
    title: 'Solução de problemas',
    nav: 'Solução de problemas',
    group: 'Referência',
    updated: UPDATED,
    summary:
      'Respostas curtas para os problemas mais comuns de instalação, download, verificação e publicação.',
    blocks: [
      { kind: 'h2', id: 'smartscreen', text: 'O Windows bloqueou o instalador' },
      {
        kind: 'p',
        text: 'É o SmartScreen tratando um executável sem assinatura comercial como desconhecido. Clique em **Mais informações** e depois em **Executar assim mesmo**. Se a opção não aparecer, confira o SHA-256 do arquivo com o valor publicado na página da versão.',
      },
      { kind: 'h2', id: 'download', text: 'O download não começa' },
      {
        kind: 'ul',
        items: [
          'Confirme que há espaço livre em disco e que o bloqueador de anúncios não está interceptando o link.',
          'Tente a página [Todas as versões](https://github.com/zinvoid/OpenStore/releases), que lista os arquivos direto no GitHub.',
          'Se o download para em 0%, a rede pode estar bloqueando o domínio de armazenamento. Teste em outra conexão antes de abrir uma issue.',
        ],
      },
      { kind: 'h2', id: 'analise', text: 'A análise do arquivo demora ou falha' },
      {
        kind: 'p',
        text: 'A primeira execução do ClamAV carrega a base de assinaturas e pode levar mais tempo que as seguintes. A análise tem limite de cinco minutos; se estourar, o app trata como erro e mantém o arquivo. Rodar o `clamscan --version` no terminal mostra se o antivírus está instalado e respondendo.',
      },
      { kind: 'h2', id: 'nao-abre', text: 'O app instalado não abre' },
      {
        kind: 'p',
        text: 'Abra **Meus apps**, localize o programa e use **Buscar automaticamente**. O app procura o executável no registro do Windows e na pasta do OpenStore, e permite escolher entre os resultados encontrados. Se ele foi desinstalado por fora, remova a entrada e instale de novo.',
      },
      { kind: 'h2', id: 'loja-vazia', text: 'A loja aparece vazia' },
      {
        kind: 'p',
        text: 'O catálogo só mostra apps publicados pela comunidade: não há apps de exemplo. Se a vitrine estiver vazia em outra máquina também, verifique a conexão e recarregue. Um erro de rede aparece como mensagem na própria página, não como lista vazia.',
      },
      { kind: 'h2', id: 'arquivo-recusado', text: 'Meu arquivo foi recusado no envio' },
      {
        kind: 'ul',
        items: [
          '**Extensão não aceita.** Use um dos formatos listados em [Publicar um aplicativo](/guia/publicar).',
          '**Arquivo acima de 50 MB.** Reduza o pacote ou distribua o instalador fora da loja.',
          '**Arquivo vazio.** Confira se o envio terminou; um arquivo de 0 byte é recusado imediatamente.',
        ],
      },
      { kind: 'h2', id: 'conta', text: 'Não consigo entrar na conta' },
      {
        kind: 'p',
        text: 'A sessão fica salva no navegador por token. Se as páginas de publicação pedirem login outra vez, saia e entre novamente. Não há recuperação automática de senha por e-mail: se você perdeu o acesso, abra uma issue no repositório.',
      },
      { kind: 'h2', id: 'antivirus', text: 'Meu antivírus reclama da OpenStore' },
      {
        kind: 'p',
        text: 'O aplicativo é Electron e não é assinado, então alguns antivírus sinalizam instaladores novos por reputação, não por conteúdo. Confira o SHA-256 do arquivo e, se precisar, compile a partir do código-fonte no repositório antes de liberar a exceção.',
      },
      { kind: 'h2', id: 'reportar', text: 'Ainda não resolveu' },
      {
        kind: 'p',
        text: 'Abra uma issue em [github.com/zinvoid/OpenStore/issues](https://github.com/zinvoid/OpenStore/issues) com o sistema, a versão da OpenStore (aparece na parte de baixo do menu lateral) e o que aconteceu antes do problema.',
      },
    ],
  },
]

export function findDoc(slug?: string): DocPage | undefined {
  return DOCS.find((doc) => doc.slug === slug)
}

export function docPager(slug: string): { prev?: DocPage; next?: DocPage } {
  const index = DOCS.findIndex((doc) => doc.slug === slug)
  if (index < 0) return {}
  return { prev: DOCS[index - 1], next: DOCS[index + 1] }
}

export const DOC_GROUPS: DocGroup[] = ['Guia', 'Referência']
