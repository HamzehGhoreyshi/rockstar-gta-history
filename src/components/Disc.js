import { h } from '../lib/dom.js';
import { platformMark } from './GameCase.js';

/**
 * The game media as its own 3D object, separate from the case artwork.
 *  cd / dvd / bd → optical disc (underside, rim, label, mirror ring, clear hub, sheen)
 *  umd          → PSP UMD: small disc inside a plastic shell with a window
 *  gba / ds     → cartridge with a printed label
 * Labels use the cover art (no disc scans in this archive).
 */
export function createMedia(game) {
  const m = game.editionInfo.media;
  if (m === 'umd') return umd(game);
  if (m === 'gba' || m === 'ds') return cartridge(game, m);
  return disc(game, m);
}

function disc(game, kind) {
  const label = game.discArtwork;
  return h('div', { class: `disc disc--${kind} disc--${game.edition}`, 'aria-hidden': 'true' },
    h('div', { class: 'disc__under' }),
    h('div', { class: 'disc__rim' }),
    h('div', { class: 'disc__top' },
      h('div', { class: 'disc__label', style: label ? { '--art': `url("${label}")` } : {} },
        h('div', { class: 'disc__band' }, platformMark(game)),
        h('div', { class: 'disc__title' }, game.shortTitle)
      ),
      h('div', { class: 'disc__mirror' }),
      h('div', { class: 'disc__hub' }),
      h('div', { class: 'disc__hole' }),
      h('div', { class: 'disc__sheen' }),
      h('div', { class: 'disc__glint' })
    )
  );
}

function umd(game) {
  return h('div', { class: 'umd', 'aria-hidden': 'true' },
    h('div', { class: 'umd__shell' },
      h('div', { class: 'umd__label', style: { '--art': `url("${game.discArtwork}")` } },
        h('span', { class: 'umd__mark' }, 'UMD'),
        h('span', { class: 'umd__title' }, game.shortTitle)
      ),
      h('div', { class: 'umd__window' }, h('div', { class: 'umd__disc' })),
      h('div', { class: 'disc__glint' })
    )
  );
}

function cartridge(game, kind) {
  return h('div', { class: `cart cart--${kind}`, 'aria-hidden': 'true' },
    h('div', { class: 'cart__body' },
      h('div', { class: 'cart__label', style: { '--art': `url("${game.discArtwork}")` } },
        h('span', { class: 'cart__title' }, game.shortTitle)
      ),
      h('div', { class: 'cart__mark' }, platformMark(game)),
      h('div', { class: 'cart__ridges' }),
      h('div', { class: 'disc__glint' })
    )
  );
}
