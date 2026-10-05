/* ═══════════════════════════════════════════════════════════
   BIO STREAM — bio-stream.js
   Digita o texto de "Sobre Mim" caractere a caractere, errando
   1-2 palavras no meio do caminho e se corrigindo sozinho — sem
   nenhum estado de "pensando"/spinner (ref.: CodeFronts "LLM Token
   Stream Glitch", reduzido só ao stream + correção).

   O texto de origem é lido direto do próprio parágrafo (nenhum
   conteúdo duplicado aqui); os "erros" são só visuais/transitórios,
   o texto final exibido é sempre o real. Dispara uma única vez
   quando a seção entra na viewport — não é um loop permanente.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Cada glitch: pouco antes da palavra real "before" aparecer no
     texto, o stream digita "wrong", risca, e corrige para o trecho
     real. Se "before" não existir no texto (bio foi editada), o
     glitch correspondente é simplesmente pulado. */
  const GLITCHES = [
    { before: 'Edge AI', wrong: 'Deep Learning' },
    { before: 'Ager',    wrong: 'Atlas' }
  ];

  const CHAR_DELAY_MS   = 16;  // base por caractere
  const CHAR_JITTER_MS  = 14;  // variação aleatória por caractere
  const GLITCH_HOLD_MS  = 260; // tempo com a palavra errada antes do risco
  const STRIKE_MS       = 280; // duração do risco (bate com o CSS)
  const FLICKER_MS      = 120; // flicker do cursor após a correção
  const REMOVE_MS       = 200; // colapso da palavra errada

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function streamBio(el, fullText) {
    el.textContent = '';
    el.classList.add('bio-stream');

    const cursor = document.createElement('span');
    cursor.className = 'bio-stream__cursor';
    el.appendChild(cursor);

    async function typeChars(str) {
      for (const ch of str) {
        const span = document.createElement('span');
        span.className = 'bio-stream__char';
        span.textContent = ch;
        el.insertBefore(span, cursor);
        await wait(CHAR_DELAY_MS + Math.random() * CHAR_JITTER_MS);
      }
    }

    async function typeWrongThenStrike(word) {
      const span = document.createElement('span');
      span.className = 'bio-stream__wrong';
      span.textContent = word;
      el.insertBefore(span, cursor);

      await wait(GLITCH_HOLD_MS);
      span.classList.add('is-striking');
      await wait(STRIKE_MS);

      cursor.classList.add('is-flickering');
      await wait(FLICKER_MS);
      cursor.classList.remove('is-flickering');

      span.classList.add('is-removing');
      await wait(REMOVE_MS);
      span.remove();
    }

    async function run() {
      let pos = 0;
      for (const glitch of GLITCHES) {
        const idx = fullText.indexOf(glitch.before, pos);
        if (idx === -1) continue; // bio mudou, pula esse glitch com segurança
        await typeChars(fullText.slice(pos, idx));
        await typeWrongThenStrike(glitch.wrong);
        pos = idx; // retoma exatamente de onde o trecho real começa
      }
      await typeChars(fullText.slice(pos));
      cursor.remove(); // texto final fica estático, sem cursor piscando
    }

    run();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bio = document.querySelector('.about__bio-text');
    if (!bio) return;

    // Evita o "flash" do texto completo e estático antes do stream
    // começar — fica vazio (só com o cursor) até a seção ser vista.
    const placeholderCursor = document.createElement('span');
    placeholderCursor.className = 'bio-stream__cursor';
    bio.dataset.fullText = bio.textContent.trim();
    bio.textContent = '';
    bio.classList.add('bio-stream');
    bio.appendChild(placeholderCursor);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      bio.textContent = bio.dataset.fullText;
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        streamBio(bio, bio.dataset.fullText);
        obs.unobserve(entry.target);
      });
    }, {
      root: null,
      threshold: 0.3
    });

    observer.observe(bio);
  });
})();
