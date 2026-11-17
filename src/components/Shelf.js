import { h, mod, clamp, smoothstep } from '../lib/dom.js';
import { Spring, prefersReducedMotion } from '../lib/motion.js';
import { createCase, hydrateImages } from './GameCase.js';
import { MAX_CASE_MM, CASE_MM } from '../data/games.js';
import { T } from '../i18n.js';

/**
 * Endless shelf.
 *
 * `pos` is a continuous number: 3.0 means item 3 sits in the centre slot.
 * A spring eases `pos` toward `target`. Every frame we place a window of
 * "virtual" slots around pos (…, -1, 0, 1, …); slot v shows item v mod N,
 * so the shelf never ends. Slot elements are created when they enter the
 * window and recycled when they leave.
 */
export class Shelf {
  constructor(root, { onSelect, onOpen, onHoverState }) {
    this.root = root;
    this.onSelect = onSelect;
    this.onOpen = onOpen;
    this.onHoverState = onHoverState;
    this.items = [];
    this.slots = new Map(); // virtual index -> { el, item }
    this.spring = new Spring(0, { stiffness: 150, damping: 25 });
    this.hovered = null;
    this.locked = false;
    this.selectedIndex = -1;

    this.viewport = h('div', { class: 'shelf__viewport' });
    this.world = h('div', { class: 'shelf__world' });
    this.plank = h('div', { class: 'shelf__plank', 'aria-hidden': 'true' },
      h('div', { class: 'shelf__plank-top' }),
      h('div', { class: 'shelf__plank-front' })
    );
    this.track = h('div', { class: 'shelf__track', role: 'listbox', 'aria-label': 'Game collection', tabindex: '0' });
    this.world.append(this.plank, this.track);
    this.viewport.append(this.world);
    root.append(this.viewport);

    this.measure();
    this.bind();
    this.last = performance.now();
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  /* ---------- sizing ---------- */
  measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // H = case height; width and depth follow the shared case size in millimetres.
    const H = Math.round(clamp(Math.min(vh * (vw < 560 ? 0.38 : 0.46), (vw * 0.62) / 0.75), 220, 480));
    this.H = H;
    this.unit = H / MAX_CASE_MM; // px per millimetre
    this.W = Math.round(CASE_MM.w * this.unit);
    this.D = Math.round(14 * this.unit * 1.3);
    this.root.style.setProperty('--w', `${this.W}px`);
    this.root.style.setProperty('--h', `${H}px`);
    this.root.style.setProperty('--d', `${this.D}px`);
    this.computeSizes();
  }

  /** Real-world case sizes → px, and cumulative spine positions along the shelf. */
  computeSizes() {
    const u = this.unit;
    const gap = 3;
    this.sizes = (this.items || []).map((g) => {
      const e = g.editionInfo;
      // Spines are a touch thicker than life so titles stay readable.
      return { w: Math.round(e.w * u), h: Math.round(e.h * u), d: Math.max(14, Math.round(e.d * u * 1.3)) };
    });
    this.cum = [];
    let acc = 0;
    // GTA VI sits in line with the rest; it stands out through its glow, not extra space.
    const sep = 0;
    this.sep = sep;
    this.sizes.forEach((sz, i) => {
      const special = this.items[i].specialPresentation;
      if (special) acc += sep;
      this.cum.push(acc);
      acc += sz.d + gap + (special ? sep : 0);
    });
    this.total = acc || 1;
    const N = this.sizes.length || 1;
    this.pitch = this.total / N; // average — used to convert drag pixels into items
    this.radius = Math.min(20, Math.ceil(window.innerWidth / 2 / this.pitch) + 3);
  }

  /** Centre of virtual slot v measured along the shelf (endless: repeats every `total`). */
  centerOf(v) {
    const N = this.items.length;
    const i = mod(v, N);
    return Math.floor(v / N) * this.total + this.cum[i] + this.sizes[i].d / 2;
  }

  sizeAt(p) {
    const N = this.items.length;
    const a = this.sizes[mod(Math.floor(p), N)];
    const b = this.sizes[mod(Math.floor(p) + 1, N)];
    const f = p - Math.floor(p);
    const ia = this.items[mod(Math.floor(p), N)].specialPresentation ? 1 : 0;
    const ib = this.items[mod(Math.floor(p) + 1, N)].specialPresentation ? 1 : 0;
    return { special: ia + (ib - ia) * f, w: a.w + (b.w - a.w) * f, d: a.d + (b.d - a.d) * f, center: this.centerOf(Math.floor(p)) + (this.centerOf(Math.floor(p) + 1) - this.centerOf(Math.floor(p))) * f };
  }

  /* ---------- data ---------- */
  setItems(items, focusId) {
    this.items = items;
    this.computeSizes();
    this.slots.forEach((s) => s.el.remove());
    this.slots.clear();
    const idx = Math.max(0, items.findIndex((g) => g.id === focusId));
    this.spring.value = this.spring.target = idx;
    this.spring.velocity = 0;
    this.selectedIndex = -1;
    this.layout(true);
  }

  get current() {
    return this.items[mod(Math.round(this.spring.target), this.items.length)];
  }

  go(delta) {
    if (this.locked) return;
    this.spring.target = Math.round(this.spring.target) + delta;
  }

  goTo(virtualIndex) {
    if (this.locked) return;
    this.spring.target = virtualIndex;
  }

  /** Bounding rect of the centred case (used to start the open animation from it). */
  /** Jump to an item by its index, taking the shortest way round the endless shelf. */
  goToIndex(i) {
    if (this.locked) return;
    const N = this.items.length;
    const t = Math.round(this.spring.target);
    let delta = mod(i - t, N);
    if (delta > N / 2) delta -= N;
    this.spring.target = t + delta;
  }

  selectedSlot() {
    const v = Math.round(this.spring.target);
    return this.slots.get(v);
  }

  /* ---------- input ---------- */
  bind() {
    const vp = this.viewport;
    let drag = null;

    vp.addEventListener('pointerdown', (e) => {
      if (this.locked || e.button !== 0) return;
      drag = { x: e.clientX, pos: this.spring.value, moved: false, lastX: e.clientX, lastT: performance.now(), v: 0, id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        vp.setPointerCapture?.(e.pointerId);
        vp.classList.add('is-dragging');
      }
      if (drag.moved) {
        const now = performance.now();
        const dt = Math.max(1, now - drag.lastT);
        drag.v = 0.8 * drag.v + 0.2 * ((e.clientX - drag.lastX) / dt); // px per ms
        drag.lastX = e.clientX;
        drag.lastT = now;
        const p = drag.pos - dx / this.pitch;
        this.spring.value = this.spring.target = p;
        this.spring.velocity = 0;
      }
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.classList.remove('is-dragging');
      if (drag.moved) {
        const fling = (-drag.v * 260) / this.pitch; // momentum in items
        this.spring.target = Math.round(this.spring.value + clamp(fling, -8, 8));
        this.justDragged = true;
        setTimeout(() => (this.justDragged = false), 50);
      }
      drag = null;
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    this.track.addEventListener('click', (e) => {
      if (this.justDragged || this.locked) return;
      const slotEl = e.target.closest('.slot');
      if (!slotEl) return;
      const v = Number(slotEl.dataset.v);
      if (v === Math.round(this.spring.target) && Math.abs(this.spring.value - v) < 0.3) this.onOpen?.();
      else this.goTo(v);
    });

    // Wheel: accumulate small trackpad deltas into whole steps.
    let acc = 0;
    let lastStep = 0;
    vp.addEventListener('wheel', (e) => {
      if (this.locked) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      acc += d;
      const now = performance.now();
      const threshold = 70;
      if (Math.abs(acc) >= threshold && now - lastStep > 70) {
        this.go(Math.sign(acc));
        acc = 0;
        lastStep = now;
      }
    }, { passive: false });

    this.track.addEventListener('pointerover', (e) => {
      const slotEl = e.target.closest('.slot');
      this.hovered = slotEl ? Number(slotEl.dataset.v) : null;
      if (!slotEl) return this.onHoverState?.(null);
      const sel = this.hovered === Math.round(this.spring.target);
      this.onHoverState?.(sel ? 'open' : 'spine');
    });
    this.track.addEventListener('pointerleave', () => {
      this.hovered = null;
      this.onHoverState?.(null);
    });

    window.addEventListener('resize', () => {
      this.measure();
      this.slots.forEach((sl) => sl.el.remove());
      this.slots.clear();
      this.layout(true);
    });
  }

  /* ---------- frame loop ---------- */
  tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) {
      const was = this.spring.value;
      this.spring.step(dt);
      if (Math.abs(was - this.spring.value) > 1e-5 || this.dirty) this.layout();
    }
    requestAnimationFrame(this.tick);
  }

  layout(force = false) {
    const N = this.items.length;
    if (!N) return;
    const pos = this.spring.value;
    const centre = Math.round(pos);
    const { H, D, radius } = this;
    const selScale = 1.14;
    const here = this.sizeAt(pos); // interpolated size/centre of the case being pulled out
    // Room opened around the pulled-out case. GTA VI already has its own air on the
    // shelf (this.sep), so don't add both when it is the one being pulled out.
    const extra = Math.max(0, (here.w * selScale) / 2 + D * 0.9 - here.d / 2 - this.sep * here.special);
    const live = new Set();
    let anyHoverMotion = false;

    for (let v = centre - radius; v <= centre + radius; v++) {
      live.add(v);
      let slot = this.slots.get(v);
      const item = this.items[mod(v, N)];
      const sz = this.sizes[mod(v, N)];
      if (!slot) {
        const el = h('div', {
          class: 'slot', 'data-v': v, role: 'option',
          'aria-label': `${item.title}, ${item.year}, ${item.platform}`,
          style: { '--w': `${sz.w}px`, '--h': `${sz.h}px`, '--d': `${sz.d}px` },
        }, item.specialPresentation ? viAura() : null, createCase(item, { variant: 'shelf' }));
        if (item.specialPresentation) el.classList.add('slot--vi');
        slot = { el, item, hover: 0, hydrated: false };
        this.slots.set(v, slot);
        this.track.append(el);
      }
      const d = v - pos;
      const ad = Math.abs(d);
      if (!slot.hydrated && ad < 9) {
        hydrateImages(slot.el);
        slot.hydrated = true;
      }

      // Selection amount: 1 at centre → 0 one slot away.
      const s = smoothstep(clamp(1 - ad, 0, 1));
      const spread = Math.sign(d) * extra * smoothstep(clamp(ad, 0, 1));
      const x = this.centerOf(v) - here.center + spread;

      // Hover lift (eased per slot).
      const hoverTarget = this.hovered === v && s < 0.5 && !this.locked ? 1 : 0;
      slot.hover += (hoverTarget - slot.hover) * (prefersReducedMotion() ? 1 : 0.2);
      if (Math.abs(hoverTarget - slot.hover) > 0.002) anyHoverMotion = true;

      const floor = (H - sz.h) / 2; // every case stands on the shelf, whatever its height
      const y = floor - s * H * 0.07 - slot.hover * H * 0.045;
      const z = s * D * 3.2 + slot.hover * D * 0.6;
      const rot = 90 * (1 - s) + Math.sign(d) * -2 * (1 - s); // tiny lean = perspective variety
      const scale = 1 + (selScale - 1) * s;

      slot.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      slot.el.style.zIndex = String(1000 - Math.round(ad * 10));
      if (item.specialPresentation) slot.el.style.setProperty('--rot', rot.toFixed(2)); // aura faces the viewer
      const glare = (1 - s).toFixed(3);
      if (slot.glare !== glare) {
        slot.el.style.setProperty('--glare', glare);
        slot.glare = glare;
      }
      const isSel = v === Math.round(this.spring.target);
      if (slot.isSel !== isSel) {
        slot.isSel = isSel;
        slot.el.classList.toggle('is-selected', isSel);
        slot.el.setAttribute('aria-selected', String(isSel));
        if (isSel) this.track.setAttribute('aria-activedescendant', slot.el.id = `slot-${mod(v, N)}-${v}`);
      }
    }

    for (const [v, slot] of this.slots) {
      if (!live.has(v)) {
        slot.el.remove();
        this.slots.delete(v);
      }
    }
    this.dirty = anyHoverMotion;

    const sel = mod(Math.round(this.spring.target), N);
    if (sel !== this.selectedIndex || force) {
      this.selectedIndex = sel;
      this.onSelect?.(this.items[sel], sel, N);
    }
  }

  setHidden(v, hidden) {
    const slot = this.slots.get(v);
    if (slot) slot.el.style.visibility = hidden ? 'hidden' : '';
  }
}

/** Atmosphere behind GTA VI on the shelf: sunset glow, slow light rays, drifting sparks. */
function viAura() {
  const sparks = Array.from({ length: 18 }, (_, i) =>
    h('i', { class: 'vi-aura__spark', style: {
      '--x': `${(Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 100}%`,
      '--d': `${4 + (i % 5) * 1.3}s`,
      '--delay': `${-(i * 0.73) % 6}s`,
      '--s': `${2 + (i % 3)}px`,
    } })
  );
  return h('div', { class: 'vi-aura', 'aria-hidden': 'true' },
    h('div', { class: 'vi-aura__glow' }),
    h('div', { class: 'vi-aura__rays' }),
    h('div', { class: 'vi-aura__sparks' }, sparks),
    h('div', { class: 'vi-aura__pool' }),
    h('span', { class: 'vi-aura__tag' }, T().nextChapter)
  );
}
