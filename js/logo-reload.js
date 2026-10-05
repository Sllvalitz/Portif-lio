/* ═══════════════════════════════════════════════════════════
   LOGO RELOAD — logo-reload.js
   Clicar na logo do header:
     1. rola suavemente até o Hero (topo);
     2. ao chegar, recarrega a página do zero, reiniciando todas as
        animações — exceto a tela de loading, que só roda na primeira
        entrada ou em um reload normal (F5).

   Como o reload acontece já no topo, não há salto nem "descida
   automática" por restauração de scroll.

   O flag em sessionStorage é lido por um script inline no <head>
   (esconde o loading antes do 1º paint) e consumido pelo loading.js.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const AT_TOP_PX     = 2;     // tolerância para considerar "chegou ao topo"
  const MAX_SCROLL_MS = 2500;  // segurança: recarrega mesmo se o scroll travar

  let started = false;

  function reloadFresh() {
    try {
      sessionStorage.setItem('skip-loading', '1');
      // Remove hash (#about, #hero…) para a recarga não rolar para uma seção
      history.replaceState(null, '', location.pathname + location.search);
    } catch (err) { /* storage indisponível: recarrega normal, com loading */ }
    location.reload();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.site-header__logo');
    if (!logo) return;

    logo.addEventListener('click', (e) => {
      e.preventDefault();
      if (started) return;
      started = true;

      if (window.scrollY <= AT_TOP_PX) {
        reloadFresh();
        return;
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('scroll', onScroll);
        reloadFresh();
      };
      const onScroll = () => {
        if (window.scrollY <= AT_TOP_PX) finish();
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      setTimeout(finish, MAX_SCROLL_MS);

      // 'auto' respeita o CSS: suave normalmente, instantâneo em reduced-motion
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  });
})();
