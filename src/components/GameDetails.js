import { h, maskedText, pad } from '../lib/dom.js';
import { platformMark } from './GameCase.js';
import { T, digits } from '../i18n.js';

/** One fact tile in the production file. Unknown values say so plainly. */
export function fact(label, value, note, cls = '') {
  return h('div', { class: `fact ${value ? '' : 'is-unknown'} ${cls}` },
    h('span', { class: 'fact__label' }, label),
    h('strong', { class: 'fact__value' }, value || T().notDisclosed),
    note ? h('span', { class: 'fact__note' }, note) : null
  );
}

/** Archive block under a normal open case: story, production file, period screenshots. */
export function createGameDetails(game, index, total, { onOpenImage } = {}) {
  const p = game.production || {};
  const shots = game.screenshots || [];

  return h('section', { class: `details details--${game.era}`, 'aria-label': `${game.title} details` },
    h('div', { class: 'details__head reveal' },
      h('span', { class: 'details__eyebrow' }, T().chapter(digits(pad(index + 1)), digits(pad(total)), game.era.toUpperCase())),
      h('span', { class: 'details__badge' }, platformMark(game), h('span', {}, digits(game.year)))
    ),
    h('h2', { class: 'details__title', id: 'stage-title', lang: 'en', dir: 'ltr' }, maskedText(game.title)),

    h('div', { class: 'details__grid' },
      h('div', { class: 'details__copy reveal' },
        h('p', { class: 'details__desc' }, game.description),
        h('dl', { class: 'details__meta' },
          [
            [T().released, game.releaseDate],
            [T().madeFor, game.leadPlatform],
            [T().launchedOn, game.platforms],
            [T().developer, game.developer],
            [T().publisher, game.publisher],
          ].map(([k, v]) => h('div', { class: 'details__row' }, h('dt', {}, k), h('dd', {}, v)))
        )
      ),
      h('div', { class: 'details__side reveal' },
        h('div', { class: 'score-card' },
          h('span', { class: 'fact__label' }, game.ratingSource || T().metacritic),
          game.rating != null
            ? h('div', { class: 'score-card__n', dir: 'ltr' }, h('span', { class: 'score' }, digits(game.rating)), h('span', { class: 'score__of' }, digits('/100')))
            : h('div', { class: 'score-card__n is-unknown' }, T().noScore)
        ),
        h('div', { class: 'world-card' },
          h('div', {}, h('span', { class: 'fact__label' }, T().setting), h('strong', {}, game.setting)),
          h('div', {}, h('span', { class: 'fact__label' }, T().playingAs), h('strong', {}, game.protagonist)),
          h('div', {}, h('span', { class: 'fact__label' }, T().engine), h('strong', {}, game.engine))
        )
      )
    ),

    h('div', { class: 'production reveal' },
      h('div', { class: 'production__head' },
        h('h3', {}, T().productionFile),
        h('span', {}, T().productionSub)
      ),
      h('div', { class: 'production__grid' },
        fact(T().budget, p.budget, p.budgetNote, 'fact--budget'),
        fact(T().devTime, p.devTime, p.devNote),
        fact(T().team, p.team, p.teamNote),
        fact(T().sales, p.sales)
      )
    ),

    shots.length
      ? h('div', { class: 'memories' },
          h('div', { class: 'memories__head reveal' },
            h('h3', {}, T().remember),
            h('span', {}, T().imagesFrom(digits(pad(shots.length)), digits(game.year)))
          ),
          h('div', { class: `memories__grid reveal-gallery${game.pixelArt ? ' is-pixel' : ''}` },
            shots.map((s, i) =>
              h('button', { class: `memory${i === 0 ? ' is-wide' : ''}`, 'aria-label': T().openShot(digits(i + 1), game.title), onclick: () => onOpenImage?.(i) },
                h('img', { src: s.thumb, alt: `${game.title} screenshot ${i + 1}`, loading: 'lazy', decoding: 'async', draggable: 'false' }),
                h('span', { class: 'memory__crt', 'aria-hidden': 'true' }),
                h('span', { class: 'memory__cap' }, `${game.shortTitle} · ${digits(game.year)}`)
              )
            )
          )
        )
      : null,

    h('p', { class: 'details__note reveal' }, shots.some((s) => s.official) ? T().noteOfficial : T().noteAdvance)
  );
}
