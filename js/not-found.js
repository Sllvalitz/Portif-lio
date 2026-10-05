/* ═══════════════════════════════════════════════════════════
   NOT FOUND — not-found.js
   Mostra no "terminal" da 404 o caminho que o visitante tentou
   abrir. Usa textContent (nunca innerHTML): o caminho vem da URL
   e não pode virar HTML.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const el = document.getElementById('nf-path');
  if (!el) return;

  let path = location.pathname + location.search;
  try { path = decodeURIComponent(path); } catch (e) { /* mantém como veio */ }

  const MAX = 64;
  if (path.length > MAX) path = path.slice(0, MAX - 1) + '…';

  el.textContent = path || '/';
})();
