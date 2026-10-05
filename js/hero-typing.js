/* ═══════════════════════════════════════════════════════════
   HERO TYPING — hero-typing.js
   Digita "ANDERSON" e "DA SILVA" caractere a caractere (mesma
   lógica do bio-stream.js, sem o erro/correção) e deixa um caret
   piscando no final. Também liga os flickers CRT do Hero
   adicionando .hero-live em #hero.

   Estrutura gerada em cada linha:
     .hero__anderson / .hero__da-silva   ← wrapper (flicker forte)
       span.hero__name-text              ← texto (flicker leve)
         span.hero__char × N
       span.hero__caret                  ← caret (fora do texto)

   Tudo só começa DEPOIS do loading: o loading.js adiciona
   body.nav-ready quando a tela de loading sai do DOM.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const START_DELAY_MS = 350;  // respiro entre o fim do loading e a 1ª letra
  const CHAR_DELAY_MS  = 90;   // base por caractere
  const CHAR_JITTER_MS = 45;   // variação aleatória por caractere
  const LINE_PAUSE_MS  = 260;  // pausa entre "ANDERSON" e "DA SILVA"

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* Troca o texto por <span>s de 1 caractere (opacity 0) dentro de
     .hero__name-text. O texto continua todo no DOM — o layout final é
     reservado desde o início. */
  function buildLine(wrap) {
    const text = wrap.textContent.trim();
    wrap.textContent = '';

    const inner = document.createElement('span');
    inner.className = 'hero__name-text';
    wrap.appendChild(inner);

    const chars = Array.from(text).map((ch) => {
      const span = document.createElement('span');
      span.className = 'hero__char';
      span.textContent = ch;
      inner.appendChild(span);
      return span;
    });

    return { wrap, chars };
  }

  /* Dispara cb quando o loading terminar. */
  function whenLoadingDone(cb) {
    const body = document.body;
    if (body.classList.contains('nav-ready') || !document.getElementById('loading-screen')) {
      cb();
      return;
    }
    const mo = new MutationObserver(() => {
      if (body.classList.contains('nav-ready')) {
        mo.disconnect();
        cb();
      }
    });
    mo.observe(body, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('hero');
    const first = document.querySelector('.hero__anderson');
    const second = document.querySelector('.hero__da-silva');
    if (!hero || !first || !second) return;

    const lines = [buildLine(first), buildLine(second)];

    const caret = document.createElement('span');
    caret.className = 'hero__caret';
    caret.setAttribute('aria-hidden', 'true');

    /* Posição atual do caret: linha, índice do caractere, antes/depois.
       Guardada para reposicionar em resize / quando as fontes carregam. */
    let pos = null;

    function placeCaret(lineIdx, charIdx, after) {
      pos = { lineIdx, charIdx, after };
      const { wrap, chars } = lines[lineIdx];
      if (caret.parentNode !== wrap) wrap.appendChild(caret);
      const ch = chars[charIdx];
      caret.style.left = (ch.offsetLeft + (after ? ch.offsetWidth : 0)) + 'px';
    }

    function refreshCaret() {
      if (pos) placeCaret(pos.lineIdx, pos.charIdx, pos.after);
    }

    window.addEventListener('resize', refreshCaret);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshCaret);

    const lastLine = lines.length - 1;
    const lastChar = lines[lastLine].chars.length - 1;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Sem animação: texto completo e caret parado no final.
      lines.forEach((l) => l.chars.forEach((c) => c.classList.add('is-typed')));
      placeCaret(lastLine, lastChar, true);
      return;
    }

    async function run() {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      hero.classList.add('hero-live'); // liga os flickers (CSS)

      placeCaret(0, 0, false);
      await wait(START_DELAY_MS);

      for (let l = 0; l < lines.length; l++) {
        if (l > 0) {
          await wait(LINE_PAUSE_MS);
          placeCaret(l, 0, false); // caret "pula" para o início da 2ª linha
          await wait(LINE_PAUSE_MS / 2);
        }
        for (let c = 0; c < lines[l].chars.length; c++) {
          lines[l].chars[c].classList.add('is-typed');
          placeCaret(l, c, true);
          await wait(CHAR_DELAY_MS + Math.random() * CHAR_JITTER_MS);
        }
      }
      // caret permanece no fim de "DA SILVA", piscando (CSS)
    }

    whenLoadingDone(run);
  });
})();
