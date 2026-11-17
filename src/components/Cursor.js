import { h } from '../lib/dom.js';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * Custom desktop cursor. States: default · spine · open · button.
 * Disabled entirely on touch / coarse pointers.
 */
export class Cursor {
  constructor() {
    this.enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!this.enabled) return;
    document.documentElement.classList.add('has-cursor');
    this.el = h('div', { class: 'cursor', 'aria-hidden': 'true' },
      h('div', { class: 'cursor__ring' }),
      h('span', { class: 'cursor__label' }, 'Open')
    );
    document.body.append(this.el);

    // A modal <dialog> (image viewer, About) is drawn in the browser's top layer, above every
    // z-index on the page — so the cursor has to live inside the open dialog to stay visible.
    const rehome = () => {
      const open = [...document.querySelectorAll('dialog[open]')].pop();
      const host = open || document.body;
      if (this.el.parentElement !== host) host.append(this.el);
    };
    new MutationObserver(rehome).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

    this.x = this.tx = window.innerWidth / 2;
    this.y = this.ty = window.innerHeight / 2;
    this.override = null;

    window.addEventListener('pointermove', (e) => {
      this.tx = e.clientX;
      this.ty = e.clientY;
      this.el.classList.add('is-visible');
      if (!this.override) {
        const t = e.target.closest?.('button, a, [data-cursor]');
        this.setState(t ? t.dataset.cursor || 'button' : 'default', false);
      }
    });
    document.addEventListener('pointerleave', () => this.el.classList.remove('is-visible'));
    window.addEventListener('pointerdown', () => this.el.classList.add('is-down'));
    window.addEventListener('pointerup', () => this.el.classList.remove('is-down'));

    const loop = () => {
      const k = prefersReducedMotion() ? 1 : 0.22;
      this.x += (this.tx - this.x) * k;
      this.y += (this.ty - this.y) * k;
      this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /** Shelf reports spine/open hover; null releases control back to DOM targets. */
  setFromShelf(state) {
    if (!this.enabled) return;
    this.override = state;
    this.setState(state || 'default', true);
  }

  setState(state, force) {
    if (!this.enabled) return;
    if (!force && this.override) return;
    if (this.state === state) return;
    this.state = state;
    this.el.dataset.state = state;
  }
}
