/* ═══════════════════════════════════════════════════════════
   TIMELINE AFFORDANCE — timeline-affordance.js
   Na primeira vez que a timeline de "Sobre Mim" entra na viewport:
     1. um marcador pulsa sutilmente (2x) para sugerir interatividade
     2. uma dica "↳ HOVER NOS MARCADORES" aparece por ~2.5s e some
   Dispara uma única vez — não é uma decoração permanente.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.getElementById('timeline-v');
    if (!timeline) return;

    const firstDot = timeline.querySelector('.timeline-v__dot');
    const hint = document.getElementById('timeline-hint');
    const points = Array.from(timeline.querySelectorAll('.timeline-v__point'));

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        // Revela os marcadores de baixo para cima: o último do DOM (mais
        // antigo, embaixo) aparece primeiro; o primeiro (mais recente,
        // em cima) aparece por último.
        const total = points.length;
        points.forEach((point, i) => {
          const delay = (total - 1 - i) * 180;
          setTimeout(() => point.classList.add('is-visible'), delay);
        });

        // Pulso de descoberta em um dos marcadores
        if (firstDot) {
          firstDot.classList.add('discover-pulse');
          firstDot.addEventListener('animationend', () => {
            firstDot.classList.remove('discover-pulse');
          }, { once: true });
        }

        // Dica temporária — aparece e some sozinha
        if (hint) {
          requestAnimationFrame(() => hint.classList.add('is-visible'));
          setTimeout(() => hint.classList.remove('is-visible'), 2600);
        }

        // Só acontece uma vez
        obs.unobserve(entry.target);
      });
    }, {
      root: null,
      threshold: 0.4
    });

    observer.observe(timeline);
  });
})();
