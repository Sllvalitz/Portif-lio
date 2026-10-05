/* ═══════════════════════════════════════════════════════════
   SECTION INDICATOR — section-indicator.js
   Único sistema responsável por detectar a seção ativa durante
   o scroll livre (SEM scroll-snap) e atualizar o indicador
   lateral fixo, com uma transição curta de fade/slide.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const LABELS = {
    hero:     'Boas Vindas',
    about:    'Sobre Mim',
    projects: 'Projetos',
    certs:    'Certificados',
    footer:   'Contato'
  };

  document.addEventListener('DOMContentLoaded', () => {
    const indicator = document.getElementById('section-indicator');
    const textEl = indicator?.querySelector('.section-indicator__text');
    if (!indicator || !textEl) return;

    const navLinks = Array.from(document.querySelectorAll('.navbar__links a'));

    // Ordem de documento — usada para desempatar quando, por uma fração
    // de segundo, mais de uma seção cruza a faixa de ativação ao mesmo
    // tempo (evita alternância rápida perto do limite entre seções).
    const sections = Object.keys(LABELS)
      .map(id => document.getElementById(id))
      .filter(Boolean);

    const activeIds = new Set();
    let currentId = null;
    let swapTimer = null;
    let hideTimer = null;

    const IDLE_DELAY = 2600; // ms parado até o indicador sumir

    function scheduleIdle() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        indicator.classList.add('is-idle');
      }, IDLE_DELAY);
    }

    function setActiveNavLink(id) {
      navLinks.forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    }

    function applyActive(id) {
      if (!id || !LABELS[id]) return;
      setActiveNavLink(id);

      if (id === currentId) return;
      currentId = id;

      indicator.classList.remove('is-idle');
      indicator.classList.add('is-visible');
      indicator.classList.add('is-changing');
      scheduleIdle();

      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => {
        textEl.textContent = LABELS[id];
        indicator.classList.remove('is-changing');
      }, 180);
    }

    function pickActive() {
      // Sempre a primeira seção (em ordem de documento) que estiver
      // atualmente cruzando a faixa de ativação — critério único e
      // consistente, sem depender da ordem de disparo dos callbacks.
      for (const section of sections) {
        if (activeIds.has(section.id)) {
          applyActive(section.id);
          return;
        }
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeIds.add(entry.target.id);
        } else {
          activeIds.delete(entry.target.id);
        }
      });
      pickActive();
    }, {
      root: null,
      /* "Linha imaginária" de ativação: uma faixa estreita perto do
         topo/centro da viewport (entre 35% e 45% da altura). Uma
         seção só é considerada ativa quando essa faixa está sobre
         ela — não quando ela está apenas parcialmente visível. */
      rootMargin: '-35% 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));

    /* ---- SENTINELA DE FIM DE PÁGINA ----
       O footer ("Contato") é curto e fica no rodapé: o scroll pode se esgotar
       (bater no fim do documento) antes da faixa de ativação acima
       chegar a cruzá-lo, deixando o indicador preso na seção
       anterior. Um sentinela de 1px no fim do <body> resolve isso —
       quando ele entra na tela, sabemos que chegamos ao fim real da
       página, e forçamos o footer (Contato) como ativo. */
    const bottomSentinel = document.getElementById('bottom-sentinel');
    if (bottomSentinel) {
      const bottomObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) applyActive('footer');
        });
      }, { root: null, threshold: 0 });

      bottomObserver.observe(bottomSentinel);
    }
  });
})();
