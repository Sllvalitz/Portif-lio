/* ═══════════════════════════════════════════════════════════
   TAB TITLE — tab-title.js
   Alterna o título da aba entre "Ansi Labs" e "Ansi Labs_"
   (efeito de cursor de terminal).
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const BASE = 'Ansi Labs';
  const INTERVAL_MS = 1000; // abas em segundo plano limitam timers a ~1s

  let showCaret = false;
  document.title = BASE;

  setInterval(() => {
    showCaret = !showCaret;
    document.title = showCaret ? BASE + '_' : BASE;
  }, INTERVAL_MS);
})();
