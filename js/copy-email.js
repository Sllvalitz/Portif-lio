/* ═══════════════════════════════════════════════════════════
   COPY EMAIL — copy-email.js
   Botão "copiar e-mail" do footer. Lê o endereço do próprio link
   mailto (fonte única, nada duplicado no JS).

   1) navigator.clipboard (HTTPS, com gesto do usuário);
   2) fallback: textarea + execCommand('copy') (navegadores antigos);
   3) se tudo falhar: seleciona o texto do e-mail para copiar à mão.

   Feedback: ícone vira "check" + aviso curto (visual) e texto na
   região role="status" (leitores de tela). Volta ao normal em 2 s.
════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const FEEDBACK_MS = 2000;

  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('copy-email-wrap');
    const btn = document.getElementById('copy-email-btn');
    const tip = document.getElementById('copy-email-tip');
    const status = document.getElementById('copy-email-status');
    const link = document.querySelector('.site-footer__email');
    if (!wrap || !btn || !tip || !status || !link) return;

    const email = (link.textContent || '').trim() ||
      (link.getAttribute('href') || '').replace(/^mailto:/i, '');
    if (!email) return;

    let timer = null;

    async function copyText(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (e) { /* cai no fallback */ }

      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        ta.remove();
        btn.focus({ preventScroll: true }); // o select() tirou o foco do botão
        return ok;
      } catch (e) {
        return false;
      }
    }

    function selectEmailText() {
      const sel = window.getSelection && window.getSelection();
      if (!sel) return;
      const range = document.createRange();
      range.selectNodeContents(link);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function feedback(ok) {
      clearTimeout(timer);
      wrap.classList.toggle('is-copied', ok);
      wrap.classList.toggle('is-error', !ok);
      tip.textContent = ok ? 'Copiado!' : 'Não foi possível copiar';
      status.textContent = ok
        ? 'E-mail copiado para a área de transferência.'
        : 'Não foi possível copiar. O e-mail foi selecionado para você copiar manualmente.';
      timer = setTimeout(() => {
        wrap.classList.remove('is-copied', 'is-error');
        tip.textContent = '';
        status.textContent = '';
      }, FEEDBACK_MS);
    }

    btn.addEventListener('click', async () => {
      const ok = await copyText(email);
      if (!ok) selectEmailText();
      feedback(ok);
    });
  });
})();
