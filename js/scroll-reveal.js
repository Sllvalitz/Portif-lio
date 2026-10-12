/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL — scroll-reveal.js
   Entrada suave dos conteúdos de cada seção ao entrarem no
   viewport, com stagger opcional via data-reveal-delay.
   Não afeta o indicador lateral de seções nem a timeline de
   "Sobre Mim" (cada um já tem seu próprio sistema).
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let observer = null;

  // Observa os [data-reveal] de um container. Também é exposta como
  // window.PortfolioReveal.observe() para conteúdo criado depois do
  // DOMContentLoaded (ex.: cards de certificados, que vêm de data/certificates.json).
  function reveal(targets) {
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach(el => el.classList.add('reveal-in'));
      return;
    }

    if (!observer) observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const delay = el.dataset.revealDelay ? Number(el.dataset.revealDelay) : 0;

        setTimeout(() => el.classList.add('reveal-in'), delay);
        obs.unobserve(el);
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px'
    });

    targets.forEach(el => observer.observe(el));
  }

  window.PortfolioReveal = {
    observe: (root) => reveal((root || document).querySelectorAll('[data-reveal]'))
  };

  document.addEventListener('DOMContentLoaded', () => {
    reveal(document.querySelectorAll('[data-reveal]'));
  });
})();