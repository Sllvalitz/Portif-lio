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

  document.addEventListener('DOMContentLoaded', () => {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach(el => el.classList.add('reveal-in'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
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
  });
})();