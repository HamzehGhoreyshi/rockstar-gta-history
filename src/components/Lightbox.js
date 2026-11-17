import { h, pad } from '../lib/dom.js';
import { animate, EASE } from '../lib/motion.js';
import { digits } from '../i18n.js';

/** Full-screen image viewer built on <dialog> (gets focus trapping + Esc for free). */
export class Lightbox {
  constructor() {
    this.img = h('img', { class: 'lightbox__img', alt: '' });
    this.label = h('span', { class: 'lightbox__label' });
    this.count = h('span', { class: 'lightbox__count' });
    this.credit = h('span', { class: 'lightbox__credit' });
    this.dialog = h('dialog', { class: 'lightbox', 'aria-label': 'Image viewer' },
      h('figure', { class: 'lightbox__figure' }, this.img,
        h('figcaption', {}, this.count, this.label, this.credit)),
      h('button', { class: 'lightbox__btn lightbox__prev', 'aria-label': 'Previous image', onclick: () => this.step(-1) }, '←'),
      h('button', { class: 'lightbox__btn lightbox__next', 'aria-label': 'Next image', onclick: () => this.step(1) }, '→'),
      h('button', { class: 'lightbox__close', 'aria-label': 'Close image viewer', onclick: () => this.close() }, 'Close')
    );
    this.dialog.addEventListener('click', (e) => { if (e.target === this.dialog) this.close(); });
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.step(-1);
      if (e.key === 'ArrowRight') this.step(1);
    });
    document.body.append(this.dialog);
  }

  get isOpen() { return this.dialog.open; }

  /** Interface language for the viewer's buttons and credit line. */
  setTexts(t) {
    this.t = t;
    const [prev, next, close] = this.dialog.querySelectorAll('.lightbox__prev, .lightbox__next, .lightbox__close');
    prev.setAttribute('aria-label', t.lbPrev);
    next.setAttribute('aria-label', t.lbNext);
    close.textContent = t.lbClose;
  }

  open(images, index = 0) {
    this.images = images;
    this.index = index;
    this.render();
    this.dialog.showModal();
    animate(this.img, [{ clipPath: 'inset(8% 8% 8% 8%)', transform: 'scale(1.04)' }, { clipPath: 'inset(0 0 0 0)', transform: 'scale(1)' }], { duration: 600, easing: EASE.out });
  }

  step(d) {
    if (!this.images) return;
    this.index = (this.index + d + this.images.length) % this.images.length;
    this.render();
    animate(this.img, [{ opacity: 0.2, transform: `translateX(${d * 24}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: 380, easing: EASE.out });
  }

  render() {
    const it = this.images[this.index];
    this.img.src = it.full;
    this.img.alt = it.label;
    this.label.textContent = it.label;
    this.count.textContent = digits(`${pad(this.index + 1)} / ${pad(this.images.length)}`);
    this.credit.textContent = it.official ? (this.t?.lbOfficial || 'Official · © Rockstar Games') : it.credit || '';
    // Low-res period screenshots (320×200 etc.) stay crisp instead of blurry.
    this.img.onload = () => this.img.classList.toggle('is-pixel', this.img.naturalWidth < 700);
  }

  close() { this.dialog.close(); }
}
