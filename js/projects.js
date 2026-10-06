/* ═══════════════════════════════════════════════════════════
   PROJECTS — projects.js
   Dados dos projetos, carrossel da seção e modal (Visão Geral +
   Guia em Markdown/PDF). Tudo dentro de uma IIFE: nada vaza para
   window.
════════════════════════════════════════════════════════════ */

(function () {

/* ---- marked (Markdown → HTML): carregado só quando um guia é aberto ---- */
const MARKED_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js';
let markedPromise = null;

function loadMarked() {
  if (window.marked) return Promise.resolve(window.marked.parse || window.marked);
  if (!markedPromise) {
    markedPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = MARKED_SRC;
      s.onload = () => resolve(window.marked.parse || window.marked);
      s.onerror = () => { markedPromise = null; reject(new Error('marked indisponível')); };
      document.head.appendChild(s);
    });
  }
  return markedPromise;
}

// ---- PROJECTS CAROUSEL ----
const projects = [
{
  id: 'legacy-server',
  title: 'Legacy Server',
  tags: ['Debian', 'Docker', 'CasaOS', 'Nginx', 'Tailscale', 'Btrfs'],
  description: 'Servidor doméstico 24/7 (~10W) construído a partir da placa-mãe de um notebook Acer ES1-511. Roda Debian 13 com CasaOS e Docker, proxy reverso Nginx Proxy Manager com SSL, VPN Tailscale, filtro DNS AdGuard Home, segurança com UFW, CrowdSec, ClamAV e Lynis, backup criptografado via Rclone, além de Jellyfin, Samba, Suwayomi e servidores Minecraft. Gabinete customizado impresso em 3D.',
  thumb_url: '',
  images: ['assets/imagens/hand.png', 'assets/imagens/hand.png', 'assets/imagens/hand.png'],
  guideMarkdown: './projects/legacy-server/guide.md',
  guidePdf: './projects/legacy-server/guide.pdf',
  github: 'https://github.com/Sllvalitz/legacy-server',
  youtube: '',
  difficulty: {
    level: 3,
    descriptions: {
      1: 'Necessário ter noção básica de sistemas operacionais.',
      2: 'Requer conhecimentos básicos de Linux e uso de terminal.',
      3: 'Requer domínio intermediário de Linux, Docker, redes (DNS, proxy reverso, VPN) e segurança básica de servidores.',
      4: 'Requer conhecimentos avançados de administração de sistemas, hardening e automação de rotinas.',
      5: 'Requer domínio avançado de múltiplas tecnologias e capacidade de projetar/implementar a solução de ponta a ponta.'
    }
  }
}
];

let currentProject = 0;
let thumbWindowStart = 0;
let progressTimer = null;
let progressStart = null;
const DURATION = 15000;

const titleEl = document.getElementById('proj-title');
const tagsEl = document.getElementById('proj-tags');
const descEl = document.getElementById('proj-desc');
const featImg = document.getElementById('featured-project-image');
const featImgContent = document.getElementById('featured-project-image-content');
const thumbContainer = document.getElementById('carousel-thumbs');
const progressFill = document.getElementById('progress-fill');
const carouselCounterEl = document.getElementById('carousel-counter');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Em telas estreitas mostra 2 thumbnails em vez de 3 (item 11) — só
// muda a quantidade visível na janela, não mexe em layout/CSS.
function getThumbWindowSize() {
  return window.matchMedia('(max-width: 700px)').matches ? 2 : 3;
}

function getVisibleThumbCount() {
  return Math.min(getThumbWindowSize(), projects.length);
}

// Reposiciona a janela só o necessário para manter o projeto
// selecionado visível — não move se ele já estiver dentro dela.
function updateThumbWindow(selectedIdx) {
  const visibleCount = getVisibleThumbCount();
  const maxStart = Math.max(0, projects.length - visibleCount);

  if (selectedIdx < thumbWindowStart) {
    thumbWindowStart = selectedIdx;
  } else if (selectedIdx > thumbWindowStart + visibleCount - 1) {
    thumbWindowStart = selectedIdx - visibleCount + 1;
  }

  thumbWindowStart = Math.min(Math.max(thumbWindowStart, 0), maxStart);
}

function buildThumbs() {
  thumbContainer.innerHTML = '';
  const visibleCount = getVisibleThumbCount();

  for (let localIndex = 0; localIndex < visibleCount; localIndex++) {
    const realIndex = thumbWindowStart + localIndex;
    const p = projects[realIndex];
    const t = document.createElement('div');
    t.className = 'carousel__thumb' + (realIndex === currentProject ? ' active' : '');
    t.setAttribute('role', 'button');
    t.setAttribute('tabindex', '0');
    t.setAttribute('aria-label', `Ver ${p.title}`);
    if (realIndex === currentProject) t.setAttribute('aria-current', 'true');
    if (p.thumb_url) {
      t.innerHTML = `<img src="${p.thumb_url}" alt="" loading="lazy" decoding="async">`;
    }
    t.addEventListener('click', () => { setProject(realIndex); });
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setProject(realIndex);
      }
    });
    thumbContainer.appendChild(t);
  }
}

function updateCarouselNavState() {
  // Navegação circular — as setas nunca ficam desabilitadas.
  prevBtn.disabled = false;
  nextBtn.disabled = false;
  if (carouselCounterEl) {
    carouselCounterEl.textContent =
      String(currentProject + 1).padStart(2, '0') + ' / ' + String(projects.length).padStart(2, '0');
  }
}

function renderFeaturedImage(p) {
  featImgContent.innerHTML = p.thumb_url
    ? `<img src="${p.thumb_url}" alt="${p.title}" loading="lazy" decoding="async">`
    : `<div class="img-placeholder">[ IMAGEM DO PROJETO ]</div>`;
}

function setProject(idx, animate = true) {
  currentProject = idx;
  const p = projects[idx];
  updateThumbWindow(idx);

  if (animate) {
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateX(-8px)';
    tagsEl.style.opacity = '0';
    tagsEl.style.transform = 'translateX(-8px)';
    descEl.style.opacity = '0';
    descEl.style.transform = 'translateX(-8px)';
    featImgContent.style.opacity = '0';
    setTimeout(() => {
      titleEl.textContent = p.title;
      tagsEl.innerHTML = p.tags.map(t => `<span class="project__tag">${t}</span>`).join('');
      descEl.textContent = p.description;
      renderFeaturedImage(p);
      titleEl.style.opacity = '1';
      titleEl.style.transform = 'translateX(0)';
      tagsEl.style.opacity = '1';
      tagsEl.style.transform = 'translateX(0)';
      descEl.style.opacity = '1';
      descEl.style.transform = 'translateX(0)';
      featImgContent.style.opacity = '1';
    }, 300);
  } else {
    titleEl.textContent = p.title;
    tagsEl.innerHTML = p.tags.map(t => `<span class="project__tag">${t}</span>`).join('');
    descEl.textContent = p.description;
    renderFeaturedImage(p);
  }

  buildThumbs();
  updateCarouselNavState();
  resetTimer();
}

/* Auto-avanço do carrossel (WCAG 2.2.2): não roda com prefers-reduced-motion
   e fica pausado enquanto o mouse ou o foco do teclado estão na seção. */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let carouselPaused = false;
let lastTickTs = null;

(function bindCarouselPause() {
  const section = document.getElementById('projects');
  if (!section) return;
  const pause = () => { carouselPaused = true; };
  const resume = () => { carouselPaused = false; };
  section.addEventListener('mouseenter', pause);
  section.addEventListener('mouseleave', resume);
  section.addEventListener('focusin', pause);
  section.addEventListener('focusout', resume);
})();

function resetTimer() {
  if (progressTimer) cancelAnimationFrame(progressTimer);
  progressStart = null;
  lastTickTs = null;
  progressFill.style.width = '0%';
  if (reduceMotion) return; // sem auto-avanço: navegação só manual
  function tick(ts) {
    if (!progressStart) progressStart = ts;
    // pausado: "congela" o tempo decorrido empurrando o início para frente
    if (carouselPaused && lastTickTs !== null) progressStart += ts - lastTickTs;
    lastTickTs = ts;
    const elapsed = ts - progressStart;
    const pct = Math.min((elapsed / DURATION) * 100, 100);
    progressFill.style.width = pct + '%';
    if (elapsed < DURATION) {
      progressTimer = requestAnimationFrame(tick);
    } else {
      setProject((currentProject + 1) % projects.length);
    }
  }
  progressTimer = requestAnimationFrame(tick);
}

prevBtn.addEventListener('click', () => {
  setProject((currentProject - 1 + projects.length) % projects.length);
});
nextBtn.addEventListener('click', () => {
  setProject((currentProject + 1) % projects.length);
});

window.addEventListener('resize', () => {
  updateThumbWindow(currentProject);
  buildThumbs();
});

setProject(0, false);

// ---- PROJECT MODAL (expansão de projeto) ----
// Etapa 1: estrutura, abertura/fechamento, header, navegação entre
// projetos e as duas guias (vazias). Reutiliza o array `projects` e
// pausa/retoma o autoplay do carrossel principal (setProject/resetTimer
// acima) — nenhuma lista paralela de dados é criada.
(function () {
  const modal = document.getElementById('project-modal');
  const backdrop = document.getElementById('project-modal-backdrop');
  const box = modal.querySelector('.project-modal__box');
  const btnPrev = document.getElementById('project-modal-prev');
  const btnNext = document.getElementById('project-modal-next');
  const btnClose = document.getElementById('project-modal-close');
  const counterEl = document.getElementById('project-modal-counter');
  const tabOverviewBtn = document.getElementById('tab-overview');
  const tabGuideBtn = document.getElementById('tab-guide');
  const panelOverview = document.getElementById('panel-overview');
  const panelGuide = document.getElementById('panel-guide');

  let modalIndex = 0;
  let activeTab = 'overview';
  let overviewImgIndex = 0;
  let guideRequestToken = 0;
  const guideHtmlCache = {}; // id -> html já renderizado (evita refetch)
  let lastFocusedEl = null;
  let scrollLockY = 0;
  const TRANSITION_MS = 400; // deve bater com .project-modal (CSS)
  let hideTimer = null;
  let closing = false;
  let closeToHome = false; // acesso direto + setas: a entrada-base também é /projetos/..., precisa virar "/"

  /* ---- DEEP LINKING (History API) ----
     URL do projeto = /projetos/<id>, onde <id> é o `id` do array `projects`
     (fonte única). history.state = { depth } guarda quantas entradas o modal
     empilhou desde que abriu: fechar volta exatamente essa quantidade, então
     o histórico nunca fica poluído e o Voltar do navegador não reabre o modal.
     `landed` marca sessões iniciadas por acesso direto à URL do projeto. */
  const ROUTE_PREFIX = '/projetos/';
  const projectPath = (idx) => ROUTE_PREFIX + encodeURIComponent(projects[idx].id);
  const currentDepth = () => (history.state && history.state.depth) || 0;

  function indexFromLocation() {
    const m = location.pathname.match(/^\/projetos\/([^/]+)\/?$/);
    if (!m) return -1;
    let slug;
    try { slug = decodeURIComponent(m[1]); } catch (e) { return -1; }
    return projects.findIndex((p) => p.id === slug);
  }

  const overviewImageEl = document.getElementById('overview-image');
  const overviewImagePh = document.getElementById('overview-image-placeholder');
  const overviewImgCounter = document.getElementById('overview-img-counter');
  const overviewPrevBtn = document.getElementById('overview-img-prev');
  const overviewNextBtn = document.getElementById('overview-img-next');
  const overviewTitleEl = document.getElementById('overview-title');
  const overviewTagsEl = document.getElementById('overview-tags');
  const overviewDescEl = document.getElementById('overview-desc');
  const guideContentEl = document.getElementById('guide-markdown-content');
  const guidePdfBtn = document.getElementById('guide-pdf-btn');

  /* Trava o scroll da página sem perder a posição ao fechar.
     overflow:hidden no <html> (em vez de body{position:fixed}) mantém o
     scroll onde está — o body fixo zerava o scroll e o scrollTo de volta
     rodava com scroll-behavior:smooth ("sobe e desce sozinho"). */
  function lockPageScrollForModal() {
    scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockPageScrollForModal() {
    document.documentElement.style.overflow = '';
    if (Math.abs((window.scrollY || 0) - scrollLockY) > 1) {
      window.scrollTo({ top: scrollLockY, left: 0, behavior: 'instant' });
    }
  }

  function updateNavState() {
    btnPrev.disabled = modalIndex === 0;
    btnNext.disabled = modalIndex === projects.length - 1;
    counterEl.textContent =
      String(modalIndex + 1).padStart(2, '0') + ' / ' + String(projects.length).padStart(2, '0');
  }

  /* ---- GUIA 1: VISÃO GERAL ---- */
  function renderOverviewImage() {
    const images = projects[modalIndex].images || [];

    if (images.length === 0) {
      overviewImageEl.hidden = true;
      overviewImageEl.removeAttribute('src');
      overviewImagePh.style.display = 'flex';
      overviewImgCounter.textContent = '00 / 00';
      overviewPrevBtn.hidden = true;
      overviewNextBtn.hidden = true;
      return;
    }

    overviewImagePh.style.display = 'none';
    overviewImageEl.hidden = false;
    overviewImageEl.style.opacity = '0';
    overviewImageEl.src = images[overviewImgIndex];
    overviewImageEl.alt = `${projects[modalIndex].title} — imagem ${overviewImgIndex + 1}`;
    overviewImageEl.onload = () => { overviewImageEl.style.opacity = '1'; };
    overviewImgCounter.textContent =
      String(overviewImgIndex + 1).padStart(2, '0') + ' / ' + String(images.length).padStart(2, '0');

    const hasMultiple = images.length > 1;
    overviewPrevBtn.hidden = !hasMultiple;
    overviewNextBtn.hidden = !hasMultiple;
    if (hasMultiple) {
      overviewPrevBtn.disabled = overviewImgIndex === 0;
      overviewNextBtn.disabled = overviewImgIndex === images.length - 1;
    }
  }

function renderDifficultyStars(difficulty) {
  const starsEl = document.getElementById('overview-stars');
  starsEl.innerHTML = '';
  if (!difficulty) return;

  const level = difficulty.level || 0;
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'difficulty-star' + (i <= level ? ' is-filled' : '');
    star.textContent = i <= level ? '★' : '☆';
    star.tabIndex = 0;
    star.setAttribute('role', 'img');
    star.setAttribute('aria-label', `Nível ${i}: ${(difficulty.descriptions && difficulty.descriptions[i]) || ''}`);

    if (difficulty.descriptions && difficulty.descriptions[i]) {
      const tooltip = document.createElement('span');
      tooltip.className = 'difficulty-star__tooltip';
      tooltip.textContent = difficulty.descriptions[i];
      star.appendChild(tooltip);
    }

    starsEl.appendChild(star);
  }
}

  function buildOverviewLinkBtn(href, label, iconPath) {
    const a = document.createElement('a');
    a.className = 'project-overview__link-btn';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>${label}`;
    return a;
  }

  function renderOverviewLinks(p) {
    const linksEl = document.getElementById('overview-links');
    linksEl.innerHTML = '';

    if (p.github) {
      linksEl.appendChild(buildOverviewLinkBtn(p.github, 'GitHub',
        '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'));
    }
    if (p.youtube) {
      linksEl.appendChild(buildOverviewLinkBtn(p.youtube, 'YouTube',
        '<path d="M22.5 6.2a2.8 2.8 0 0 0-2-2C18.9 3.7 12 3.7 12 3.7s-6.9 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.8 2.8 2.8 0 0 0 2 2c1.6.5 8.5.5 8.5.5s6.9 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.8Z"/><path d="M9.8 15.5V8.5L15.8 12Z"/>'));
    }
  }

  function renderOverview() {
    const p = projects[modalIndex];
    overviewImgIndex = 0; // reinicia o carrossel de imagens ao trocar de projeto

    overviewTitleEl.textContent = p.title;
    overviewTagsEl.innerHTML = p.tags.map(t => `<span class="project__tag">${t}</span>`).join('');
    overviewDescEl.textContent = p.description;
    renderDifficultyStars(p.difficulty);
    renderOverviewLinks(p);

    renderOverviewImage();
  }

  overviewPrevBtn.addEventListener('click', () => {
    if (overviewImgIndex > 0) {
      overviewImgIndex--;
      renderOverviewImage();
    }
  });

  overviewNextBtn.addEventListener('click', () => {
    const images = projects[modalIndex].images || [];
    if (overviewImgIndex < images.length - 1) {
      overviewImgIndex++;
      renderOverviewImage();
    }
  });

  /* ---- GUIA 2: GUIA DO PROJETO (Markdown + PDF) ---- */
  function renderGuideEmpty() {
    guideContentEl.innerHTML = '<p class="project-guide__empty">Guia técnica ainda não disponível para este projeto.</p>';
  }

  function renderGuide() {
    const p = projects[modalIndex];
    const token = ++guideRequestToken; // evita corrida se o projeto mudar durante o fetch

    guidePdfBtn.hidden = true;
    guidePdfBtn.removeAttribute('href');

    if (!p.guideMarkdown) {
      renderGuideEmpty();
    } else if (guideHtmlCache[p.id]) {
      guideContentEl.innerHTML = guideHtmlCache[p.id];
    } else {
      guideContentEl.innerHTML = '<p class="project-guide__loading">Carregando guia...</p>';
      fetch(p.guideMarkdown)
        .then((res) => {
          if (!res.ok) throw new Error('guide not found');
          return res.text();
        })
        .then((md) => loadMarked().then((md2html) => {
          if (token !== guideRequestToken) return; // usuário já trocou de projeto/aba
          const html = md2html(md);
          if (!html) { renderGuideEmpty(); return; }
          guideHtmlCache[p.id] = html;
          guideContentEl.innerHTML = html;
        }))
        .catch(() => {
          if (token !== guideRequestToken) return;
          renderGuideEmpty();
        });
    }

    // Botão de PDF — só aparece se o arquivo realmente existir (degrada
    // com elegância, sem quebrar a interface, caso ainda não exista).
    if (p.guidePdf) {
      fetch(p.guidePdf, { method: 'HEAD' })
        .then((res) => {
          if (token !== guideRequestToken) return;
          if (res.ok) {
            guidePdfBtn.href = p.guidePdf;
            guidePdfBtn.hidden = false;
          }
        })
        .catch(() => { /* sem PDF disponível — botão permanece oculto */ });
    }
  }

  function renderModalContent() {
    updateNavState();
    renderOverview();
    if (activeTab === 'guide') renderGuide();
  }

  function switchTab(tab) {
    const isOverview = tab === 'overview';
    activeTab = tab;
    tabOverviewBtn.classList.toggle('is-active', isOverview);
    tabGuideBtn.classList.toggle('is-active', !isOverview);
    tabOverviewBtn.setAttribute('aria-selected', String(isOverview));
    tabGuideBtn.setAttribute('aria-selected', String(!isOverview));
    panelOverview.hidden = !isOverview;
    panelGuide.hidden = isOverview;
    if (!isOverview) renderGuide(); // lazy: só busca o Markdown quando a guia é aberta
  }

  function navigateModal(delta) {
    const next = modalIndex + delta;
    if (next < 0 || next >= projects.length) return;
    if (location.pathname !== projectPath(next)) {
      history.pushState({ depth: currentDepth() + 1, landed: !!(history.state && history.state.landed) }, '', projectPath(next));
    }
    goToProject(next);
  }

  function goToProject(next) {
    // Só o conteúdo interno faz a transição — o modal em si não reabre.
    const activePanel = activeTab === 'overview'
      ? panelOverview.querySelector('.project-overview')
      : panelGuide.querySelector('.project-guide');

    if (activePanel) activePanel.style.opacity = '0';

    setTimeout(() => {
      modalIndex = next;
      renderModalContent();
      if (activePanel) {
        requestAnimationFrame(() => { activePanel.style.opacity = '1'; });
      }
    }, 150);
  }

  function getFocusableEls() {
    return Array.from(
      box.querySelectorAll('button:not([hidden]), a[href]:not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])')
    ).filter((el) => !el.disabled && el.offsetParent !== null);
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeProjectModal();
      return;
    }
    if (e.key === 'ArrowLeft') { navigateModal(-1); return; }
    if (e.key === 'ArrowRight') { navigateModal(1); return; }

    if (e.key === 'Tab') {
      // Prende o foco dentro do modal enquanto ele estiver aberto
      const focusable = getFocusableEls();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Abertura pelo usuário: mostra o modal e empilha /projetos/<id>.
  function openProjectModal(idx) {
    if (closing || modal.classList.contains('open')) return; // já aberto ou fechando: não empilha outra entrada
    showProjectModal(idx);
    history.pushState({ depth: 1 }, '', projectPath(idx));
  }

  function showProjectModal(idx) {
    clearTimeout(hideTimer);
    closing = false;
    modalIndex = idx;
    switchTab('overview');
    renderModalContent();

    lastFocusedEl = document.activeElement;
    lockPageScrollForModal();

    // Pausa o autoplay do carrossel principal enquanto o modal está aberto
    if (progressTimer) {
      cancelAnimationFrame(progressTimer);
      progressTimer = null;
    }

    modal.hidden = false;
    void modal.offsetWidth; // força reflow para a transição de abertura rodar
    modal.classList.add('open');

    document.addEventListener('keydown', handleModalKeydown);
    btnClose.focus();
  }

  // Fechamento pelo usuário: desfaz as entradas empilhadas pelo modal (o
  // popstate fecha de fato). Sem entradas (acesso direto), troca a URL por "/".
  function closeProjectModal() {
    if (closing || modal.hidden) return;
    const depth = currentDepth();
    if (depth > 0) {
      closing = true;
      closeToHome = !!(history.state && history.state.landed);
      history.go(-depth);
    } else {
      history.replaceState(null, '', '/');
      hideProjectModal();
    }
  }

  function hideProjectModal() {
    modal.classList.remove('open');
    document.removeEventListener('keydown', handleModalKeydown);
    unlockPageScrollForModal();

    // Retoma o autoplay do carrossel principal exatamente de onde estava
    resetTimer();

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      modal.hidden = true;
      closing = false;
      if (lastFocusedEl) lastFocusedEl.focus();
    }, TRANSITION_MS);
  }

  // Sincroniza o modal com a URL (Voltar/Avançar e carga inicial).
  function syncModalWithLocation() {
    if (closeToHome) { // chegou na entrada de acesso direto: troca por "/" e fecha
      closeToHome = false;
      history.replaceState(null, '', '/');
      hideProjectModal();
      return;
    }
    const idx = indexFromLocation();
    const isOpen = !modal.hidden && modal.classList.contains('open');
    if (idx < 0) {
      if (isOpen) hideProjectModal();
    } else if (!isOpen) {
      showProjectModal(idx);
    } else if (idx !== modalIndex) {
      goToProject(idx);
    }
  }

  window.addEventListener('popstate', syncModalWithLocation);

  // Acesso direto a /projetos/<slug>: abre o projeto; slug desconhecido volta a "/".
  if (location.pathname.indexOf(ROUTE_PREFIX) === 0) {
    if (indexFromLocation() >= 0) {
      if (!history.state) history.replaceState({ depth: 0, landed: true }, '', location.pathname);
      syncModalWithLocation();
    }
    else history.replaceState(null, '', '/');
  }

  btnPrev.addEventListener('click', () => navigateModal(-1));
  btnNext.addEventListener('click', () => navigateModal(1));
  btnClose.addEventListener('click', closeProjectModal);
  backdrop.addEventListener('click', closeProjectModal);
  box.addEventListener('click', (e) => e.stopPropagation());

  tabOverviewBtn.addEventListener('click', () => switchTab('overview'));
  tabGuideBtn.addEventListener('click', () => switchTab('guide'));

  // Título e imagem em destaque do carrossel principal são os dois
  // gatilhos de abertura — mesma função, sem lógica duplicada.
  function bindProjectModalTrigger(el, label) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', label);
    el.addEventListener('click', () => openProjectModal(currentProject));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(currentProject);
      }
    });
  }

  bindProjectModalTrigger(titleEl, 'Ver detalhes completos do projeto');
  bindProjectModalTrigger(featImg, 'Ver detalhes completos do projeto');
})();
})();
