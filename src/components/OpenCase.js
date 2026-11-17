import { h, clamp } from '../lib/dom.js';
import { animate, EASE, dur, prefersReducedMotion } from '../lib/motion.js';
import { createCase } from './GameCase.js';
import { createGameDetails } from './GameDetails.js';
import { createViTray, createViDetails } from './GtaShowcase.js';
import { T } from '../i18n.js';

/**
 * The open-case stage. It takes the selected case off the shelf (FLIP from
 * the shelf slot's on-screen rect), brings it forward, swings the front cover
 * 180° around its spine hinge, then reveals the disc (or the GTA VI gallery)
 * and the archive information.
 *
 * Timeline (ms, overlapping):
 *   0    ── case lifts & comes forward ─────── 550
 *   300  ── lid swings open on hinge ─────────────────── 1150
 *   850  ── disc / gallery reveal ───────── 1350
 *   950  ── information reveal ─────────────── 1600
 *   1150 ── screenshot gallery reveal ─────────── 1850
 */
export class OpenCase {
  constructor({ lightbox, onClosed }) {
    this.lightbox = lightbox;
    this.onClosed = onClosed;
    this.isOpen = false;
    this.busy = false;

    this.closeLabel = h('span', {}, 'Close');
    this.closeBtn = h('button', { class: 'stage__close', 'aria-label': 'Close case', onclick: () => this.close() },
      h('span', { class: 'stage__close-x', 'aria-hidden': 'true' }), this.closeLabel, h('kbd', {}, 'Esc'));
    this.anchor = h('div', { class: 'stage__anchor' });
    this.shadow = h('div', { class: 'stage__shadow', 'aria-hidden': 'true' });
    this.scene = h('div', { class: 'stage__scene' }, h('div', { class: 'stage__floor', 'aria-hidden': 'true' }), this.shadow, this.anchor);
    this.content = h('div', { class: 'stage__content' });
    this.scroll = h('div', { class: 'stage__scroll' }, this.scene, this.content);
    this.backdrop = h('div', { class: 'stage__backdrop', 'aria-hidden': 'true' });
    this.root = h('section', { class: 'stage', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'stage-title', hidden: true },
      this.backdrop, this.scroll, this.closeBtn);
    document.body.append(this.root);

    // Clicking the open case's tray (normal games) nudges the disc — a tactile detail.
    this.anchor.addEventListener('click', (e) => {
      const disc = e.target.closest('.disc');
      if (disc && !prefersReducedMotion()) {
        animate(disc, [{ transform: 'translateZ(4px) rotate(-30deg)' }, { transform: 'translateZ(4px) rotate(330deg)' }], { duration: 1400, easing: EASE.out });
      }
    });
    window.addEventListener('resize', () => this.isOpen && this.size());
  }

  /** Fit this game's real case size into the viewport, opened flat (2 × width). */
  size() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 700;
    const ed = this.game.editionInfo;
    const maxH = clamp(vh * (mobile ? 0.42 : 0.6), 180, 600);
    const maxSpread = vw * (mobile ? 0.9 : 0.8);
    const unit = Math.min(maxH / ed.h, maxSpread / (2 * ed.w));
    this.dims = { H: Math.round(ed.h * unit), W: Math.round(ed.w * unit), D: Math.max(10, Math.round(ed.d * unit * 1.2)) };
    this.root.style.setProperty('--sw', `${this.dims.W}px`);
    this.root.style.setProperty('--sh', `${this.dims.H}px`);
    this.root.style.setProperty('--sd', `${this.dims.D}px`);
  }

  async open(game, { fromEl, index, total }) {
    if (this.isOpen || this.busy) return;
    this.busy = true;
    this.isOpen = true;
    this.game = game;
    this.fromEl = fromEl;
    this.returnFocus = document.activeElement;
    this.closeLabel.textContent = T().closeWord;
    this.closeBtn.setAttribute('aria-label', T().closeCase);
    this.size();
    const { W, D } = this.dims;

    // Build case + content.
    const openImage = (i) => this.lightbox.open(game.promotionalAssets, i);
    this.viTray = game.specialPresentation ? createViTray(game, { onOpenImage: openImage }) : null;
    this.caseEl = createCase(game, { variant: 'stage', eager: true, trayContent: this.viTray?.el });
    this.anchor.replaceChildren(this.caseEl);
    this.content.replaceChildren(
      game.specialPresentation
        ? createViDetails(game, { onOpenImage: openImage })
        : createGameDetails(game, index, total, { onOpenImage: (i) => this.lightbox.open(game.screenshots, i) })
    );
    this.root.classList.toggle('stage--vi', !!game.specialPresentation);
    this.root.hidden = false;
    this.scroll.scrollTop = 0;
    document.documentElement.classList.add('is-stage-open');

    const body = this.caseEl.querySelector('.case__body');
    const lid = this.caseEl.querySelector('.case__lid');
    const disc = this.caseEl.querySelector('.disc, .umd, .cart');
    const glint = this.caseEl.querySelector('.disc__glint');
    const vi = this.caseEl.querySelector('.vi-tray');

    // FLIP: start exactly where the shelf case is on screen.
    const from = fromEl.getBoundingClientRect();
    const to = this.anchor.getBoundingClientRect();
    const s0 = from.height / to.height;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    this.flip = { dx, dy, s0 };
    fromEl.style.visibility = 'hidden';

    const half = W / 2;
    const lidClosed = `translateZ(${D / 2}px) rotateY(0deg)`;
    const lidOpen = `translateZ(${D / 2}px) rotateY(-180deg)`;
    lid.style.transform = lidClosed;

    // Reset reveal states before the first paint.
    this.content.querySelectorAll('.reveal, .reveal-gallery > *').forEach((el) => (el.style.opacity = '0'));
    this.content.querySelectorAll('.mask-text__word').forEach((el) => (el.style.transform = 'translateY(105%)'));

    animate(this.backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'linear' });
    animate(this.closeBtn, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 700, easing: EASE.out });

    // 1. Lift out of the shelf and come forward.
    const lift = animate(this.anchor, [
      { transform: `translate(${dx}px, ${dy}px) scale(${s0})` },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.4 - 30}px) scale(${s0 + (1 - s0) * 0.6}) translateZ(60px)`, offset: 0.55 },
      { transform: 'translate(0, 0) scale(1) translateZ(0)' },
    ], { duration: 550, easing: EASE.out });
    animate(this.shadow, [{ opacity: 0, transform: 'scaleX(.4)' }, { opacity: 1, transform: 'scaleX(1)' }], { duration: 900, delay: 200, easing: EASE.out });

    // 2. Hinge: lid swings 180° while the whole case slides right so the spread centres.
    animate(lid, [
      { transform: lidClosed },
      { transform: `translateZ(${D / 2 + 14}px) rotateY(-95deg)`, offset: 0.5 },
      { transform: lidOpen },
    ], { duration: 850, delay: 300, easing: EASE.hinge });
    animate(body, [
      { transform: 'translateX(0) rotateX(0deg)' },
      { transform: `translateX(${half}px) rotateX(9deg)` },
    ], { duration: 850, delay: 300, easing: EASE.inOut });

    // 3. Disc catches the light / GTA gallery wakes up.
    if (disc) {
      const spin = disc.classList.contains('disc');
      animate(disc, spin
        ? [{ transform: 'translateZ(0px) rotate(-120deg)' }, { transform: 'translateZ(4px) rotate(-30deg)' }]
        : [{ transform: 'translateZ(0px) translateY(14%) rotate(-6deg)' }, { transform: 'translateZ(4px) translateY(0) rotate(0deg)' }],
        { duration: 900, delay: 650, easing: EASE.out });
      animate(glint, [{ transform: 'rotate(-60deg)', opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'rotate(200deg)', opacity: 0 }], { duration: 1100, delay: 850, easing: EASE.inOut });
    }
    if (vi) {
      animate(vi, [{ clipPath: 'inset(50% 50% 50% 50%)', filter: 'brightness(2.5) saturate(0)' }, { clipPath: 'inset(0 0 0 0)', filter: 'brightness(1) saturate(1)' }], { duration: 700, delay: 850, easing: EASE.out });
      setTimeout(() => this.viTray?.start(), dur(1600));
    }

    // 4. Information + gallery.
    this.revealContent(950);

    await lift;
    setTimeout(() => {
      this.busy = false;
      this.closeBtn.focus({ preventScroll: true });
    }, dur(900));
  }

  revealContent(delay) {
    const words = this.content.querySelectorAll('.mask-text__word');
    words.forEach((w, i) =>
      animate(w, [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 650, delay: delay + i * 45, easing: EASE.out })
    );
    this.content.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.opacity = '';
      animate(el, [
        { opacity: 0, transform: 'translateY(28px)', clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0% 0)' },
      ], { duration: 650, delay: delay + 80 + i * 70, easing: EASE.out });
    });
    this.content.querySelectorAll('.reveal-gallery > *').forEach((el, i) => {
      el.style.opacity = '';
      animate(el, [
        { opacity: 0, clipPath: 'inset(100% 0 0 0)', transform: 'translateY(30px)' },
        { opacity: 1, clipPath: 'inset(0% 0 0 0)', transform: 'translateY(0)' },
      ], { duration: 700, delay: delay + 200 + Math.min(i, 10) * 40, easing: EASE.out });
    });
  }

  async close() {
    if (!this.isOpen || this.busy) return;
    this.busy = true;
    this.viTray?.stop();
    const { D, W } = this.dims;
    const body = this.caseEl.querySelector('.case__body');
    const lid = this.caseEl.querySelector('.case__lid');

    // Scroll back up so the case is in view while it closes.
    if (this.scroll.scrollTop > 0) this.scroll.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

    // 1. Information retracts.
    const retract = [...this.content.querySelectorAll('.reveal, .reveal-gallery, .details__title, .vi-title')].map((el) =>
      animate(el, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(16px)' }], { duration: 260, easing: EASE.in })
    );
    await Promise.all(retract);

    // 2. Case closes.
    animate(body, [{ transform: `translateX(${W / 2}px) rotateX(9deg)` }, { transform: 'translateX(0) rotateX(0deg)' }], { duration: 650, easing: EASE.inOut });
    await animate(lid, [
      { transform: `translateZ(${D / 2}px) rotateY(-180deg)` },
      { transform: `translateZ(${D / 2 + 12}px) rotateY(-85deg)`, offset: 0.5 },
      { transform: `translateZ(${D / 2}px) rotateY(0deg)` },
    ], { duration: 650, easing: EASE.hinge });

    // 3. Back to its slot on the shelf (re-measure: the shelf may have resized).
    const from = this.fromEl.getBoundingClientRect();
    const to = this.anchor.getBoundingClientRect();
    const tAnchor = getComputedStyle(this.anchor).transform;
    const s0 = from.height / (to.height / (new DOMMatrix(tAnchor).a || 1));
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    animate(this.backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'linear' });
    animate(this.shadow, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    animate(this.closeBtn, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    await animate(this.anchor, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${s0})` },
    ], { duration: 480, easing: EASE.inOut });

    // 4. Hand control back to the shelf.
    this.fromEl.style.visibility = '';
    this.root.hidden = true;
    this.anchor.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    [this.backdrop, this.shadow, this.closeBtn].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    this.anchor.replaceChildren();
    this.content.querySelectorAll('.countdown').forEach((c) => c.destroy?.());
    this.content.replaceChildren();
    document.documentElement.classList.remove('is-stage-open');
    this.isOpen = false;
    this.busy = false;
    this.onClosed?.();
  }
}
