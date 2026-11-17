import { h, maskedText, pad } from '../lib/dom.js';
import { animate, EASE } from '../lib/motion.js';
import { createCountdown } from './Countdown.js';
import { T, digits } from '../i18n.js';

/** Selected-game caption under the shelf, swapped with masked text reveals. */
export class Caption {
  constructor(root) {
    this.root = root;
    this.token = 0;
    this.current = null;
  }

  async show(game, index, total) {
    const token = ++this.token;
    const old = this.current;
    if (old) {
      // Retract the old words upward, quickly.
      const words = old.querySelectorAll('.mask-text__word');
      await Promise.all([...words].map((w, i) =>
        animate(w, [{ transform: 'translateY(0)' }, { transform: 'translateY(-105%)' }], { duration: 220, delay: i * 12, easing: EASE.in })
      ));
      if (token !== this.token) return;
      old.querySelectorAll('.countdown').forEach((c) => c.destroy?.());
      old.remove();
    }

    const node = h('div', { class: `caption__inner${game.specialPresentation ? ' caption__inner--vi' : ''}`, 'aria-live': 'polite' },
      h('div', { class: 'caption__meta' },
        maskedText(T().no(digits(pad(index + 1)), digits(pad(total))), 'caption__index'),
        maskedText(digits(game.year), 'caption__year'),
        maskedText(game.platform, 'caption__platform'),
        maskedText(game.setting, 'caption__genre')
      ),
      h('h2', { lang: 'en', dir: 'ltr', class: `caption__title${game.title.length > 24 ? ' caption__title--long' : ''}` }, maskedText(game.title)),
      game.releaseAt && game.releaseAt > Date.now()
        ? createCountdown(game.releaseAt, { size: 'sm', label: T().releasesIn })
        : h('p', { class: 'caption__hint' }, maskedText(game.specialPresentation ? T().openHintVi : T().openHint))
    );
    this.root.append(node);
    this.current = node;

    const words = node.querySelectorAll('.mask-text__word');
    words.forEach((w, i) =>
      animate(w, [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 650, delay: 40 + i * 35, easing: EASE.out })
    );
  }
}
