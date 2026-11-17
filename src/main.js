import './styles/base.css';
import './styles/case.css';
import './styles/editions.css';
import './styles/archive.css';
import './styles/shelf.css';
import './styles/stage.css';
import './styles/vi.css';
import './styles/i18n.css';

import { COLLECTION, ERAS } from './data/games.js';
import { localize } from './data/games.fa.js';
import { LANGS, FLAGS, T, getLang, setLang, digits } from './i18n.js';
import { h, pad } from './lib/dom.js';
import { Shelf } from './components/Shelf.js';
import { Caption } from './components/Caption.js';
import { Cursor } from './components/Cursor.js';
import { Lightbox } from './components/Lightbox.js';
import { OpenCase } from './components/OpenCase.js';

const REPO = 'HamzehGhoreyshi/rockstar-gta-history';

/* ---------- state ---------- */
const state = { filter: 'all', currentId: (COLLECTION.find((g) => g.featured) || COLLECTION[0]).id };
const itemsFor = () =>
  (state.filter === 'all' ? COLLECTION : COLLECTION.filter((g) => g.era === state.filter)).map((g) => localize(g, getLang()));

/* ---------- static layout ---------- */
const app = document.getElementById('app');
const txt = (key) => h('span', { 'data-t': key });         // filled by applyTexts()
const countEl = h('span', { class: 'header__count-n' });
const positionEl = h('span', { class: 'nav__pos', 'aria-live': 'off' });
const positionBar = h('span', { class: 'nav__bar-fill' });

const filterBtns = ERAS.map((e) =>
  h('button', {
    class: `filter${e.id === state.filter ? ' is-active' : ''}`,
    'aria-pressed': String(e.id === state.filter),
    'data-era': e.id,
    onclick: () => setFilter(e.id),
  })
);

/* Language switch: flag pill + menu, same as the other projects */
const langFlag = h('span', { class: 'flag' });
const langBtn = h('button', { class: 'lang-btn', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'data-cursor': 'button' },
  langFlag,
  h('span', { class: 'chev', 'aria-hidden': 'true', html: '<svg width="14" height="14" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' })
);
const langItems = Object.keys(LANGS).map((code) =>
  h('button', { class: 'lang-item', type: 'button', 'data-lang': code, lang: code, onclick: () => { langBox.classList.remove('open'); if (code !== getLang()) changeLanguage(code); } },
    h('span', { class: 'flag', html: FLAGS[code] }), h('span', { class: 'ln' }, LANGS[code].native))
);
const langBox = h('div', { class: 'lang' }, langBtn, h('div', { class: 'lang-menu', role: 'menu' }, langItems));
langBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = langBox.classList.toggle('open');
  langBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => { if (!langBox.contains(e.target)) langBox.classList.remove('open'); });

const aboutBody = h('div', { class: 'about__body' });
const aboutDialog = h('dialog', { class: 'about', 'aria-labelledby': 'about-title' },
  h('h2', { id: 'about-title', 'data-t': 'aboutTitle' }),
  aboutBody,
  h('p', { class: 'about__legal', 'data-t': 'aboutLegal' }),
  h('button', { class: 'about__close', 'data-t': 'closeWord', onclick: () => aboutDialog.close() })
);

const filtersNav = h('nav', { class: 'header__filters' }, filterBtns);
const header = h('header', { class: 'header' },
  h('div', { class: 'header__brand' },
    h('span', { class: 'header__logo', lang: 'en' }, 'Grand Theft Archive'),
    h('span', { class: 'header__sub', 'data-t': 'sub' })
  ),
  h('div', { class: 'header__count' }, countEl, txt('countLabel')),
  filtersNav,
  h('div', { class: 'header__tools' },
    h('button', { class: 'header__about', 'data-t': 'about', onclick: () => aboutDialog.showModal() }),
    langBox
  )
);

const shelfRoot = h('main', { class: 'shelf', id: 'shelf', dir: 'ltr' });
const captionRoot = h('div', { class: 'caption' });
const prevBtn = h('button', { class: 'nav__btn', onclick: () => shelf.go(-1) }, h('span', { 'aria-hidden': 'true' }, '←'));
const nextBtn = h('button', { class: 'nav__btn', onclick: () => shelf.go(1) }, h('span', { 'aria-hidden': 'true' }, '→'));
const openBtn = h('button', { class: 'nav__open', onclick: () => openSelected() }, txt('openCase'), h('kbd', {}, 'Enter'));

// The shelf and the timeline always run left → right (chronological), in both languages.
const timeline = h('nav', { class: 'timeline', dir: 'ltr' });
function buildTimeline() {
  timeline.replaceChildren(...shelfItems().map((g, i) =>
    h('button', { class: `timeline__stop timeline__stop--${g.era}`, 'data-id': g.id, title: g.title, 'aria-label': `${g.title}, ${g.year}`, onclick: () => shelf.goToIndex(i) },
      h('span', { class: 'timeline__dot' }), h('span', { class: 'timeline__year' }, digits(g.year)))
  ));
}

const below = h('section', { class: 'below' },
  captionRoot,
  h('div', { class: 'nav', dir: 'ltr' },
    prevBtn,
    h('div', { class: 'nav__track' }, positionEl, h('span', { class: 'nav__bar' }, positionBar)),
    nextBtn,
    openBtn
  )
);

/* Footer: same signature as the other projects — always English, left to right */
const ghIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
const starIcon = '<svg class="star-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.751.751 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
const starCount = h('span', { class: 'star-count', hidden: true });
const starLink = h('a', { href: `https://github.com/${REPO}`, target: '_blank', rel: 'noopener', 'aria-label': 'Star this project on GitHub' },
  h('span', { class: 'ico', html: starIcon }), h('strong', {}, 'Star'), starCount);
const footer = h('footer', { class: 'sig', dir: 'ltr', lang: 'en' },
  h('a', { class: 'start', href: 'https://hamzeh.framer.ai/?utm_source=rockstar-gta-history&utm_medium=referral', target: '_blank', rel: 'noopener' }, '© 2026 ', h('strong', {}, 'Hamzeh')),
  h('span', { class: 'mid' }, 'Powered by ', h('a', { href: 'https://claude.ai', target: '_blank', rel: 'noopener' }, h('strong', {}, 'Claude'))),
  h('span', { class: 'end' },
    h('a', { href: `https://github.com/${REPO}`, target: '_blank', rel: 'noopener', 'aria-label': 'Source code on GitHub, by HamzehGhoreyshi' },
      h('span', { class: 'ico', html: ghIcon }), h('strong', {}, 'HamzehGhoreyshi')),
    h('span', { class: 'dot', 'aria-hidden': 'true' }, '·'),
    starLink
  )
);

const ambient = h('div', { class: 'ambient', 'aria-hidden': 'true' },
  h('div', { class: 'ambient__sun' }), h('div', { class: 'ambient__haze' }), h('div', { class: 'ambient__grid' }));
const grain = h('div', { class: 'grain', 'aria-hidden': 'true' });

app.append(ambient, header, shelfRoot, below, timeline, footer, grain, aboutDialog);

/* ---------- components ---------- */
const cursor = new Cursor();
const lightbox = new Lightbox();
const caption = new Caption(captionRoot);
const stage = new OpenCase({
  lightbox,
  onClosed: () => {
    shelf.locked = false;
    shelf.track.focus({ preventScroll: true });
  },
});

const preloaded = new Set();
function preload(game) {
  if (preloaded.has(game.id)) return;
  preloaded.add(game.id);
  [game.coverFront, game.innerArtwork, game.logo, ...(game.screenshots || []).slice(0, 4).map((a) => a.thumb), ...(game.promotionalAssets || []).slice(0, 4).map((a) => a.thumb)]
    .filter(Boolean)
    .forEach((src) => { const i = new Image(); i.decoding = 'async'; i.src = src; });
}

let preloadTimer;
const shelf = new Shelf(shelfRoot, {
  onSelect(game, index, total) {
    state.currentId = game.id;
    caption.show(game, index, total);
    positionEl.textContent = digits(`${game.year} · ${pad(index + 1)}/${pad(total)}`);
    timeline.querySelectorAll('.timeline__stop').forEach((b) => {
      const on = b.dataset.id === game.id;
      b.classList.toggle('is-active', on);
      // Keep the current year in view when the timeline scrolls (phones).
      if (on && timeline.scrollWidth > timeline.clientWidth) {
        timeline.scrollTo({ left: b.offsetLeft - timeline.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
      }
    });
    positionBar.style.transform = `scaleX(${(index + 1) / total})`;
    document.documentElement.dataset.theme = game.specialPresentation ? 'vi' : 'default';
    document.documentElement.style.setProperty('--ambient', game.spine?.accent || '#ff4fa3');
    clearTimeout(preloadTimer);
    preloadTimer = setTimeout(() => preload(game), 220);
  },
  onOpen: () => openSelected(),
  onHoverState: (s) => cursor.setFromShelf(s),
});
const shelfItems = () => shelf.items;

/** Write every interface string for the current language. */
function applyTexts() {
  const t = T();
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t]; });
  filterBtns.forEach((b) => { b.textContent = t.eras[b.dataset.era]; });
  filtersNav.setAttribute('aria-label', t.eraFilter);
  aboutBody.replaceChildren(...t.aboutBody.map((p) => h('p', {}, p)));
  prevBtn.setAttribute('aria-label', t.prev);
  nextBtn.setAttribute('aria-label', t.next);
  timeline.setAttribute('aria-label', t.jumpYear);
  shelf.track.setAttribute('aria-label', t.collection);
  langBtn.setAttribute('aria-label', t.language);
  langFlag.innerHTML = FLAGS[getLang()];
  langItems.forEach((b) => b.classList.toggle('on', b.dataset.lang === getLang()));
  lightbox.setTexts?.(t);
}

function reloadShelf() {
  const items = itemsFor();
  countEl.textContent = digits(pad(items.length));
  const keep = items.find((g) => g.id === state.currentId) || items.find((g) => g.featured) || items[0];
  shelf.setItems(items, keep.id);
  buildTimeline();
  shelf.layout(true); // re-run selection so the timeline highlight is set
}

function changeLanguage(code) {
  if (stage.isOpen || shelf.locked) return;
  setLang(code);
  applyTexts();
  reloadShelf();
}

setLang(getLang());
applyTexts();
reloadShelf();

function openSelected() {
  if (stage.isOpen || shelf.locked) return;
  const slot = shelf.selectedSlot();
  if (!slot) return;
  shelf.locked = true;
  cursor.setFromShelf(null);
  const index = shelf.items.indexOf(slot.item);
  stage.open(slot.item, { fromEl: slot.el, index, total: shelf.items.length });
}

function setFilter(p) {
  if (shelf.locked) return;
  state.filter = p;
  filterBtns.forEach((b) => {
    const on = b.dataset.era === p;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  reloadShelf();
}

/* ---------- keyboard ---------- */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && langBox.classList.contains('open')) { langBox.classList.remove('open'); return; }
  if (lightbox.isOpen || aboutDialog.open) return; // dialogs handle their own keys
  if (stage.isOpen) {
    if (e.key === 'Escape') { e.preventDefault(); stage.close(); }
    return;
  }
  if (e.target.closest?.('input, textarea')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); shelf.go(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); shelf.go(-1); }
  else if ((e.key === 'Enter' || e.key === ' ') && (e.target === document.body || e.target === shelf.track)) { e.preventDefault(); openSelected(); }
});

// GitHub star count in the footer. Live from the public API; hidden if it fails or the repo is not public yet.
(async () => {
  try {
    const cached = sessionStorage.getItem('gta-stars');
    let n = cached !== null ? Number(cached) : null;
    if (n === null) {
      const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) return;
      n = (await res.json()).stargazers_count;
      if (typeof n !== 'number') return;
      sessionStorage.setItem('gta-stars', String(n));
    }
    starCount.textContent = n.toLocaleString('en');
    starCount.hidden = false;
    starLink.setAttribute('aria-label', `Star this project on GitHub (${n} stars)`);
  } catch {}
})();

// Start with focus on the shelf so arrow keys work immediately.
shelf.track.focus({ preventScroll: true });
