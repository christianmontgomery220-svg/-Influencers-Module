/**
 * Influencers Module – module.js
 *
 * Core logic:
 *  - Loads bilingual content from content.json
 *  - Displays automatic opening message on first access (localStorage)
 *  - Renders module sections and navigation
 *  - Enforces depth limits (no therapeutic / clinical / legal advice)
 *  - Integrates with the framework as a declared informational focus module
 */

'use strict';

/* ── Constants ─────────────────────────────────────────── */
const STORAGE_KEY_ACKNOWLEDGED = 'influencers_module_acknowledged';
const STORAGE_KEY_LANG         = 'influencers_module_lang';
const DEFAULT_LANG             = 'en';

/* ── Module State ──────────────────────────────────────── */
const state = {
  lang:    DEFAULT_LANG,
  content: null,
  activeSection: null,
};

/* ── Helpers ───────────────────────────────────────────── */

/**
 * Safely read from localStorage without throwing.
 * @param {string} key
 * @returns {string|null}
 */
function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

/**
 * Safely write to localStorage without throwing.
 * @param {string} key
 * @param {string} value
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    /* storage unavailable – fail silently */
  }
}

/**
 * Escape a string for safe insertion into HTML text content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Opening Modal ─────────────────────────────────────── */

/**
 * Render and (optionally) show the automatic opening message modal.
 * The modal is shown only on first access (determined by localStorage).
 * @param {object} content – parsed content.json
 */
function initOpeningModal(content) {
  const overlay = document.getElementById('opening-modal-overlay');
  const title   = document.getElementById('modal-title');
  const body    = document.getElementById('modal-body');
  const limitsEl= document.getElementById('modal-limits-list');
  const btnAck  = document.getElementById('btn-acknowledge');

  if (!overlay || !title || !body || !limitsEl || !btnAck) return;

  const lang  = state.lang;
  const msg   = content.openingMessage[lang];
  const lim   = content.limits[lang];

  /* Populate text */
  title.textContent = msg.title;
  body.textContent  = msg.body;
  btnAck.textContent = msg.acknowledge;

  limitsEl.innerHTML = lim.items
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');

  btnAck.addEventListener('click', function () {
    storageSet(STORAGE_KEY_ACKNOWLEDGED, 'true');
    overlay.classList.add('hidden');
  });

  /* Show modal only on first access */
  const alreadyAcknowledged = storageGet(STORAGE_KEY_ACKNOWLEDGED) === 'true';
  if (!alreadyAcknowledged) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

/* ── Language Switcher ─────────────────────────────────── */

/**
 * Initialise language buttons and persist the user's preference.
 * @param {object} content – parsed content.json
 */
function initLangSwitcher(content) {
  const btnPt = document.getElementById('btn-lang-pt');
  const btnEn = document.getElementById('btn-lang-en');
  if (!btnPt || !btnEn) return;

  function setLang(lang) {
    state.lang = lang;
    storageSet(STORAGE_KEY_LANG, lang);
    btnPt.classList.toggle('active', lang === 'pt');
    btnEn.classList.toggle('active', lang === 'en');
    renderModule(content);
  }

  btnPt.addEventListener('click', () => setLang('pt'));
  btnEn.addEventListener('click', () => setLang('en'));

  /* Apply persisted preference */
  const saved = storageGet(STORAGE_KEY_LANG);
  if (saved === 'pt' || saved === 'en') {
    state.lang = saved;
    btnPt.classList.toggle('active', state.lang === 'pt');
    btnEn.classList.toggle('active', state.lang === 'en');
  }
}

/* ── Section Navigation ────────────────────────────────── */

/**
 * Build the section navigation bar.
 * @param {Array}  sections – from content.json
 * @param {string} lang
 */
function renderSectionNav(sections, lang) {
  const nav = document.getElementById('section-nav');
  if (!nav) return;

  nav.innerHTML = sections
    .map((sec, i) => {
      const label = escapeHtml(sec[lang].title);
      return `<button class="section-nav-btn${i === 0 ? ' active' : ''}"
                       data-section="${escapeHtml(sec.id)}"
                       aria-controls="section-${escapeHtml(sec.id)}"
                       aria-selected="${i === 0 ? 'true' : 'false'}">${label}</button>`;
    })
    .join('');

  nav.querySelectorAll('.section-nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      activateSection(this.dataset.section, nav);
    });
  });
}

/**
 * Activate a content section by id.
 * @param {string} sectionId
 * @param {HTMLElement} nav
 */
function activateSection(sectionId, nav) {
  state.activeSection = sectionId;

  /* Update nav buttons */
  (nav || document.getElementById('section-nav'))
    .querySelectorAll('.section-nav-btn')
    .forEach(btn => {
      const active = btn.dataset.section === sectionId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

  /* Show / hide content panels */
  document.querySelectorAll('.content-section').forEach(panel => {
    panel.classList.toggle('active', panel.id === `section-${sectionId}`);
  });
}

/* ── Content Renderer ──────────────────────────────────── */

/**
 * Render all module content in the current language.
 * @param {object} content – parsed content.json
 */
function renderModule(content) {
  const lang = state.lang;

  /* Hero */
  const heroTitle = document.getElementById('hero-title');
  const heroDesc  = document.getElementById('hero-desc');
  if (heroTitle) heroTitle.textContent = content.openingMessage[lang].title;
  if (heroDesc)  heroDesc.textContent  = content.openingMessage[lang].body;

  /* Limits banner */
  const limTitle = document.getElementById('limits-title');
  const limList  = document.getElementById('limits-list');
  if (limTitle) limTitle.textContent = content.limits[lang].title;
  if (limList)  limList.innerHTML    = content.limits[lang].items
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');

  /* Section nav */
  renderSectionNav(content.sections, lang);

  /* Content panels */
  const container = document.getElementById('sections-container');
  if (container) {
    container.innerHTML = content.sections
      .map((sec, i) => buildSectionPanel(sec, lang, i === 0))
      .join('');
  }

  /* Framework integration card */
  const fwTitle = document.getElementById('fw-title');
  const fwText  = document.getElementById('fw-text');
  const fw      = content.frameworkIntegration[lang];
  if (fwTitle) fwTitle.textContent = fw.title;
  if (fwText)  fwText.textContent  = fw.text;

  /* Restore active section after re-render */
  const active = state.activeSection || (content.sections[0] && content.sections[0].id);
  if (active) activateSection(active, document.getElementById('section-nav'));

  /* Update opening modal text in-place (for language switch) */
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');
  const modalLims  = document.getElementById('modal-limits-list');
  const btnAck     = document.getElementById('btn-acknowledge');
  const msg        = content.openingMessage[lang];
  const lim        = content.limits[lang];
  if (modalTitle) modalTitle.textContent = msg.title;
  if (modalBody)  modalBody.textContent  = msg.body;
  if (btnAck)     btnAck.textContent     = msg.acknowledge;
  if (modalLims)  modalLims.innerHTML    = lim.items
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');
}

/**
 * Build HTML for a single content section panel.
 * @param {object}  section
 * @param {string}  lang
 * @param {boolean} isFirst
 * @returns {string} HTML string
 */
function buildSectionPanel(section, lang, isFirst) {
  const data = section[lang];
  const cards = data.guidelines
    .map(g => `
      <article class="guideline-card">
        <h3>${escapeHtml(g.heading)}</h3>
        <p>${escapeHtml(g.text)}</p>
      </article>`)
    .join('');

  return `
    <section id="section-${escapeHtml(section.id)}"
             class="content-section${isFirst ? ' active' : ''}"
             aria-label="${escapeHtml(data.title)}">
      <div class="section-header">
        <h2>${escapeHtml(data.title)}</h2>
        <p>${escapeHtml(data.description)}</p>
      </div>
      <div class="guidelines-grid">${cards}</div>
    </section>`;
}

/* ── Framework Integration Hook ────────────────────────── */

/**
 * Register this module with the parent framework if it is available.
 * The framework is expected to expose a global `FrameworkBlueprint` object.
 */
function registerWithFramework() {
  if (typeof window === 'undefined') return;

  const blueprint = window.FrameworkBlueprint;
  if (!blueprint || typeof blueprint.registerModule !== 'function') return;

  blueprint.registerModule({
    id:       'influencers-module',
    position: 'before-step-3',
    type:     'informational',
    version:  '1.0.0',
    limits: {
      therapeuticCounseling: false,
      psychologicalDiagnosis: false,
      clinicalGuidance: false,
    },
  });
}

/* ── Initialisation ────────────────────────────────────── */

/**
 * Bootstrap the module.
 * Fetches content.json, then wires up all components.
 */
async function init() {
  /* Resolve persisted language */
  const saved = storageGet(STORAGE_KEY_LANG);
  if (saved === 'pt' || saved === 'en') {
    state.lang = saved;
  }

  /* Load content */
  let content;
  try {
    const res = await fetch('content.json');
    if (!res.ok) throw new Error(`Failed to load content.json: ${res.status}`);
    content = await res.json();
  } catch (err) {
    console.error('[InfluencersModule] Content load error:', err);
    const root = document.getElementById('sections-container');
    if (root) {
      root.innerHTML =
        '<p class="load-error">Unable to load module content. Please check your connection and try again.</p>';
    }
    return;
  }

  state.content = content;

  /* Wire up components */
  initLangSwitcher(content);
  initOpeningModal(content);
  renderModule(content);
  registerWithFramework();
}

/* Start when the DOM is ready (browser only) */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

/* Expose for testing environments */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, storageGet, storageSet, buildSectionPanel };
}
