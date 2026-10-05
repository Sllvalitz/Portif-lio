/* ═══════════════════════════════════════════════════════════
   MOBILE MENU — mobile-menu.js
   Botão de 3 risquinhos do header (visível só no celular).
   Abre/fecha o painel de navegação (.navbar) via .is-open no header.
   Fecha ao: tocar num link, tocar fora, apertar Esc ou ir pro desktop.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const btn = document.getElementById('menu-btn');
    const nav = document.getElementById('site-nav');
    if (!header || !btn || !nav) return;

    const setOpen = (open) => {
      header.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };

    btn.addEventListener('click', () => {
      setOpen(!header.classList.contains('is-open'));
    });

    // Tocar num link navega e fecha o painel
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    // Tocar fora do header fecha
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Voltou para a largura de desktop: garante o painel fechado
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  });
})();
