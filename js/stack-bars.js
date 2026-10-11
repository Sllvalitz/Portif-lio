/* ═══════════════════════════════════════════════════════════
   STACK BARS — stack-bars.js
   Gera as barras decorativas (alturas aleatórias) acima do rótulo
   "STACK" no canto inferior direito do Hero.

   As alturas ficam guardadas na sessão: quando a página volta pela
   logo do header (html.skip-loading, ainda presente aqui), o hero não
   muda — reaproveita as mesmas barras em vez de sortear outras.
════════════════════════════════════════════════════════════ */

(function() {
  const COUNT = 52;
  const KEY = 'stack-bars';
  const bars = document.getElementById('stack-bars');

  let heights = null;
  if (document.documentElement.classList.contains('skip-loading')) {
    try { heights = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
  }
  if (!Array.isArray(heights) || heights.length !== COUNT) {
    heights = Array.from({ length: COUNT }, () => Math.floor(Math.random() * 26) + 8);
    try { sessionStorage.setItem(KEY, JSON.stringify(heights)); } catch (e) {}
  }

  heights.forEach((h) => {
    const bar = document.createElement('div');
    bar.className = 'stack__bar';
    bar.style.height = h + 'px';
    bars.appendChild(bar);
  });
})();
