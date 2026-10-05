/* ═══════════════════════════════════════════════════════════
   SITE FOOTER — site-footer.js
   Preenche "Última atualização" com o cabeçalho HTTP Last-Modified
   da própria página (data do deploy), no formato pt-BR e fuso de
   São Luís (UTC-3).

   Por que não document.lastModified: quando o servidor não envia
   Last-Modified, ele devolve a hora ATUAL do visitante — o footer
   mostraria "agora" em toda visita. Aqui, sem o cabeçalho (ou fora
   de um servidor, ex.: file://), o item simplesmente permanece oculto.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const item = document.getElementById('footer-updated-item');
    const el = document.getElementById('footer-updated');
    if (!item || !el) return;

    fetch(location.href, { method: 'HEAD', cache: 'no-cache' })
      .then((res) => {
        const lm = res.headers.get('Last-Modified');
        const date = lm ? new Date(lm) : null;
        if (!date || isNaN(date.getTime())) return;

        el.textContent = date.toLocaleString('pt-BR', {
          timeZone: 'America/Fortaleza', // UTC-3 fixo, sem horário de verão
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        el.setAttribute('datetime', date.toISOString());
        item.hidden = false;
      })
      .catch(() => { /* sem servidor/cabeçalho: mantém oculto */ });
  });
})();
