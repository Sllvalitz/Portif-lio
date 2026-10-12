/* ═══════════════════════════════════════════════════════════
   PROJECTS — projects.js
   Carrossel da seção e modal (Visão Geral + Guia em Markdown/PDF).
   Os dados dos projetos ficam em data/projects.json (veja o campo-a-campo
   no bloco "PROJECTS CAROUSEL" abaixo). Tudo dentro de uma IIFE assíncrona:
   nada vaza para window, e todo o resto só roda depois que o JSON carrega.
════════════════════════════════════════════════════════════ */

(async function () {

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

/* ---- Utilitários compartilhados pelos dois modais (projeto e artigo) ---- */
let scrollLockY = 0;

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

// Prende o foco (Tab / Shift+Tab) dentro de `box` enquanto o modal estiver aberto
function trapTab(e, box) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(
    box.querySelectorAll('button:not([hidden]), a[href]:not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])')
  ).filter((el) => !el.disabled && el.offsetParent !== null);
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

// ---- PROJECTS CAROUSEL ----
/* Dados: data/projects.json (array). Para cadastrar um projeto, acrescente um objeto:
     id             (obrigatório) slug único — vira a URL /projetos/<id>; não mude depois de publicado
     title          (obrigatório) título
     tags           (obrigatório) array de strings (alimentam os filtros; lógica OU)
     description    texto da visão geral
     thumb_url      miniatura/imagem de destaque ('' = placeholder)
     images         array de caminhos para o carrossel de imagens do modal
     guideMarkdown  caminho do guia .md (aba "Guia do Projeto"); '' = sem guia
     guidePdf       caminho do PDF do guia (o botão só aparece se o arquivo existir)
     github, youtube  links externos ('' = botão oculto)
     difficulty     { level: 1-5, descriptions: { "1": '...', ... } }
   O caminho do JSON é relativo ao <base href="/"> do index.html: funciona em /, /projetos/<id>... */
const PROJECTS_URL = 'data/projects.json';
let projectsFailed = false;

function validateProjects(data) {
  if (!Array.isArray(data)) throw new Error(`${PROJECTS_URL}: o conteúdo deve ser um array de projetos`);
  const seen = new Set();
  data.forEach((p, i) => {
    if (!p || typeof p.id !== 'string' || !p.id) throw new Error(`${PROJECTS_URL}: item ${i} sem "id" (string)`);
    if (typeof p.title !== 'string') throw new Error(`${PROJECTS_URL}: projeto "${p.id}" sem "title" (string)`);
    if (!Array.isArray(p.tags)) throw new Error(`${PROJECTS_URL}: projeto "${p.id}" sem "tags" (array)`);
    if (seen.has(p.id)) console.warn('[projetos] id duplicado:', p.id); // o deep link usa o primeiro
    if (!/^[A-Za-z0-9._~-]+$/.test(p.id)) console.warn('[projetos] id fora do padrão de URL (use letras, números, - . _ ~):', p.id); // vira /projetos/<id>
    seen.add(p.id);
  });
}

// Em caso de falha devolve [] (a seção mostra um aviso; os artigos continuam funcionando).
const projects = await (async () => {
  try {
    const res = await fetch(PROJECTS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${PROJECTS_URL}`);
    const data = await res.json();
    validateProjects(data);
    return data;
  } catch (err) {
    console.error('[projetos] Falha ao carregar ou validar os dados:', err);
    projectsFailed = true;
    return [];
  }
})();

let currentProject = 0;                         // índice REAL em `projects` (o modal e as URLs usam o mesmo)
let visible = projects.map((_, i) => i);        // índices reais que passam no filtro de tags
let thumbWindowStart = 0;                       // posição dentro de `visible`
let projectsViewActive = true;                  // false: aba Artigos aberta / leitura / sem resultados
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
  return Math.min(getThumbWindowSize(), visible.length);
}

const posOf = (idx) => visible.indexOf(idx);

// Reposiciona a janela só o necessário para manter o projeto
// selecionado visível — não move se ele já estiver dentro dela.
function updateThumbWindow(selectedPos) {
  const visibleCount = getVisibleThumbCount();
  const maxStart = Math.max(0, visible.length - visibleCount);

  if (selectedPos < thumbWindowStart) {
    thumbWindowStart = selectedPos;
  } else if (selectedPos > thumbWindowStart + visibleCount - 1) {
    thumbWindowStart = selectedPos - visibleCount + 1;
  }

  thumbWindowStart = Math.min(Math.max(thumbWindowStart, 0), maxStart);
}

function buildThumbs() {
  thumbContainer.innerHTML = '';
  const visibleCount = getVisibleThumbCount();

  for (let localIndex = 0; localIndex < visibleCount; localIndex++) {
    const realIndex = visible[thumbWindowStart + localIndex];
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
    carouselCounterEl.textContent = visible.length
      ? String(posOf(currentProject) + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0')
      : '00 / 00';
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
  updateThumbWindow(Math.max(0, posOf(idx)));

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
  if (reduceMotion || !projectsViewActive) return; // sem auto-avanço: navegação só manual / aba oculta
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
      stepProject(1);
    }
  }
  progressTimer = requestAnimationFrame(tick);
}

// Avança/recua dentro do conjunto filtrado (circular).
function stepProject(delta) {
  if (!visible.length) return;
  const n = visible.length;
  setProject(visible[(Math.max(0, posOf(currentProject)) + delta + n) % n]);
}

prevBtn.addEventListener('click', () => stepProject(-1));
nextBtn.addEventListener('click', () => stepProject(1));

window.addEventListener('resize', () => {
  updateThumbWindow(Math.max(0, posOf(currentProject)));
  buildThumbs();
});

/* ---- FILTRO POR TAGS (chamado pela barra de controles, mais abaixo) ----
   Lógica OU: passa quem tiver ao menos uma das tags selecionadas. Se o projeto
   atual sai do conjunto, o primeiro resultado válido é selecionado. Devolve a
   quantidade de resultados. */
function applyProjectFilter(selected) {
  visible = projects.reduce((acc, p, i) => {
    if (selected.size === 0 || p.tags.some((t) => selected.has(t))) acc.push(i);
    return acc;
  }, []);

  if (visible.length === 0) {
    buildThumbs();
    updateCarouselNavState();
  } else if (posOf(currentProject) < 0) {
    setProject(visible[0]);
  } else {
    updateThumbWindow(posOf(currentProject));
    buildThumbs();
    updateCarouselNavState();
  }
  return visible.length;
}

// Pausa/retoma o auto-avanço quando a aba Projetos some/volta (Artigos, leitura, sem resultados).
function setProjectsViewActive(active) {
  if (projectsViewActive === active) return;
  projectsViewActive = active;
  if (!active) {
    if (progressTimer) { cancelAnimationFrame(progressTimer); progressTimer = null; }
  } else {
    resetTimer();
  }
}

if (projects.length) setProject(0, false);

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
  const NOT_FOUND_URL = '/404.html'; // página 404 do site (a mesma que o host serve para rotas inexistentes)
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

  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeProjectModal();
      return;
    }
    if (e.key === 'ArrowLeft') { navigateModal(-1); return; }
    if (e.key === 'ArrowRight') { navigateModal(1); return; }


    trapTab(e, box); // prende o foco dentro do modal enquanto ele estiver aberto
  }

  // Abertura pelo usuário: mostra o modal e empilha /projetos/<id>.
  function openProjectModal(idx) {
    if (!projects[idx] || closing || modal.classList.contains('open')) return; // sem dados, já aberto ou fechando: não empilha outra entrada
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

  // Acesso direto a /projetos/<slug>: abre o projeto; slug desconhecido mostra a página 404.
  // (O host reescreve qualquer /projetos/<slug> para o index.html, então só o JS sabe se o slug existe.)
  if (location.pathname.indexOf(ROUTE_PREFIX) === 0) {
    if (indexFromLocation() >= 0) {
      if (!history.state) history.replaceState({ depth: 0, landed: true }, '', location.pathname);
      syncModalWithLocation();
    }
    // replace: a URL inválida não fica no histórico (o Voltar não cai nela de novo).
    // Com falha de carga dos dados não dá para saber se o slug existe: a URL é mantida (um F5 tenta de novo).
    else if (!projectsFailed) location.replace(NOT_FOUND_URL);
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
// ---- BARRA DE CONTROLES (abas Projetos/Artigos + filtros por tag) E ARTIGOS ----
// Reutiliza o array `projects` (via applyProjectFilter). As publicações vêm de
// js/articles.js (dados separados) e sempre apontam para uma publicação EXTERNA.
(function () {
  // Preenchido quando data/articles.json termina de carregar (ver "CARGA DOS DADOS" no fim do bloco).
  let ARTICLES = [];
  let articlesFailed = false;

  const section = document.getElementById('projects');
  const controlsEl = document.getElementById('browse-controls');
  const tabBtns = Array.from(controlsEl.querySelectorAll('[role="tab"]'));
  const countEl = document.getElementById('browse-count');
  const filtersEl = document.getElementById('browse-filters');
  const chipsEl = document.getElementById('browse-chips');
  const moreBtn = document.getElementById('browse-more');
  const menuEl = document.getElementById('browse-menu');
  const panels = {
    projects: document.getElementById('browse-panel-projects'),
    articles: document.getElementById('browse-panel-articles')
  };
  const listEl = document.getElementById('articles-list');
  const emptyEl = document.getElementById('browse-empty');
  const emptyResetBtn = document.getElementById('browse-empty-reset');
  const emptyTextEl = emptyEl.querySelector('.browse-empty__text');
  const EMPTY_TEXT = emptyTextEl.textContent;
  const hintEl = section.querySelector('.section-header__hint');

  const state = {
    tab: 'projects',
    // tags (projetos) / palavras-chave (artigos); preservadas ao trocar de aba/abrir artigo
    selected: { projects: new Set(), articles: new Set() },
    category: null, // aba Artigos: seleção única (null = todas)
    menuOpen: false
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const dataFor = (tab) => (tab === 'projects' ? projects : ARTICLES);
  // projetos usam `tags`; publicações usam `keywords` (sistemas independentes)
  const tagsOf = (tab, item) => (tab === 'projects' ? item.tags : item.keywords) || [];
  const matchesTags = (tab, item, sel) => sel.size === 0 || tagsOf(tab, item).some((t) => sel.has(t)); // OU
  const uniqueTags = (tab) => Array.from(new Set(dataFor(tab).flatMap((i) => tagsOf(tab, i))));

  // Categorias derivadas de TODAS as publicações cadastradas (independe dos filtros ativos).
  // Com menos de duas categorias o filtro de categorias (e a barra vertical) não aparece.
  function availableCategories() {
    const all = window.PORTFOLIO_PUBLICATION_CATEGORIES || [];
    const present = all.filter((c) => ARTICLES.some((a) => a.category === c.id));
    return present.length >= 2 ? present : [];
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---- LINK DA PUBLICAÇÃO ----
     Todo card real aponta para a publicação original (`publicationUrl`: periódico,
     repositório, anais...), aberta em nova aba. URL ausente/inválida → card sem link.
     O artigo demonstrativo (`demo: true`) nunca vira link. */
  function safeExternalUrl(u) {
    if (typeof u !== 'string') return null;
    try {
      const x = new URL(u.trim());
      return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null;
    } catch (e) { return null; } // relativa, vazia ou inválida: não é uma URL externa real
  }

  const publicationLink = (a) => (a.demo ? null : safeExternalUrl(a.publicationUrl));

  // ids de publicações devem ser únicos (chamada após o carregamento dos dados)
  function warnDuplicateIds() {
    const seen = new Set();
    ARTICLES.forEach((a) => {
      if (seen.has(a.id)) console.warn('[artigos] id duplicado:', a.id);
      seen.add(a.id);
    });
  }

  /* ---- CHIPS ----
     Aba Artigos:  [categorias] | [Todas as tags] [palavras-chave…] [+ FILTROS]
     Aba Projetos: [Todas as tags] [tags…] [+ FILTROS]
     Tudo no mesmo container flex. No desktop cabe em UMA linha; em telas pequenas
     pode quebrar em até 3. O que não cabe nesse limite vai para o menu "+ Filtros". */
  function buildChip(label, key, pressed, onClick, group) {
    const b = el('button', 'browse-chip', label);
    b.type = 'button';
    b.dataset.key = key;
    b.dataset.group = group; // 'cat' | 'all' | 'kw'
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', onClick);
    return b;
  }

  const toggleTag = (tag) => () => {
    const sel = state.selected[state.tab];
    if (sel.has(tag)) sel.delete(tag); else sel.add(tag);
    update();
  };

  function applyMenuState() {
    menuEl.hidden = !state.menuOpen || moreBtn.hidden;
    moreBtn.setAttribute('aria-expanded', String(!menuEl.hidden));
  }

  function closeMenu(refocus) {
    if (!state.menuOpen) return;
    state.menuOpen = false;
    applyMenuState();
    if (refocus) moreBtn.focus();
  }

  const maxChipRows = () => (window.matchMedia('(max-width: 900px)').matches ? 3 : 1);

  // Linhas ocupadas pelos elementos visíveis (agrupa por offsetTop, com tolerância)
  function countRows(els) {
    const tops = els.map((e) => e.offsetTop).sort((x, y) => x - y);
    let rows = 0;
    let last = -Infinity;
    tops.forEach((t) => { if (t - last > 6) { rows++; last = t; } });
    return rows;
  }

  // Esconde (do fim para o começo) as palavras-chave que passam do limite de linhas
  // e as move para o menu "+ Filtros". Categorias e "Todas as tags" nunca saem da barra.
  function layoutChips() {
    const sel = state.selected[state.tab];
    const kids = Array.from(chipsEl.children).filter((k) => k !== moreBtn);
    const kw = kids.filter((k) => k.dataset.group === 'kw');
    const visibleNow = () => Array.from(chipsEl.children).filter((k) => !k.hidden);
    const limit = maxChipRows();

    kids.forEach((k) => { k.hidden = false; });
    moreBtn.hidden = true;

    const overflow = [];
    if (countRows(visibleNow()) > limit) {
      moreBtn.hidden = false;
      moreBtn.textContent = '+ Filtros · 9'; // rótulo mais largo possível, para medir
      for (let i = kw.length - 1; i >= 0; i--) {
        kw[i].hidden = true;
        overflow.unshift(kw[i].dataset.key);
        if (countRows(visibleNow()) <= limit) break;
      }
    }

    menuEl.replaceChildren(...overflow.map((t) => buildChip(t, t, sel.has(t), toggleTag(t), 'kw')));
    const hiddenActive = overflow.filter((t) => sel.has(t)).length;
    moreBtn.textContent = '+ Filtros' + (hiddenActive ? ' · ' + hiddenActive : '');
    moreBtn.hidden = overflow.length === 0;
    if (moreBtn.hidden) state.menuOpen = false;
    applyMenuState();
  }

  function renderChips() {
    const tab = state.tab;
    const sel = state.selected[tab];
    const cats = tab === 'articles' ? availableCategories() : [];
    if (state.category && !cats.some((c) => c.id === state.category)) state.category = null;

    // o re-render troca os botões: devolve o foco ao mesmo chip (teclado)
    const active = document.activeElement;
    const focusKey = active === moreBtn ? '__more__'
      : (chipsEl.contains(active) || menuEl.contains(active)) ? active.dataset.key : null;

    const nodes = cats.map((c) => buildChip(c.label, 'cat:' + c.id, state.category === c.id, () => {
      state.category = state.category === c.id ? null : c.id; // seleção única; clicar de novo desmarca
      update();
    }, 'cat'));
    if (cats.length) {
      const sep = el('span', 'browse-sep');
      sep.setAttribute('role', 'separator');
      sep.setAttribute('aria-orientation', 'vertical');
      nodes.push(sep);
    }
    // "Todas as tags" limpa só as palavras-chave (a categoria é preservada)
    nodes.push(buildChip('Todas as tags', '__all__', sel.size === 0, () => { sel.clear(); update(); }, 'all'));
    uniqueTags(tab).forEach((t) => nodes.push(buildChip(t, t, sel.has(t), toggleTag(t), 'kw')));

    chipsEl.replaceChildren(...nodes, moreBtn);
    filtersEl.setAttribute('aria-label', cats.length ? 'Filtrar por categoria e palavras-chave' : 'Filtrar por tags');
    layoutChips();

    if (focusKey !== null) {
      const pool = Array.from(chipsEl.children).filter((c) => !c.hidden && c.dataset.key).concat(Array.from(menuEl.children));
      const target = focusKey === '__more__' ? (moreBtn.hidden ? null : moreBtn) : pool.find((c) => c.dataset.key === focusKey);
      (target || (moreBtn.hidden ? chipsEl.querySelector('[data-key="__all__"]') : moreBtn)).focus({ preventScroll: true });
    }
  }

  moreBtn.addEventListener('click', () => {
    state.menuOpen = !state.menuOpen;
    applyMenuState();
  });

  filtersEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.menuOpen) { e.preventDefault(); closeMenu(true); }
  });
  filtersEl.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !filtersEl.contains(e.relatedTarget)) closeMenu(false);
  });
  // composedPath() vale mesmo quando o chip clicado já foi substituído pelo re-render
  document.addEventListener('click', (e) => {
    if (state.menuOpen && !e.composedPath().includes(filtersEl)) closeMenu(false);
  });

  if (window.ResizeObserver) new ResizeObserver(() => layoutChips()).observe(filtersEl);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutChips);

  /* ---- ATUALIZAÇÃO GERAL (aba + filtros → painéis, contador, estado vazio) ----
     Os painéis só ficam inativos (nunca somem do layout no desktop): o cabeçalho
     e os controles não mudam de posição ao trocar de aba. */
  function setPanelActive(panel, active) {
    panel.classList.toggle('is-inactive', !active);
    panel.toggleAttribute('inert', !active);
  }

  function update() {
    const tab = state.tab;
    const sel = state.selected[tab];
    let count;

    if (tab === 'projects') {
      count = applyProjectFilter(sel);
    } else {
      const items = ARTICLES.filter((a) =>
        (!state.category || a.category === state.category) && matchesTags('articles', a, sel)); // categoria E (kw OU kw)
      renderArticleList(items);
      count = items.length;
    }

    renderChips();
    countEl.textContent = pad2(count) + (count === 1 ? ' resultado' : ' resultados');
    setPanelActive(panels.projects, tab === 'projects' && count > 0);
    setPanelActive(panels.articles, tab === 'articles' && count > 0);
    // Falha ao carregar os dados (data/projects.json / data/articles.json): mensagem própria no lugar do "nenhum resultado"
    const loadFailed = tab === 'projects' ? projectsFailed : (articlesFailed && ARTICLES.length === 0);
    emptyTextEl.textContent = loadFailed
      ? '// não foi possível carregar os ' + (tab === 'projects' ? 'projetos' : 'artigos')
      : EMPTY_TEXT;
    emptyResetBtn.hidden = loadFailed;
    emptyEl.hidden = count > 0;
    if (hintEl) hintEl.classList.toggle('is-off', tab !== 'projects'); // visibility: não muda a altura do cabeçalho
    setProjectsViewActive(tab === 'projects' && count > 0);
  }

  emptyResetBtn.addEventListener('click', () => {
    state.selected[state.tab].clear();
    if (state.tab === 'articles') state.category = null;
    update();
    chipsEl.firstElementChild.focus();
  });

  /* ---- ABAS ---- */
  function switchTab(tab, focus) {
    state.tab = tab;
    closeMenu(false);
    tabBtns.forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    update();
  }

  tabBtns.forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  controlsEl.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const i = tabBtns.indexOf(document.activeElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabBtns.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabBtns.length) % tabBtns.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabBtns.length - 1;
    if (next < 0) return;
    e.preventDefault();
    switchTab(tabBtns[next].dataset.tab, true);
  });

  /* ---- LISTAGEM DE ARTIGOS ---- */
  function buildArticleCard(a) {
    const card = el('article', 'article-card');

    // 1ª linha: autores (esquerda) · tipo da produção (direita) — só o que existir
    const top = el('div', 'article-card__top');
    if (a.authors && a.authors.length) top.appendChild(el('p', 'article-card__authors', a.authors.join(', ')));
    if (a.type) top.appendChild(el('p', 'article-card__type', a.type));
    if (top.children.length) card.appendChild(top);

    // Título: link para a publicação externa (nova aba) só quando há URL válida
    const href = publicationLink(a);
    const h = el('h3', 'article-card__title');
    let link;
    if (href) {
      link = el('a', 'article-card__link', a.title);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const ext = el('span', 'article-card__ext', ' ↗'); // indicador visual (leitor de tela usa o texto abaixo)
      ext.setAttribute('aria-hidden', 'true');
      link.append(ext, el('span', 'sr-only', ' (abre a publicação em nova aba)'));
    } else {
      link = el('span', null, a.title); // sem URL válida: nunca vira link
    }
    h.appendChild(link);
    card.appendChild(h);

    if (a.summary) card.appendChild(el('p', 'article-card__summary', a.summary));

    // Metadados compactos (sem rótulos vazios)
    const meta = el('div', 'article-card__meta');
    [['Instituição', a.institution], ['Orientador', a.advisor]].forEach(([label, value]) => {
      if (!value) return;
      const item = el('p', 'article-card__meta-item');
      item.append(el('span', 'article-card__meta-label', label), document.createTextNode(value));
      meta.appendChild(item);
    });
    if (a.demo) meta.appendChild(el('p', 'article-badge', 'Conteúdo fictício de desenvolvimento'));
    else if (!href) meta.appendChild(el('p', 'article-card__status', 'Link da publicação ainda não disponível'));
    if (meta.children.length) card.appendChild(meta);

    // Palavras-chave
    if (a.keywords && a.keywords.length) {
      const kws = el('div', 'project__tags');
      a.keywords.forEach((t) => kws.appendChild(el('span', 'project__tag', t)));
      card.appendChild(kws);
    }
    return card;
  }

  function renderArticleList(items) {
    listEl.replaceChildren(...items.map(buildArticleCard));
  }

  /* ---- INÍCIO ---- */
  switchTab('projects');

  /* ---- CARGA DOS DADOS ----
     js/articles.js busca data/articles.json e expõe PORTFOLIO_ARTICLES_READY (sempre
     resolve). Os projetos não dependem dos artigos, então a aba inicial aparece na hora;
     ao chegar os dados, só re-renderiza se a aba Artigos já estiver aberta (senão o
     update() de switchTab('articles') já usa os dados carregados). */
  Promise.resolve(window.PORTFOLIO_ARTICLES_READY).then(() => {
    ARTICLES = window.PORTFOLIO_ARTICLES || [];
    articlesFailed = Boolean(window.PORTFOLIO_ARTICLES_ERROR);
    warnDuplicateIds();
    if (state.tab === 'articles') update();
  });
})();

})();
