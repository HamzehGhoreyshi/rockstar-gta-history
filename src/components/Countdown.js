import { h, pad } from '../lib/dom.js';
import { T, digits } from '../i18n.js';

/**
 * Live release countdown — days · hours · minutes · seconds, the way the
 * PlayStation Store shows a pre-order. Ticks once a second; call destroy()
 * when the element leaves the page.
 */
export function createCountdown(target, { size = 'md', label = T().releasesIn } = {}) {
  const cells = T().units.map((u) => {
    const n = h('span', { class: 'countdown__n' }, digits('00'));
    return { n, el: h('div', { class: 'countdown__cell' }, n, h('span', { class: 'countdown__u' }, u)) };
  });
  const title = h('span', { class: 'countdown__label' }, label);
  const el = h('div', { class: `countdown countdown--${size}`, role: 'timer', 'aria-live': 'off' },
    title,
    h('div', { class: 'countdown__row' }, cells.flatMap((c, i) => (i ? [h('span', { class: 'countdown__sep', 'aria-hidden': 'true' }, ':'), c.el] : [c.el])))
  );

  let timer;
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) {
      el.classList.add('is-out');
      title.textContent = T().outNow;
      cells.forEach((c) => (c.n.textContent = digits('00')));
      el.setAttribute('aria-label', T().outNow);
      clearInterval(timer);
      return;
    }
    const s = Math.floor(ms / 1000);
    const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
    parts.forEach((v, i) => {
      const t = digits(pad(v));
      if (cells[i].n.textContent !== t) {
        cells[i].n.textContent = t;
        cells[i].n.classList.remove('is-tick');
        void cells[i].n.offsetWidth; // restart the tick animation
        cells[i].n.classList.add('is-tick');
      }
    });
    el.setAttribute('aria-label', `${label} ${parts[0]} days ${parts[1]} hours ${parts[2]} minutes`);
  };
  tick();
  timer = setInterval(tick, 1000);
  el.destroy = () => clearInterval(timer);
  return el;
}
