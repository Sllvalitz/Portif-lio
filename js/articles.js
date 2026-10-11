/* ═══════════════════════════════════════════════════════════
   ARTICLES — articles.js
   Catálogo de produção científica, acadêmica e técnica. Dados separados
   do array `projects` (projects.js): nada é compartilhado entre os dois.

   Cada publicação REAL aponta para a publicação original (periódico,
   repositório institucional, anais de evento...) via `publicationUrl`.
   O portfólio não hospeda o texto dos artigos: não há página de leitura própria.

   Para cadastrar uma publicação, adicione um objeto em PORTFOLIO_ARTICLES.
   Só `id`, `title` e `category` são necessários; todos os outros campos são
   OPCIONAIS — o que não existir simplesmente não aparece na interface.

   Campos
     id               identificador único
     title            título
     category         'cientifica' | 'academica' | 'tecnica'  (ver PUBLICATION_CATEGORIES)
     type             tipo específico da produção (texto livre; sugestões em PUBLICATION_CATEGORIES)
     authors          lista de autores: ['Nome Sobrenome', ...]
     institution      instituição
     advisor          orientador
     summary          resumo (o card mostra no máx. ~4 linhas)
     keywords         palavras-chave (alimentam o filtro da aba; independentes das tags dos projetos)
     publicationUrl   URL http/https da publicação original (abre em nova aba)
     date, venue, doi dados bibliográficos opcionais (guardados nos dados; o card ainda não os exibe)
     demo             true → conteúdo FICTÍCIO de desenvolvimento (identificado no card, nunca vira link)

   Sem `publicationUrl` válida o card continua visível, mas sem link.
   Nunca cadastre uma URL que não seja o destino real da publicação.

   As categorias exibidas nos filtros são derivadas das publicações cadastradas:
   uma categoria sem publicações não aparece, e com uma única categoria
   cadastrada o filtro de categorias inteiro é omitido.
════════════════════════════════════════════════════════════ */

// Taxonomia fixa (ordem de exibição). `types` são só sugestões de `type`.
window.PORTFOLIO_PUBLICATION_CATEGORIES = [
  {
    id: 'cientifica',
    label: 'Produção científica',
    types: ['Artigo científico', 'Revisão bibliográfica', 'Trabalho em evento científico']
  },
  {
    id: 'academica',
    label: 'Produção acadêmica',
    types: ['Iniciação científica', 'Projeto de pesquisa', 'TCC']
  },
  {
    id: 'tecnica',
    label: 'Produção técnica',
    types: ['Relatório técnico', 'Documentação de engenharia', 'Artigo de divulgação técnica']
  }
];

window.PORTFOLIO_ARTICLES = [
  {
    id: 'notebook-antigo-servidor-domestico',
    title: 'Como transformei um notebook antigo em um servidor doméstico',
    category: 'tecnica',
    type: 'Artigo de divulgação técnica',
    authors: ['Anderson da Silva'],
    summary: 'Um roteiro para reaproveitar um notebook como servidor 24/7: Debian sem ambiente gráfico, serviços em Docker, organização de pastas, acesso remoto por VPN, segurança em camadas e backup.',
    keywords: ['Debian', 'Docker', 'Infraestrutura doméstica', 'Acesso remoto', 'Segurança'],
    date: '2026-01-01',
    demo: true // fictício: sem publicationUrl, serve só para testar a interface e os filtros
  }
];
