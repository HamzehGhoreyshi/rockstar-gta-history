/** Tiny DOM builder: h('div', { class: 'x', onclick }, child, 'text') */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) {
        if (p.startsWith('--')) el.style.setProperty(p, val);
        else el.style[p] = val;
      }
    } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const mod = (n, m) => ((n % m) + m) % m;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const pad = (n) => String(n).padStart(2, '0');

/** Wrap each word in a mask so it can slide up from behind a clip. */
export function maskedText(text, cls = '') {
  return h(
    'span',
    { class: `mask-text ${cls}`, 'aria-label': text },
    text.split(' ').map((w, i) =>
      h('span', { class: 'mask-text__clip', 'aria-hidden': 'true' },
        h('span', { class: 'mask-text__word', style: { '--i': i } }, w)
      )
    )
  );
}
