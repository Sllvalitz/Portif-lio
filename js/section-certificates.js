/**
 * ============================================================
 * SECTION 5 — CERTIFICADOS
 * Portfolio: Anderson da Silva
 *
 * COMO PERSONALIZAR:
 *   Edite o array CERTS abaixo com seus dados reais.
 *   Cada objeto aceita:
 *     titulo        {string}  — Nome do certificado (use \n para quebra)
 *     sigla         {string}  — Texto de fallback se logo_path estiver vazio
 *     logo_path     {string}  — Caminho para o logo da instituição
 *     thumb_path    {string}  — Miniatura leve (640px) usada só no card da galeria
 *     full_cert_path{string}  — Imagem em alta resolução (painel + visualizador, carregada sob demanda)
 *     pdf_path      {string}  — Caminho para o PDF original (botão "Baixar PDF")
 *     instituicao   {string}  — Nome da instituição
 *     carga_horaria {string}  — Ex: "800 horas" (deixe "" se N/A)
 *     conclusao     {string}  — Ex: "Maio de 2024"
 * ============================================================
 */

(function () {
'use strict';

const CERTS = [
  {
    titulo: "Capacitação em Sistemas Embarcados e Inteligência Artificial na Borda",
    sigla: "PNAAT",
    logo_path: "",
    thumb_path: "assets/imagens/certs/thumbs/pnaat-embarcados-ia.webp",
    full_cert_path: "assets/imagens/certs/Capacitação_em_Sistemas_Embarcados_e_Inteligência_Artificial_na_Borda_74H.webp",
    pdf_path: "assets/pdfs/Capacitação_em_Sistemas_Embarcados_e_Inteligência_Artificial_na_Borda_74H.pdf",
    instituicao: "FIT - Instituto de Tecnologia",
    carga_horaria: "74 Horas",
    conclusao: "2026"
  },
  {
    titulo: "Trilha de Fundamentos em IoT e Edge AI",
    sigla: "PNAAT",
    logo_path: "",
    thumb_path: "assets/imagens/certs/thumbs/pnaat-iot-edge-ai.webp",
    full_cert_path: "assets/imagens/certs/Trilha_de_Fundamentos_em_IoT_e _Edge_AI_28H.webp",
    pdf_path: "assets/pdfs/Trilha_de_Fundamentos_em_IoT_e _Edge_AI_28H.pdf",
    instituicao: "FIT - Instituto de Tecnologia",
    carga_horaria: "28 Horas",
    conclusao: "2026"
  },
  {
    titulo: "TXM Challenge Multicenter Negócios e Eventos",
    sigla: "TXM",
    logo_path: "",
    thumb_path: "assets/imagens/certs/thumbs/txm-challenge.webp",
    full_cert_path: "assets/imagens/certs/TXM_Challenge_Multicenter_Negócios_e_Eventos_90H.webp",
    pdf_path: "assets/pdfs/TXM_Challenge_Multicenter_Negócios_e_Eventos_90H.pdf",
    instituicao: "TXM Methods",
    carga_horaria: "90 Horas",
    conclusao: "2026"
  },
  {
    titulo: "1º Jornada de Inovação da Agricultura Familiar no Maranhão",
    sigla: "1° JSAF",
    logo_path: "",
    thumb_path: "assets/imagens/certs/thumbs/jornada-saf.webp",
    full_cert_path: "assets/imagens/certs/Jornada_de_Inovação_da_Agricultura_Familiar_SAF_Maranhão_e_Agência_Marandu_30H.webp",
    pdf_path: "assets/pdfs/Jornada_de_Inovação_da_Agricultura_Familiar_SAF_Maranhão_e_Agência_Marandu_30H.pdf",
    instituicao: "Agência Marandu",
    carga_horaria: "30 Horas",
    conclusao: "2026"
  },
  {
    titulo: "Programação \n Back-End",
    sigla: "SECTI",
    logo_path: "",
    thumb_path: "assets/imagens/certs/thumbs/back-end-400h.webp",
    full_cert_path: "assets/imagens/certs/Programação_Back_End_400H.webp",
    pdf_path: "assets/pdfs/Programação_Back_End_400H.pdf",
    instituicao: "Secretaria de Ciência, Tecnologia e Inovação",
    carga_horaria: "400 Horas",
    conclusao: "2025"
  }
];

let selectedIndex = null;
let viewerEl = null;

// Layout empilhado (celular/tablet em retrato): o painel de detalhes abre
// logo abaixo do card clicado, dentro da lista. No desktop ele fica
// abaixo da galeria inteira, como sempre.
const mqStacked = window.matchMedia('(max-width: 900px)');

// Garante que o script só execute depois de todo o HTML renderizado
// (também está marcado com "defer" no <script> do portfolio.html —
// os dois juntos blindam contra a ordem de carregamento).
document.addEventListener('DOMContentLoaded', () => {
  buildCertCards();

  // Mudou entre desktop e celular com um certificado aberto: reposiciona o painel
  mqStacked.addEventListener('change', () => {
    if (selectedIndex !== null) placePanel(selectedIndex);
  });

  const panelCta = document.getElementById('panel-cta');
  if (panelCta) {
    panelCta.addEventListener('click', () => {
      const index = selectedIndex;
      if (index === null) return;
      openPdfViewer(CERTS[index]);
    });
  }
});

/* ============================================================
   BUILD CARDS
   ============================================================ */
/* Aplica a imagem de fundo do card só quando ele está perto da tela
   (CSS background-image não suporta loading="lazy"). */
let cardBgObserver = null;

function applyCardBg(bg) {
  if (bg && bg.dataset.bg) {
    bg.style.backgroundImage = `url('${bg.dataset.bg}')`;
    delete bg.dataset.bg;
  }
}

function observeCardBg(card, bg) {
  if (!('IntersectionObserver' in window)) { applyCardBg(bg); return; }
  if (!cardBgObserver) {
    cardBgObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        applyCardBg(entry.target.querySelector('.cert-card__bg'));
        cardBgObserver.unobserve(entry.target);
      });
    }, { rootMargin: '400px 0px' });
  }
  cardBgObserver.observe(card);
}

function buildCertCards() {
  const row = document.getElementById('certs-row');
  if (!row) return;

  row.innerHTML = '';

  CERTS.forEach((cert, i) => {
    const card = document.createElement('div');
    card.className = 'cert-card';
    card.dataset.index = i;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', cert.titulo.replace(/\n/g, ' '));
    card.setAttribute('data-reveal', '');
    card.dataset.revealDelay = Math.min(i * 70, 280);

    const bg = document.createElement('div');
    bg.className = 'cert-card__bg';
    const bgSrc = cert.thumb_path || cert.full_cert_path;
    if (bgSrc) bg.dataset.bg = bgSrc;

    const overlay = document.createElement('div');
    overlay.className = 'cert-card__overlay';

    const scan = document.createElement('div');
    scan.className = 'cert-card__scan';

    const logoWrap = document.createElement('div');
    logoWrap.className = 'cert-card__logo-wrap';

    if (cert.logo_path) {
      const img = document.createElement('img');
      img.className = 'cert-card__logo';
      img.src = cert.logo_path;
      img.alt = cert.sigla;
      logoWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'cert-card__logo-placeholder';
      ph.textContent = cert.sigla;
      logoWrap.appendChild(ph);
    }

    const titleDiv = document.createElement('div');
    titleDiv.className = 'cert-card__title';
    cert.titulo.split('\n').forEach(line => {
      const span = document.createElement('span');
      span.style.display = 'block';
      span.textContent = line;
      titleDiv.appendChild(span);
    });

    const indexDiv = document.createElement('div');
    indexDiv.className = 'cert-card__index';
    indexDiv.textContent = String(i + 1).padStart(2, '0');

    card.append(bg, overlay, scan, logoWrap, titleDiv, indexDiv);
    row.appendChild(card);
    observeCardBg(card, bg);

    card.addEventListener('click', () => selectCertificate(i));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCertificate(i);
      }
    });
  });
}

/* ============================================================
   PAINEL DE DETALHES — inline, abaixo da galeria
   ============================================================ */
function fillPanel(index) {
  const cert = CERTS[index];

  const panelCounterEl   = document.getElementById('panel-counter');
  const panelTitleEl     = document.getElementById('panel-title');
  const panelInstEl      = document.getElementById('panel-inst');
  const panelCargaWrap   = document.getElementById('panel-carga-wrap');
  const panelCargaEl     = document.getElementById('panel-carga');
  const panelConclusaoEl = document.getElementById('panel-conclusao');
  const panelPreviewImg  = document.getElementById('panel-preview-img');
  const panelPreviewPh   = document.getElementById('panel-preview-placeholder');

  if (panelCounterEl) panelCounterEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(CERTS.length).padStart(2, '0')}`;
  if (panelTitleEl) panelTitleEl.textContent = cert.titulo.replace(/\n/g, ' ');
  if (panelInstEl) panelInstEl.textContent = cert.instituicao;
  if (panelConclusaoEl) panelConclusaoEl.textContent = cert.conclusao;

  if (panelCargaWrap && panelCargaEl) {
    if (cert.carga_horaria) {
      panelCargaEl.textContent = cert.carga_horaria;
      panelCargaWrap.style.display = 'block';
    } else {
      panelCargaWrap.style.display = 'none';
    }
  }

  if (panelPreviewImg && panelPreviewPh) {
    if (cert.full_cert_path) {
      panelPreviewImg.src = cert.full_cert_path;
      panelPreviewImg.alt = cert.titulo.replace(/\n/g, ' ');
      panelPreviewImg.style.display = 'block';
      panelPreviewPh.style.display = 'none';
    } else {
      panelPreviewImg.style.display = 'none';
      panelPreviewPh.style.display = 'flex';
    }
  }
}

function setActiveCard(index) {
  document.querySelectorAll('.cert-card').forEach(card => {
    card.classList.toggle('active', Number(card.dataset.index) === index);
  });
}

/* Coloca o painel no lugar certo: logo depois do card (empilhado) ou
   depois da galeria (desktop). */
function placePanel(index) {
  const panelEl = document.getElementById('cert-panel');
  const row = document.getElementById('certs-row');
  if (!panelEl || !row) return;

  const anchor = mqStacked.matches
    ? row.querySelector(`.cert-card[data-index="${index}"]`)
    : row;

  if (anchor && panelEl.previousElementSibling !== anchor) {
    anchor.insertAdjacentElement('afterend', panelEl);
  }
}

/* Fecha o painel e desmarca o card (clique no card já aberto, ou Enter/Espaço) */
function closePanel() {
  const panelEl = document.getElementById('cert-panel');
  if (!panelEl) return;

  panelEl.classList.remove('is-open');
  setActiveCard(-1);
  selectedIndex = null;

  // Espera a transição de saída (0.4s) antes de esconder; se o usuário
  // abrir outro certificado nesse meio-tempo, não esconde.
  setTimeout(() => {
    if (selectedIndex === null) panelEl.setAttribute('hidden', '');
  }, 400);
}

function selectCertificate(index) {
  const panelEl = document.getElementById('cert-panel');
  if (!panelEl) return;

  // Clicou de novo no certificado que já está aberto → fecha
  if (index === selectedIndex && !panelEl.hasAttribute('hidden')) {
    closePanel();
    return;
  }

  setActiveCard(index);

  const isFirstOpen = panelEl.hasAttribute('hidden');

  if (isFirstOpen) {
    panelEl.removeAttribute('hidden');
    placePanel(index);
    fillPanel(index);
    void panelEl.offsetWidth; // força reflow p/ a transição rodar
    panelEl.classList.add('is-open');
  } else if (index !== selectedIndex) {
    if (mqStacked.matches) {
      // O painel muda de lugar: reabre com a animação de entrada
      panelEl.classList.remove('is-open');
      placePanel(index);
      fillPanel(index);
      void panelEl.offsetWidth;
      panelEl.classList.add('is-open');
    } else {
      panelEl.classList.add('is-changing');
      panelEl.classList.add('is-open'); // garante visível se veio de um fechamento recente
      setTimeout(() => {
        fillPanel(index);
        panelEl.classList.remove('is-changing');
      }, 160);
    }
  }

  selectedIndex = index;

  if (mqStacked.matches) {
    // Card no topo (abaixo do header) com o painel logo embaixo dele
    const card = document.querySelector(`.cert-card[data-index="${index}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (window.matchMedia('(max-width: 1024px)').matches) {
    // Tela compacta: o painel abre abaixo da galeria e pode ficar fora da tela
    panelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* ============================================================
   VISUALIZADOR — solução híbrida (70vw × 70vh)
   Mostra a imagem em alta resolução (full_cert_path) e oferece um
   botão discreto "Baixar PDF" que abre pdf_path em nova aba quando
   existir (fica oculto se não houver PDF cadastrado).
   ============================================================ */
function buildPdfViewer() {
  if (viewerEl) return;

  viewerEl = document.createElement('div');
  viewerEl.className = 'pdf-viewer';
  viewerEl.setAttribute('role', 'dialog');
  viewerEl.setAttribute('aria-modal', 'true');
  viewerEl.innerHTML = `
    <div class="pdf-viewer__backdrop"></div>
    <div class="pdf-viewer__box">
      <button class="pdf-viewer__close" id="pdf-viewer-close" aria-label="Fechar">✕</button>
      <div id="pdf-viewer-content" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"></div>
      <a class="pdf-viewer__download" id="pdf-viewer-download" href="#" target="_blank" rel="noopener" hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Baixar PDF
      </a>
    </div>
  `;
  document.body.appendChild(viewerEl);

  document.getElementById('pdf-viewer-close').addEventListener('click', closePdfViewer);
  viewerEl.querySelector('.pdf-viewer__backdrop').addEventListener('click', closePdfViewer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePdfViewer();
  });
}

/* Trava o scroll da página enquanto o visualizador está aberto.
   Usa overflow:hidden no <html> em vez de body{position:fixed}: o
   scroll NÃO é zerado, então ao fechar a página continua exatamente
   onde estava (antes, o body fixo mandava a página ao topo e o
   scrollTo de volta rodava com scroll-behavior:smooth, causando a
   "descida automática"). */
let scrollLockY = 0;

function lockPageScroll() {
  scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.style.overflow = 'hidden';
}

function unlockPageScroll() {
  document.documentElement.style.overflow = '';
  // Garantia: se algo mexeu no scroll, volta à posição original sem animar
  if (Math.abs((window.scrollY || 0) - scrollLockY) > 1) {
    window.scrollTo({ top: scrollLockY, left: 0, behavior: 'instant' });
  }
}

function openPdfViewer(cert) {
  buildPdfViewer();
  const content = document.getElementById('pdf-viewer-content');
  const downloadBtn = document.getElementById('pdf-viewer-download');

  if (cert.full_cert_path) {
    content.innerHTML = `<img class="pdf-viewer__img" decoding="async" src="${cert.full_cert_path}" alt="${cert.titulo.replace(/\n/g, ' ')}">`;
  } else {
    content.innerHTML = `
      <div class="pdf-viewer__empty">
        Imagem em alta resolução ainda não disponibilizada.<br>
        Adicione o caminho em <strong>full_cert_path</strong> no array CERTS.
      </div>
    `;
  }

  if (cert.pdf_path) {
    downloadBtn.href = cert.pdf_path;
    downloadBtn.hidden = false;
  } else {
    downloadBtn.hidden = true;
    downloadBtn.removeAttribute('href');
  }

  viewerEl.classList.add('open');
  lockPageScroll();
}

function closePdfViewer() {
  // O Escape é ouvido o tempo todo: só age se o visualizador está aberto
  if (!viewerEl || !viewerEl.classList.contains('open')) return;
  viewerEl.classList.remove('open');
  unlockPageScroll();
}

})();
