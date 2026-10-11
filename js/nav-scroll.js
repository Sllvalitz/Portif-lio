/* nav-scroll.js — navegação interna SEM hash na URL

   Por quê: com <base href="/">, o link "#about" resolve para "/#about".
   Estando em /index.html (Live Server) isso é OUTRA URL: o navegador
   recarrega a página e o loading roda de novo. Aqui o clique só rola até
   a seção e a URL não muda — também não sobra "#about" para ser copiado. */
(() => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.closest('.site-header__logo')) return; // a logo tem comportamento próprio (logo-reload.js)

    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ block: 'start' }); // respeita scroll-behavior (suave / reduced-motion)
  });

  // Chegou com hash (ex.: link "/#certs" da 404): depois de carregar, a URL volta a ser limpa
  const clean = () => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  };
  if (document.readyState === 'complete') clean();
  else window.addEventListener('load', clean);
})();
