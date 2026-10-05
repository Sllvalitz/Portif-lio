/* ═══════════════════════════════════════════════════════════
   STACK BARS — stack-bars.js
   Gera as barras decorativas (alturas aleatórias) acima do rótulo
   "STACK" no canto inferior direito do Hero.
════════════════════════════════════════════════════════════ */

(function() {
  const bars = document.getElementById('stack-bars');
  for (let i = 0; i < 52; i++) {
    const bar = document.createElement('div');
    bar.className = 'stack__bar';
    const h = Math.floor(Math.random() * 26) + 8;
    bar.style.height = h + 'px';
    bars.appendChild(bar);
  }
})();
