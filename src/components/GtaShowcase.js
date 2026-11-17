import { h, maskedText, pad } from '../lib/dom.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { createCountdown } from './Countdown.js';
import { fact } from './GameDetails.js';
import { T, digits } from '../i18n.js';

/**
 * GTA VI special presentation.
 *  - createViTray(): cinematic gallery that replaces the disc inside the case.
 *  - createViDetails(): the full Vice City section beneath the open case.
 * Every image here is an official Rockstar asset loaded from rockstargames.com.
 */

export function createViTray(game, { onOpenImage }) {
  const assets = game.promotionalAssets;
  const frames = assets.slice(0, 8).map((a, i) =>
    h('div', { class: `vi-tray__frame${i === 0 ? ' is-active' : ''}`, style: { '--art': `url("${a.thumb.replace('imwidth=640', 'imwidth=1280')}")` } })
  );
  const label = h('span', { class: 'vi-tray__label' }, assets[0].label);
  const count = h('span', { class: 'vi-tray__count' }, digits(`01 / ${pad(frames.length)}`));
  const tray = h('div', { class: 'vi-tray', 'data-cursor': 'button' },
    h('div', { class: 'vi-tray__frames' }, frames),
    h('div', { class: 'vi-tray__shade' }),
    h('div', { class: 'vi-tray__hud' },
      h('span', { class: 'vi-tray__tag' }, T().officialScreens),
      h('div', { class: 'vi-tray__foot' }, count, label)
    ),
    h('div', { class: 'vi-tray__scan' })
  );

  let i = 0;
  let timer = null;
  const show = (n) => {
    frames[i].classList.remove('is-active');
    i = (n + frames.length) % frames.length;
    frames[i].classList.add('is-active');
    label.textContent = assets[i].label;
    count.textContent = digits(`${pad(i + 1)} / ${pad(frames.length)}`);
  };
  tray.addEventListener('click', (e) => {
    e.stopPropagation();
    onOpenImage?.(i);
  });

  return {
    el: tray,
    start() {
      if (prefersReducedMotion() || timer) return;
      timer = setInterval(() => show(i + 1), 3800);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
  };
}

export function createViDetails(game, { onOpenImage }) {
  const p = game.production || {};
  const characters = [
    { name: 'Lucia Caminos', idx: game.promotionalAssets.findIndex((a) => a.label === 'Lucia Caminos') },
    { name: 'Jason Duval', idx: game.promotionalAssets.findIndex((a) => a.label === 'Jason Duval') },
  ];

  const tile = (a, i, cls = '') =>
    h('button', {
      class: `vi-gallery__item ${cls}`,
      'aria-label': `Open ${a.label} screenshot`,
      onclick: () => onOpenImage(i),
    },
      h('img', { src: a.thumb, alt: a.label, loading: 'lazy', decoding: 'async', draggable: 'false' }),
      h('span', { class: 'vi-gallery__cap' }, a.label)
    );

  return h('section', { class: 'vi-details', 'aria-label': 'Grand Theft Auto VI' },
    h('div', { class: 'vi-hero reveal' },
      h('span', { class: 'vi-eyebrow' }, T().viEyebrow),
      h('h2', { class: 'vi-title', id: 'stage-title' }, maskedText(T().viTitle)),
      h('p', { class: 'vi-line' }, `“${game.officialLine}”`, h('cite', {}, T().viCite)),
      createCountdown(game.releaseAt, { size: 'lg', label: T().unlocksIn }),
    ),
    h('div', { class: 'vi-band reveal' },
      h('div', { class: 'vi-stat' }, h('span', {}, T().release), h('strong', {}, game.releaseDate)),
      h('div', { class: 'vi-stat' }, h('span', {}, T().platforms), h('strong', {}, game.platforms)),
      h('div', { class: 'vi-stat' }, h('span', {}, T().developer), h('strong', {}, game.developer)),
      h('div', { class: 'vi-stat' }, h('span', {}, T().engine), h('strong', {}, game.engine)),
      h('div', { class: 'vi-stat' }, h('span', {}, T().setting), h('strong', {}, game.setting)),
      h('div', { class: 'vi-stat' }, h('span', {}, T().playingAs), h('strong', {}, game.protagonist))
    ),
    h('div', { class: 'production production--vi reveal' },
      h('div', { class: 'production__head' }, h('h3', {}, T().productionFile), h('span', {}, T().productionSubVi)),
      h('div', { class: 'production__grid' },
        fact(T().budget, p.budget, p.budgetNote, 'fact--budget'),
        fact(T().devTime, p.devTime, p.devNote),
        fact(T().team, p.team, p.teamNote),
        fact(T().preorders, p.sales)
      )
    ),
    h('div', { class: 'vi-story reveal' },
      h('p', { class: 'vi-story__text' }, game.description),
      h('p', { class: 'vi-story__src' }, T().viStorySrc)
    ),
    h('div', { class: 'vi-leads reveal' },
      characters.filter((c) => c.idx >= 0).map((c) => {
        const a = game.promotionalAssets[c.idx];
        return h('button', { class: 'vi-lead', onclick: () => onOpenImage(c.idx), 'aria-label': `Open ${c.name} artwork` },
          h('img', { src: a.thumb.replace('imwidth=640', 'imwidth=1280'), alt: c.name, loading: 'lazy', draggable: 'false' }),
          h('span', { class: 'vi-lead__name' }, c.name)
        );
      })
    ),
    h('div', { class: 'vi-gallery-head reveal' },
      h('h3', {}, T().launchGallery),
      h('span', {}, T().officialShots(digits(pad(game.promotionalAssets.length))))
    ),
    h('div', { class: 'vi-gallery reveal-gallery' },
      game.promotionalAssets.map((a, i) => tile(a, i, i % 5 === 0 && i < 15 ? 'is-wide' : ''))
    ),
    h('div', { class: 'vi-trailers reveal' },
      game.trailers.map((t) =>
        h('a', { class: 'vi-trailer', href: game.officialUrl, target: '_blank', rel: 'noopener' },
          h('img', { src: t.thumb, alt: `${t.label} still`, loading: 'lazy', draggable: 'false' }),
          h('span', {}, T().watch(t.label), h('em', {}, T().onRockstar))
        )
      )
    ),
    h('p', { class: 'vi-credit' },
      T().viCredit)
  );
}
