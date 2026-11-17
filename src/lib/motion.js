/** Motion helpers shared by every animated component. */

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => mq.matches;

/** Durations shrink to almost nothing when the user asks for reduced motion. */
export const dur = (ms) => (prefersReducedMotion() ? Math.min(ms, 1) : ms);

export const EASE = {
  out: 'cubic-bezier(.16,1,.3,1)',
  inOut: 'cubic-bezier(.65,0,.25,1)',
  hinge: 'cubic-bezier(.55,.05,.2,1)',
  in: 'cubic-bezier(.5,0,.75,0)',
};

/** Web Animations API wrapper that resolves when finished and commits the end state. */
export function animate(el, keyframes, opts) {
  if (!el) return Promise.resolve();
  const a = el.animate(keyframes, { fill: 'both', ...opts, duration: dur(opts.duration ?? 400) });
  return a.finished.then(() => a).catch(() => a);
}

/** Critically-damped-ish spring integrated per frame. */
export class Spring {
  constructor(value = 0, { stiffness = 140, damping = 24 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }
  step(dt) {
    if (prefersReducedMotion()) {
      this.value = this.target;
      this.velocity = 0;
      return;
    }
    // Sub-step for stability on slow frames.
    const n = Math.ceil(dt / (1 / 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const f = this.stiffness * (this.target - this.value) - this.damping * this.velocity;
      this.velocity += f * h;
      this.value += this.velocity * h;
    }
  }
  get settled() {
    return Math.abs(this.target - this.value) < 0.0005 && Math.abs(this.velocity) < 0.0005;
  }
}
