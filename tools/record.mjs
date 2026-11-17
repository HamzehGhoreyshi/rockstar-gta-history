// Records the demo video: browse GTA IV → Chinatown Wars → Episodes, open GTA V, close it,
// pull out GTA VI, open it and scroll through Vice City.
//
// Frame-by-frame, like the other projects: the page's clock (rAF, timers, Web Animations) is
// replaced, so every frame is exactly 1/60 s after the last — no dropped frames, perfectly smooth.
// A real mouse drives the site's own cursor (hover ring, "OPEN" badge), moving like a hand:
// eased, slightly curved paths and a little tremor at rest.
//
// Needs: Google Chrome, ffmpeg, `npm i --no-save puppeteer-core`. Run `npm run build` first.
//   node tools/record.mjs <out.mp4> [css width] [css height] [output width] [lang]
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { COLLECTION } from '../src/data/games.js';

const [out, width = '1280', height = '720', outWidth = '1920', lang = 'en'] = process.argv.slice(2);
if (!out) throw new Error('usage: node tools/record.mjs <out.mp4> [css width] [css height] [output width] [lang]');
const W = Number(width), H = Number(height);
const OW = Number(outWidth), OH = Math.round((OW * H) / W / 2) * 2;
const SCALE = OW / W;
const FPS = 60;
const DIST = path.resolve('dist');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ---------- tiny file server for dist/ ----------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer(async (req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(DIST, name === '/' ? 'index.html' : name);
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });

// ---------- the page's clock, driven from here ----------
await page.evaluateOnNewDocument((startAt) => {
  const realFrame = window.requestAnimationFrame.bind(window);
  let now = 0, frames = [], timers = [], id = 1;
  const seen = new WeakSet();
  performance.now = () => now;
  Date.now = () => startAt + now; // real "today", so the GTA VI countdown shows the true time left
  window.requestAnimationFrame = (fn) => { frames.push({ id: ++id, fn }); return id; };
  window.cancelAnimationFrame = (h) => { frames = frames.filter((f) => f.id !== h); };
  const addTimer = (fn, delay, every) => { const t = { id: ++id, at: now + Math.max(0, delay || 0), fn, every }; timers.push(t); return t.id; };
  window.setTimeout = (fn, delay = 0, ...a) => addTimer(() => fn(...a), delay, 0);
  window.setInterval = (fn, delay = 0, ...a) => addTimer(() => fn(...a), delay, Math.max(1, delay));
  window.clearTimeout = window.clearInterval = (h) => { timers = timers.filter((t) => t.id !== h); };
  window.__step = (ms) => {
    now += ms;
    let due;
    while ((due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at)).length) {
      for (const t of due) {
        if (t.every) t.at += t.every; else timers = timers.filter((x) => x !== t);
        t.fn();
      }
    }
    const batch = frames; frames = [];
    for (const f of batch) f.fn(now);
    for (const a of document.getAnimations()) {
      if (a.playState === 'finished') continue;
      if (!seen.has(a)) { seen.add(a); a.pause(); a.currentTime = 0; continue; }
      const end = a.effect?.getComputedTiming().endTime ?? Infinity;
      const next = Number(a.currentTime) + ms;
      if (next >= end) a.finish(); else a.currentTime = next; // finish() resolves .finished
    }
    return new Promise((done) => realFrame(() => realFrame(done)));
  };
}, Date.now());

await page.goto(`${origin}/${lang === 'fa' ? '?lang=fa' : ''}`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

// Warm the image cache so nothing pops in on camera (covers, screenshots, the GTA VI gallery).
const urls = new Set();
for (const g of COLLECTION) {
  [g.coverFront, g.coverBack, g.innerArtwork, g.logo].filter(Boolean).forEach((u) => urls.add(u));
  (g.screenshots || []).forEach((s) => urls.add(s.thumb));
  (g.promotionalAssets || []).forEach((s) => { urls.add(s.thumb); urls.add(s.thumb.replace('imwidth=640', 'imwidth=1280')); });
  (g.trailers || []).forEach((t) => urls.add(t.thumb));
}
const loaded = await page.evaluate(async (list) => {
  window.__keep = [];
  const ok = await Promise.all(list.map((src) => new Promise((done) => { const i = new Image(); i.onload = () => done(1); i.onerror = () => done(0); i.src = src; window.__keep.push(i); })));
  return ok.reduce((a, b) => a + b, 0);
}, [...urls]);
console.log(`images cached: ${loaded}/${urls.size}`);

const step = () => page.evaluate((ms) => window.__step(ms), 1000 / FPS);
const settle = async (seconds) => { for (let i = 0; i < seconds * FPS; i++) await step(); };

// Off camera: put GTA IV in the centre.
await page.evaluate(() => document.querySelector('.timeline__stop[data-id="gta-iv"]').click());
await settle(3);
const usesSiteCursor = await page.evaluate(() => document.documentElement.classList.contains('has-cursor'));
if (!usesSiteCursor) throw new Error('site cursor is off in this browser — needs (hover: hover) and (pointer: fine)');

// ---------- filming ----------
const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', `scale=${OW}:${OH}:flags=lanczos`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const finished = new Promise((done) => ffmpeg.on('close', done));
const cdp = await page.createCDPSession();

let seed = 11;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a, b) => a + (b - a) * random();
const minJerk = (t) => t * t * t * (10 - 15 * t + 6 * t * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let mouse = { x: W * 0.5, y: H * 0.95 };
let frameNo = 0, clock = 0;
async function shoot() {
  const tx = mouse.x + 0.35 * Math.sin(clock * 1.7) + 0.2 * Math.sin(clock * 4.3 + 1);
  const ty = mouse.y + 0.3 * Math.sin(clock * 1.3 + 2) + 0.18 * Math.sin(clock * 3.7);
  await page.mouse.move(tx, ty);
  await step();
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false, clip: { x: 0, y: 0, width: W, height: H, scale: SCALE } });
  if (!ffmpeg.stdin.write(Buffer.from(data, 'base64'))) await new Promise((d) => ffmpeg.stdin.once('drain', d));
  frameNo++; clock += 1 / FPS;
  if (frameNo % 300 === 0) console.log(`${out}: ${(clock).toFixed(1)} s`);
}
async function rest(seconds) { for (let i = 0; i < Math.round(seconds * FPS); i++) await shoot(); }
async function moveTo(to, seconds = between(0.55, 0.75), bend = between(-0.14, 0.14)) {
  const from = { ...mouse }, n = Math.round(seconds * FPS);
  for (let i = 1; i <= n; i++) {
    const s = minJerk(i / n), dx = to.x - from.x, dy = to.y - from.y, arc = bend * Math.sin(Math.PI * s);
    mouse = { x: from.x + dx * s - dy * arc, y: from.y + dy * s + dx * arc };
    await shoot();
  }
}
async function click() {
  await page.mouse.move(mouse.x, mouse.y);
  await page.mouse.down(); await shoot(); await shoot(); await shoot();
  await page.mouse.up(); await shoot();
}
const rectOf = (sel) => page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel);
// The spine just right of the selected case (where the hand clicks to move on).
const nextSpine = () => page.evaluate(() => {
  const sel = document.querySelector('.slot.is-selected');
  const v = Number(sel.dataset.v) + 1;
  const r = document.querySelector(`.slot[data-v="${v}"] .face--spine`).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 };
});
const cover = async () => { const r = await rectOf('.slot.is-selected'); return { x: r.x + between(-8, 8), y: r.y - r.h * 0.05 }; };
async function scrollStage(to, seconds) {
  const from = await page.evaluate(() => document.querySelector('.stage__scroll').scrollTop);
  const n = Math.round(seconds * FPS);
  for (let i = 1; i <= n; i++) {
    const y = from + (to - from) * easeInOut(i / n);
    await page.evaluate((v) => { document.querySelector('.stage__scroll').scrollTop = v; }, y);
    await shoot();
  }
}

// ---------- the shot list ----------
await rest(1.1);                                   // GTA IV on the shelf
for (let i = 0; i < 3; i++) {                      // → Chinatown Wars → Episodes → GTA V
  await moveTo(await nextSpine(), between(0.5, 0.62));
  await rest(0.12);
  await click();
  await rest(i === 2 ? 1.0 : 0.85);
}
await moveTo(await cover(), 0.55);                 // hover GTA V: cursor turns into OPEN
await rest(0.45);
await click();                                     // open GTA V
await rest(2.6);
const close = await rectOf('.stage__close');
await moveTo({ x: close.x, y: close.y }, 0.7);
await rest(0.15);
await click();                                     // close it, back to the shelf
await rest(1.7);
await moveTo(await nextSpine(), 0.6);              // pull out GTA VI
await rest(0.12);
await click();
await rest(1.6);                                   // glow + countdown
await moveTo(await cover(), 0.6);
await rest(0.45);
await click();                                     // open GTA VI
await rest(2.4);
await moveTo({ x: W * 0.86, y: H * 0.55 }, 0.8, 0.1); // hand out of the way, then scroll Vice City
const stops = await page.evaluate(() => {
  const sc = document.querySelector('.stage__scroll');
  const y = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + sc.scrollTop - 70 : 0; };
  return { hero: y('.vi-hero'), prod: y('.production--vi'), leads: y('.vi-leads'), gallery: y('.vi-gallery-head'), max: sc.scrollHeight - sc.clientHeight };
});
await scrollStage(Math.min(stops.hero, stops.max), 1.6);     // Vice City, USA. + countdown
await rest(1.3);
await scrollStage(Math.min(stops.prod, stops.max), 1.4);     // production file
await rest(1.3);
await scrollStage(Math.min(stops.leads, stops.max), 1.4);    // Lucia & Jason
await rest(1.1);
await scrollStage(Math.min(stops.gallery, stops.max), 1.5);  // launch gallery
await rest(1.6);

ffmpeg.stdin.end();
await finished;
await browser.close();
server.close();
console.log(`${out}: done (${clock.toFixed(1)} s, ${OW}×${OH})`);
