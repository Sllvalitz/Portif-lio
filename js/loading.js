/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN — loading.js
   - Gera glyphs/strings aleatórios no terminal field
   - Dispara o hide após 2 segundos
   - Remove o elemento do DOM após a transição
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Dados para o terminal ── */
  const STRINGS = [
    'VALIDATING...', 'SYSTEM CHECK...', 'BOOT OK', 'AUTH OK',
    'LOADING MODULES', 'INIT SEQUENCE', 'HANDSHAKE...',
    'SIGNAL LOCK', 'CHECKING STACK', 'ENV READY',
    'COMPILING...', 'LINK ESTABLISHED', 'ACCESS GRANTED',
    'SCANNING...', 'NODE ACTIVE', 'UPLINK OK',
  ];

  const COORDS = [
    '2.5564° S', '44.3039° W', 'ALT: 32M',
    'LAT: -2.53', 'LON: -44.3', 'UTC-3',
    'GRID: 23M PF', 'ZONE: SA-02',
  ];

  function rnd(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rnd(min, max));
  }

  function randItem(arr) {
    return arr[randInt(0, arr.length)];
  }

  /* ── Gera um número randômico como string ── */
  function randNumStr() {
    const types = [
      () => rnd(0, 9999).toFixed(4),
      () => `0x${randInt(0, 65535).toString(16).toUpperCase().padStart(4,'0')}`,
      () => `${randInt(100,999)}.${randInt(0,999).toString().padStart(3,'0')}`,
      () => `${randItem(COORDS)}`,
      () => `[${randInt(0,255)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(0,255)}]`,
    ];
    return types[randInt(0, types.length)]();
  }

  /* ── Popula o terminal field com glyphs ── */
  function populateTerminal() {
    const field = document.querySelector('.terminal-field');
    if (!field) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const count = 80; // quantidade de elementos

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');

      const isStatus = Math.random() < 0.25;

      if (isStatus) {
        el.classList.add('t-status');
        el.textContent = randItem(STRINGS);
        el.style.setProperty('--blink', `${rnd(0.2, 0.7).toFixed(2)}s`);
      } else {
        el.classList.add('t-glyph');
        el.textContent = randNumStr();
        el.style.setProperty('--dur', `${rnd(0.1, 0.35).toFixed(2)}s`);
        el.style.setProperty('--op-a', rnd(0.1, 0.35).toFixed(2));
        el.style.setProperty('--op-b', rnd(0.02, 0.08).toFixed(2));
      }

      // Posição: evitar o centro (zona segura de 340×160px)
      let x, y;
      do {
        x = rnd(20, W - 200);
        y = rnd(20, H - 40);
      } while (
        x > W / 2 - 260 && x < W / 2 + 260 &&
        y > H / 2 - 100 && y < H / 2 + 100
      );

      el.style.left  = `${x}px`;
      el.style.top   = `${y}px`;
      el.style.setProperty('--delay', `${rnd(0, 0.5).toFixed(2)}s`);

      field.appendChild(el);
    }

    /* Atualiza textos aleatórios a cada 120ms para efeito de "escaneamento" */
    let updateInterval = setInterval(() => {
      const glyphs = field.querySelectorAll('.t-glyph');
      const toUpdate = Math.floor(glyphs.length * 0.25);
      for (let j = 0; j < toUpdate; j++) {
        const g = glyphs[randInt(0, glyphs.length)];
        if (g) g.textContent = randNumStr();
      }
    }, 120);

    return updateInterval;
  }

  /* Duração da animação reversa do texto central (deve bater com o CSS:
     último delay 0.2s + duração 0.3s = 0.5s) */
  const TEXT_EXIT_MS = 500;

  /* ── Revela a hero section e o navbar/side-nav ── */
  function revealSite() {
    const hero = document.getElementById('hero');
    if (hero) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => hero.classList.add('is-visible'));
      });
    }
    document.body.classList.add('nav-ready');
  }

  /* ── Dispara a saída reversa do texto, depois o shutter, depois remove do DOM ── */
  function dismissLoading(screen, intervalId) {
    if (intervalId) clearInterval(intervalId);

    const center = screen.querySelector('.loading-center');
    if (center) center.classList.add('is-exiting');

    setTimeout(() => {
      screen.classList.add('hide');

      screen.addEventListener('animationend', () => {
        screen.remove();
        revealSite();
      }, { once: true });
    }, TEXT_EXIT_MS);
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;

    // Recarga disparada pela logo do header (logo-reload.js): o site
    // reinicia do zero, mas sem repetir a tela de loading.
    if (document.documentElement.classList.contains('skip-loading')) {
      try { sessionStorage.removeItem('skip-loading'); } catch (e) {}
      screen.remove();
      document.documentElement.classList.remove('skip-loading');
      revealSite();
      return;
    }

    const intervalId = populateTerminal();

    // 2000ms exatos de loading → dismiss
    setTimeout(() => dismissLoading(screen, intervalId), 2000);
  });
})();
