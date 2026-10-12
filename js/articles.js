/* ═══════════════════════════════════════════════════════════
   ARTICLES — articles.js
   Carrega o catálogo de produção científica, acadêmica e técnica de
   data/articles.json  →  { "categories": [...], "articles": [...] }
   Dados separados do array `projects` (projects.js): nada é compartilhado.

   Cada publicação REAL aponta para a publicação original (periódico,
   repositório institucional, anais de evento...) via `publicationUrl`.
   O portfólio não hospeda o texto dos artigos: não há página de leitura própria.

   Para cadastrar uma publicação, adicione um objeto em "articles" no JSON.
   Só `id`, `title` e `category` são necessários; todos os outros campos são
   OPCIONAIS — o que não existir simplesmente não aparece na interface.

   Campos
     id               identificador único
     title            título
     category         'cientifica' | 'academica' | 'tecnica'  (ver "categories")
     type             tipo específico da produção (texto livre; sugestões em "categories[].types")
     authors          lista de autores: ["Nome Sobrenome", ...]
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

   API global (mesma de antes; projects.js a usa depois do carregamento):
     window.PORTFOLIO_PUBLICATION_CATEGORIES   (array)
     window.PORTFOLIO_ARTICLES                 (array)
     window.PORTFOLIO_ARTICLES_READY           (Promise que SEMPRE resolve)
     window.PORTFOLIO_ARTICLES_ERROR           (só existe se o carregamento falhou)
   Em caso de falha os dois arrays ficam vazios e o erro vai para o console.
════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Relativo ao <base href="/"> do index.html: funciona em qualquer rota (/projetos/<id>...)
  const DATA_URL = 'data/articles.json';

  window.PORTFOLIO_PUBLICATION_CATEGORIES = [];
  window.PORTFOLIO_ARTICLES = [];

  window.PORTFOLIO_ARTICLES_READY = fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${DATA_URL}`);
      return res.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.categories) || !Array.isArray(data.articles)) {
        throw new Error(`${DATA_URL}: esperado { "categories": [], "articles": [] }`);
      }
      window.PORTFOLIO_PUBLICATION_CATEGORIES = data.categories;
      window.PORTFOLIO_ARTICLES = data.articles;
    })
    .catch((err) => {
      console.error('[artigos] Falha ao carregar ou validar os dados:', err);
      window.PORTFOLIO_ARTICLES_ERROR = err;
    });
})();
