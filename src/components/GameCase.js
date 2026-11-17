import { h } from '../lib/dom.js';
import { createMedia } from './Disc.js';

/**
 * Physical game case built from six CSS 3D faces, in the packaging of the
 * console the game was made for (PS1 jewel case, PS2 DVD case, PSP UMD case…).
 *
 *  .case                 sized by --w / --h / --d (width, height, depth) in px
 *   └ .case__body        preserve-3d — the object that rotates
 *       ├ back, spine (left), edge (right), top, bottom faces
 *       ├ .case__tray    (stage only) interior: disc / cartridge / GTA VI gallery
 *       └ .case__lid     front cover, hinged on the spine edge
 *           ├ .lid__outer   front cover art (seen when closed)
 *           └ .lid__inner   inner artwork (seen when opened 180°)
 */

/** Typographic console mark — text only, no trademark artwork reproduced. */
export function platformMark(game) {
  const ed = game.editionInfo;
  return h('span', { class: `ps-mark ps-mark--${game.edition}`, 'aria-hidden': 'true' }, ed.mark);
}

function coverImg(game, eager) {
  if (!game.coverFront) return null;
  return h('img', {
    class: `cover-img${game.coverFit === 'contain' ? ' cover-img--contain' : ''}`,
    alt: `${game.title} front cover`,
    draggable: 'false',
    decoding: 'async',
    ...(eager ? { src: game.coverFront } : { 'data-src': game.coverFront }),
  });
}

const band = (game) =>
  h('div', { class: `sleeve__band sleeve__band--${game.edition} sleeve__band--${game.editionInfo.band}` }, platformMark(game));

function frontCover(game, eager) {
  return h('div', { class: 'face lid__outer' },
    h('div', { class: 'sleeve' }, coverImg(game, eager), band(game)),
    h('div', { class: 'plastic-gloss' })
  );
}

function spine(game) {
  return h('div', { class: 'face face--spine' },
    h('div', { class: `spine__head spine__head--${game.edition}` }, h('span', {}, String(game.year))),
    // Bebas Neue has no curly apostrophe; a straight one keeps vertical text clean.
    h('div', { class: 'spine__title' }, (game.spineTitle || game.shortTitle || game.title).replace(/’/g, "'")),
    h('div', { class: 'spine__foot' }, h('span', {}, initials(game.publisher)))
  );
}

function initials(name) {
  if (/rockstar/i.test(name)) return 'R★';
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}

function backCover(game) {
  const art = game.coverBack || game.coverFront;
  return h('div', { class: 'face face--back' },
    h('div', { class: 'back__art', style: art ? { '--art': `url("${art}")` } : {} }),
    band(game),
    h('div', { class: 'back__text' },
      h('strong', {}, game.shortTitle),
      h('span', {}, `${game.developer} · ${game.year}`)
    ),
    h('div', { class: 'plastic-gloss' })
  );
}

function innerLeft(game) {
  if (game.specialPresentation) {
    return h('div', { class: 'face lid__inner lid__inner--vi' },
      h('div', { class: 'inner-art', style: { '--art': `url("${game.innerArtwork}")` } }),
      h('div', { class: 'inner-vi__shade' }),
      game.logo ? h('img', { class: 'inner-vi__logo', src: game.logo, alt: '', draggable: 'false' }) : null,
      h('div', { class: 'inner-vi__cap' }, h('span', {}, 'Jason Duval'), h('span', {}, 'Lucia Caminos')),
      h('div', { class: 'lid__clips' }, h('i'), h('i'))
    );
  }
  // Inside sleeve: a real period screenshot, printed like an insert.
  const art = game.innerArtwork || game.coverFront;
  return h('div', { class: `face lid__inner${game.pixelArt ? ' lid__inner--pixel' : ''}` },
    h('div', { class: 'inner-art inner-art--print', style: { '--art': `url("${art}")` } }),
    h('div', { class: 'inner-print' },
      h('span', { class: 'inner-print__eyebrow' }, game.setting),
      h('span', { class: 'inner-print__title' }, game.shortTitle),
      h('span', { class: 'inner-print__meta' }, game.protagonist),
    ),
    h('div', { class: 'lid__clips' }, h('i'), h('i'))
  );
}

function tray(game, extras) {
  const t = h('div', { class: `case__tray case__tray--${game.editionInfo.media || 'none'}` }, h('div', { class: 'tray__mould' }));
  if (game.specialPresentation) {
    t.classList.add('case__tray--vi');
    if (extras.trayContent) t.append(extras.trayContent);
  } else {
    const m = game.editionInfo.media;
    if (['cd', 'dvd', 'bd'].includes(m)) t.append(h('div', { class: 'tray__hub-ring' }));
    t.append(createMedia(game));
  }
  return t;
}

/**
 * @param size {w,h,d} in px — each edition has its own real-world proportions.
 */
export function createCase(game, { variant = 'shelf', eager = false, trayContent = null, size } = {}) {
  const body = h('div', { class: 'case__body' },
    backCover(game),
    spine(game),
    h('div', { class: 'face face--edge' }),
    h('div', { class: 'face face--top' }),
    h('div', { class: 'face face--bottom' }),
    variant === 'stage' ? tray(game, { trayContent }) : null,
    h('div', { class: 'case__lid' },
      frontCover(game, eager),
      variant === 'stage' ? innerLeft(game) : h('div', { class: 'face lid__inner lid__inner--plain' })
    )
  );

  const style = {
    '--spine-bg': game.spine?.bg || '#111',
    '--spine-fg': game.spine?.fg || '#fff',
    '--spine-accent': game.spine?.accent || '#ff4fa3',
  };
  if (size) Object.assign(style, { '--w': `${size.w}px`, '--h': `${size.h}px`, '--d': `${size.d}px` });

  return h('div', {
    class: `case case--${game.edition} case--${variant}${game.specialPresentation ? ' case--vi' : ''}`,
    style,
  }, body);
}

/** Swap data-src → src once a case comes near the centre (lazy loading in 3D). */
export function hydrateImages(root) {
  root.querySelectorAll('img[data-src]').forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}
