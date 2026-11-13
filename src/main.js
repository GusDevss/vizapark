import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { NAVES, PRECIO_M2, ESQUEMA, CONTACTO, MODULOS, fmt } from './data.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ───────────── Smooth scroll ───────────── */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => (lenis ? lenis.scrollTo(target, { offset: -10 }) : $(target)?.scrollIntoView({ behavior: 'smooth' }));
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); closeMenu(); scrollTo(id); }
  })
);

/* ───────────── Contact data ───────────── */
const waLink = (msg) => `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(msg)}`;
$('#waFloat').href = waLink('Hola, me interesa información de Viza Park.');
$("#cFb").href = $("#fFb").href = CONTACTO.facebook;
$("#cWa").href = $("#fWa").href = waLink("Hola, me interesa agendar una visita a Viza Park.");
$("#cMaps").href = CONTACTO.maps;
$('#mapsLink').href = CONTACTO.maps;
$('#year').textContent = new Date().getFullYear();

/* ───────────── Image sequence ───────────── */
const FRAMES = 153;
const SEQ_SECONDS = 9;
const frames = [];
const canvas = $('#seqCanvas');
const ctx = canvas.getContext('2d');
const seqState = { frame: 0 };

function sizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  drawFrame(seqState.frame);
}
function drawFrame(i) {
  // si el cuadro aún no carga, usa el más cercano ya disponible
  let k = Math.round(i), img = frames[k];
  while (k > 0 && !(img && img.complete && img.naturalWidth)) img = frames[--k];
  if (!img || !img.complete || !img.naturalWidth) return;
  const cw = canvas.width, ch = canvas.height;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
}

/* ───────────── Loader ─────────────
   Solo espera la portada y los primeros cuadros (rápido para SEO / Core Web Vitals);
   el resto de la secuencia se descarga en segundo plano. */
const CRITICAL = 24;
function preload() {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = CRITICAL + 1;
    const bar = $('#loaderBar'), pct = $('#loaderPct');
    const tick = () => {
      loaded++;
      const p = Math.min(100, Math.round((loaded / total) * 100));
      bar.style.width = p + '%';
      pct.textContent = p;
      if (loaded === total) resolve();
    };
    const hero = new Image();
    hero.onload = hero.onerror = tick;
    hero.src = '/assets/img/hero-portada.webp';
    for (let i = 0; i < FRAMES; i++) {
      const img = new Image();
      if (i < CRITICAL) img.onload = img.onerror = () => { tick(); if (i === 0) drawFrame(seqState.frame); };
      frames.push(img);
    }
    // primero los cuadros críticos, luego el resto
    frames.forEach((img, i) => { if (i < CRITICAL) img.src = `/assets/recorrido/f${String(i + 1).padStart(3, '0')}.webp`; });
    const rest = () => frames.forEach((img, i) => { if (i >= CRITICAL) img.src = `/assets/recorrido/f${String(i + 1).padStart(3, '0')}.webp`; });
    addEventListener('load', () => setTimeout(rest, 200), { once: true });
    setTimeout(resolve, 3500); // nunca bloquear más de 3.5 s
  });
}

document.body.classList.add('is-loading');
lenis?.stop();
Promise.all([preload(), document.fonts?.ready]).then(() => {
  document.body.classList.remove('is-loading');
  lenis?.start();
  sizeCanvas();
  const tl = gsap.timeline();
  if (reduced) {
    tl.to('#loader', { autoAlpha: 0, duration: 0.3 });
  } else {
    tl.to('.loader__inner', { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power2.in' })
      .to('.loader__curtain', { scaleY: 1, duration: 0.6, ease: 'expo.inOut' }, '-=.1')
      .set('.loader', { background: 'transparent' })
      .to('.loader__curtain', { scaleY: 0, transformOrigin: 'top', duration: 0.7, ease: 'expo.inOut' })
      .set('#loader', { display: 'none' })
      .from('.hero__img', { scale: 1.45, duration: 2.2, ease: 'expo.out' }, '-=.7')
      .to('.hero__title .line > span', { y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<.1')
      .from(['.hero__logo', '.hero__rule'], { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, '<')
      .from(['.hero__sub', '.hero__ctas', '.hero__place', '.hero__scroll'], {
        y: 24, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'power3.out', clearProps: 'transform',
      }, '<.4');
  }
  ScrollTrigger.refresh();
});

addEventListener('resize', () => sizeCanvas());

/* ───────────── Nav ───────────── */
const nav = $('#nav');
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate(self) {
    nav.classList.toggle('is-scrolled', self.scroll() > 40);
    $('#navProgress').style.transform = `scaleX(${self.progress})`;
  },
});
$$('.nav__links a').forEach((a) => {
  const sec = $(a.getAttribute('href'));
  ScrollTrigger.create({
    trigger: sec, start: 'top 50%', end: 'bottom 50%',
    onToggle: (s) => a.classList.toggle('is-active', s.isActive),
  });
});
const burger = $('#burger');
function closeMenu() { $('#mobileMenu').classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
burger.addEventListener('click', () => {
  const open = !$('#mobileMenu').classList.contains('is-open');
  $('#mobileMenu').classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});

/* ───────────── Hero scroll ───────────── */
if (reduced) gsap.set('.hero__title .line > span', { y: 0 });
gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
  .to('.hero__img', { scale: 1.35, yPercent: 8, ease: 'none' }, 0)
  .to('.hero__content', { yPercent: -18, autoAlpha: 0, ease: 'none' }, 0);

/* ───────────── Sequence scroll ───────────── */
const caps = $$('.seq__cap');
const capAt = caps.map((c) => parseFloat(c.dataset.at));
let activeCap = -1;
ScrollTrigger.create({
  trigger: '#recorrido', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate(self) {
    const p = self.progress;
    seqState.frame = p * (FRAMES - 1);
    drawFrame(seqState.frame);
    $('#seqTrack').style.transform = `scaleX(${p})`;
    const secs = p * SEQ_SECONDS;
    $('#seqTime').textContent = `00:${String(Math.floor(secs)).padStart(2, '0')}:${String(Math.floor((secs % 1) * 24)).padStart(2, '0')}`;
    let idx = -1;
    capAt.forEach((at, i) => { if (p >= at) idx = i; });
    if (p > 0.97) idx = -1;
    if (idx !== activeCap) {
      if (activeCap >= 0) gsap.to(caps[activeCap], { autoAlpha: 0, y: -30, duration: 0.45, ease: 'power2.in', overwrite: true });
      if (idx >= 0) gsap.fromTo(caps[idx], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'expo.out', overwrite: true });
      activeCap = idx;
    }
  },
});

/* ───────────── Manifesto: palabras ───────────── */
const man = $('#manifesto');
man.innerHTML = man.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
gsap.to('#manifesto .w', {
  opacity: 1, stagger: 0.1, ease: 'none',
  scrollTrigger: { trigger: man, start: 'top 80%', end: 'bottom 45%', scrub: true },
});

/* Counters */
$$('[data-count]').forEach((el) => {
  const target = parseFloat(el.dataset.count);
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(obj, {
      v: target, duration: reduced ? 0 : 2, ease: 'power3.out',
      onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString('es-MX')),
    }),
  });
});

/* Generic reveals */
gsap.utils.toArray('.section .eyebrow, .section .h2, .section .lead, .radio, .specs li, .amen li, .stat').forEach((el) => {
  gsap.from(el, {
    y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});

/* ───────────── Horizontal gallery ───────────── */
const track = $('#hgalTrack');
const mm = gsap.matchMedia();
mm.add('(min-width: 0px)', () => {
  const dist = () => track.scrollWidth - innerWidth;
  const tween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '#galeria', pin: '.hgal__sticky', start: 'top top', end: () => '+=' + dist(), scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (s) => ($('#hgalBar').style.transform = `scaleX(${s.progress})`),
    },
  });
  $$('.hgal__img img').forEach((img) => {
    gsap.fromTo(img, { xPercent: -14 }, {
      xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
    });
  });
});

/* ───────────── Nave tipo ───────────── */
gsap.set('.pin, .ubi__rings i', { xPercent: -50, yPercent: -50, scale: reduced ? 1 : 0 });
gsap.timeline({ scrollTrigger: { trigger: '#nave', start: 'top 65%' } })
  .to('.nave__plan-frame', { clipPath: 'inset(0% 0 0 0 round 18px)', duration: 1.4, ease: 'expo.inOut' })
  .to('.pin', { scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(2)' }, '-=.3');

/* ───────────── Integral ───────────── */
gsap.timeline({ scrollTrigger: { trigger: '#integral', start: 'top 70%' } })
  .to('.integral__img', { clipPath: 'inset(0 0% 0 0 round 24px)', duration: 1.5, ease: 'expo.inOut' })
  .to('.integral__img img', { scale: 1, duration: 2, ease: 'expo.out' }, '-=1');

/* ───────────── Ubicación ───────────── */
$$('.ubi .tab').forEach((t) => t.addEventListener('click', () => {
  $$('.ubi .tab').forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', String(x === t)); });
  $$('.ubi__img').forEach((img) => img.classList.toggle('is-on', img.dataset.map === t.dataset.map));
}));
gsap.from('.ubi__map', {
  clipPath: 'inset(12% 12% 12% 12% round 24px)', duration: 1.6, ease: 'expo.out',
  scrollTrigger: { trigger: '.ubi__map', start: 'top 75%' },
});
gsap.from('.places li', {
  y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out',
  scrollTrigger: { trigger: '.places', start: 'top 85%' },
});

/* ───────────── Sectores (órbita) ───────────── */
const ring = $('#orbitRing');
const orbitSpans = $$('span', ring);
const orbitObj = { r: 0 };
function layoutOrbit() {
  const R = ring.clientWidth * 0.42;
  orbitSpans.forEach((sp, i) => {
    const a = ((i * 36 + orbitObj.r - 90) * Math.PI) / 180;
    gsap.set(sp, { xPercent: -50, yPercent: -50, x: Math.cos(a) * R, y: Math.sin(a) * R });
  });
}
layoutOrbit();
addEventListener('resize', layoutOrbit);
gsap.to(orbitObj, {
  r: 180, ease: 'none',
  scrollTrigger: { trigger: '#sectores', start: 'top bottom', end: 'bottom top', scrub: true },
  onUpdate: layoutOrbit,
});
gsap.from('.orbit__ring span', {
  scale: 0, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: 'back.out(2)',
  scrollTrigger: { trigger: '#orbit', start: 'top 70%' },
});

/* Contact parallax */
gsap.fromTo('.contact__bg img', { yPercent: -10 }, {
  yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#contacto', start: 'top bottom', end: 'bottom top', scrub: true },
});

/* ═══════════════════ MASTER PLAN ═══════════════════ */
const SVGNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
};
const ptsStr = (pts) => pts.map((p) => p.join(',')).join(' ');
const base = $('#mpBase'), gNaves = $('#mpNaves'), gLabels = $('#mpLabels');

// Terreno y contexto
const SITE = [[485, 30], [775, 30], [775, 995], [70, 990], [-35, 980]];
el('polygon', { points: ptsStr(SITE), class: 'mp-site' }, base);
el('polygon', { points: '485,30 515,30 -7,980 -35,980', class: 'mp-green' }, base);
el('rect', { x: 722, y: 30, width: 53, height: 965, class: 'mp-green' }, base);
el('rect', { x: 500, y: 30, width: 26, height: 60, class: 'mp-green' }, base);
// árboles
const rand = gsap.utils.random;
for (let i = 0; i < 22; i++) {
  const y = 50 + i * 43;
  el('circle', { cx: 748 + rand(-12, 12), cy: y, r: rand(7, 13), class: 'mp-tree' }, base);
}
for (let i = 0; i < 16; i++) {
  const y = 70 + i * 56;
  const x = 515 - 0.55 * (y - 30) - 15;
  el('circle', { cx: x + rand(-5, 5), cy: y, r: rand(6, 10), class: 'mp-tree' }, base);
}
// vialidades (líneas guía)
['M545 0 V552', 'M230 553 H705', 'M100 825 H705', 'M703 260 V825', 'M380 284 H705'].forEach((d) =>
  el('path', { d, class: 'mp-dash' }, base)
);
// andén común
el('rect', { x: 520, y: 405, width: 40, height: 108, rx: 3, class: 'mp-anden' }, base);
// caseta
el('rect', { x: 532, y: 44, width: 16, height: 34, rx: 3, fill: '#a9b6cf' }, base);
const lblAcc = el('text', { x: 545, y: 14, class: 'mp-lbl', 'text-anchor': 'middle' }, base);
lblAcc.textContent = 'Acceso';
// marcadores de amenidades
[['A', 515, 60], ['B', 540, 395], ['C', 748, 22]].forEach(([t, x, y]) => {
  const g = el('g', { class: 'mp-mark' }, gLabels);
  el('circle', { cx: x, cy: y, r: 11, fill: '#f26b1d' }, g).style.fill = '#f26b1d';
  const tx = el('text', { x, y: y + 4.5 }, g); tx.textContent = t; tx.style.fill = '#fff';
});
// contorno animado
const outline = el('polygon', { points: ptsStr(SITE), class: 'mp-outline' }, gLabels);

// Naves
const naveEls = new Map();
NAVES.forEach((nv) => {
  const g = el('g', {
    class: `nv ${nv.estado === 'disponible' ? 'is-disp' : 'is-apart'}`,
    tabindex: 0, role: 'button',
    'aria-label': `Nave ${nv.n}, ${nv.m2} metros cuadrados, ${nv.estado}`,
  }, gNaves);
  el('polygon', { points: ptsStr(nv.pts) }, g);
  if (nv.estado === 'apartada') el('polygon', { points: ptsStr(nv.pts), class: 'nv__hatch' }, g);
  el('polygon', { points: ptsStr(nv.pts), class: 'nv__ring' }, g);
  const xs = nv.pts.map((p) => p[0]), ys = nv.pts.map((p) => p[1]);
  const cx = nv.n === 14 || nv.n === 35 ? Math.max(...xs) - 18 : (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2 + 5;
  const t = el('text', { x: cx, y: cy }, g);
  t.textContent = String(nv.n).padStart(2, '0');
  g.dataset.n = nv.n;
  naveEls.set(nv.n, g);
});

const disp = NAVES.filter((n) => n.estado === 'disponible');
const apart = NAVES.length - disp.length;
ScrollTrigger.create({
  trigger: '#masterplan', start: 'top 70%', once: true,
  onEnter() {
    const o = { a: 0, b: 0 };
    gsap.to(o, { a: disp.length, b: apart, duration: 1.8, ease: 'power3.out', onUpdate: () => {
      $('#mpDisp').textContent = Math.round(o.a); $('#mpApart').textContent = Math.round(o.b);
    } });
  },
});
// animación de entrada del plano
const len = outline.getTotalLength?.() || 3000;
gsap.set(outline, { strokeDasharray: len, strokeDashoffset: len });
gsap.timeline({ scrollTrigger: { trigger: '.mp__map', start: 'top 70%' } })
  .to(outline, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' })
  .from('#mpBase > *', { autoAlpha: 0, duration: 0.8, stagger: 0.005 }, 0.3)
  .from('.nv', {
    autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(1.8)',
    stagger: { each: 0.018, from: 'start' }, clearProps: 'opacity,visibility,transform',
  }, 0.6)
  .from('.mp-mark', { scale: 0, transformOrigin: '50% 50%', svgOrigin: undefined, duration: 0.5, stagger: 0.05, ease: 'back.out(2)' }, '-=.4');

// Tooltip
const tip = $('#mpTip'), mapBox = $('.mp__map');
const priceOf = (nv) => nv.m2 * PRECIO_M2;
function showTip(nv, evt) {
  const r = mapBox.getBoundingClientRect();
  let x, y;
  if (evt && evt.clientX) { x = evt.clientX - r.left; y = evt.clientY - r.top; }
  else { const b = naveEls.get(nv.n).getBoundingClientRect(); x = b.left + b.width / 2 - r.left; y = b.top - r.top; }
  tip.innerHTML = `<b>Nave ${nv.n}</b> · ${nv.m2.toFixed(2)} m² · ${nv.estado === 'disponible' ? '<span style="color:#2f6fd6">Disponible</span>' : '<span style="color:#c4541a">Apartada</span>'}`;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
  tip.classList.add('is-on');
}
const hideTip = () => tip.classList.remove('is-on');

// Selección
let selected = null;
function selectNave(n, { scroll = false } = {}) {
  const nv = NAVES[n - 1];
  if (selected) naveEls.get(selected).classList.remove('is-sel');
  selected = n;
  naveEls.get(n).classList.add('is-sel');
  $('#mpEmpty').hidden = true;
  const d = $('#mpDetail'); d.hidden = false;
  const isDisp = nv.estado === 'disponible';
  const badge = $('#mdBadge');
  badge.textContent = isDisp ? 'Disponible' : 'Apartada';
  badge.classList.toggle('is-apart', !isDisp);
  $('#mdNum').textContent = String(n).padStart(2, '0');
  $('#mdM2').textContent = nv.m2.toFixed(2);
  $('#mdPm2').textContent = isDisp ? fmt(PRECIO_M2) : '—';
  const p = priceOf(nv);
  $('#mdPrice').textContent = isDisp ? fmt(p) : '—';
  $('#mdEng').textContent = isDisp ? fmt(p * ESQUEMA.enganche) : '—';
  $('#mdMsi').textContent = isDisp ? fmt((p * (1 - ESQUEMA.enganche)) / ESQUEMA.meses) : '—';
  $('#mdCotizar').hidden = !isDisp;
  $('#mdWa').href = waLink(isDisp
    ? `Hola, me interesa la Nave ${n} (${nv.m2} m²) de Viza Park. ¿Me pueden dar más información?`
    : `Hola, vi que la Nave ${n} de Viza Park está apartada. ¿Tienen opciones similares?`);
  $('#mdWa').textContent = isDisp ? 'Preguntar por WhatsApp' : 'Pedir naves similares';
  gsap.fromTo('#mpDetail > *', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' });
  if (isDisp) { $('#cotNave').value = n; $('#contactNave').value = n; calc(); }
  if (scroll) scrollTo('#mpPanel');
}
naveEls.forEach((g, n) => {
  const nv = NAVES[n - 1];
  g.addEventListener('mousemove', (e) => showTip(nv, e));
  g.addEventListener('mouseleave', hideTip);
  g.addEventListener('focus', () => showTip(nv));
  g.addEventListener('blur', hideTip);
  g.addEventListener('click', () => selectNave(n, { scroll: innerWidth < 1080 }));
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNave(n); } });
});
$('#mdCotizar').addEventListener('click', () => scrollTo('#cotizador'));

// Filtros: estatus + superficie
let fEstado = 'all', fSize = 'all';
function applyFilters() {
  let count = 0;
  NAVES.forEach((nv) => {
    const okE = fEstado === 'all' || nv.estado === fEstado;
    const okS = fSize === 'all' || (fSize === 'std' ? nv.m2 <= 260 : nv.m2 > 260);
    const ok = okE && okS;
    const g = naveEls.get(nv.n);
    g.classList.toggle('is-dim', !ok);
    g.classList.remove('is-match');
    if (ok) { count++; if (fEstado !== 'all' || fSize !== 'all') { void g.getBBox(); g.classList.add('is-match'); } }
  });
  $('#mpResult').innerHTML = `Mostrando <b>${count}</b> de 64 naves`;
}
$$('.mp__filters .chip[data-filter]').forEach((c) => c.addEventListener('click', () => {
  $$('.mp__filters .chip[data-filter]').forEach((x) => x.classList.toggle('is-active', x === c));
  fEstado = c.dataset.filter; applyFilters();
}));
$$('.mp__filters .chip[data-size]').forEach((c) => c.addEventListener('click', () => {
  $$('.mp__filters .chip[data-size]').forEach((x) => x.classList.toggle('is-active', x === c));
  fSize = c.dataset.size; applyFilters();
}));
applyFilters();

/* ═══════════════════ COTIZADOR ═══════════════════ */
const selNave = $('#cotNave');
const opts = disp.map((nv) => `<option value="${nv.n}">Nave ${String(nv.n).padStart(2, '0')} · ${nv.m2.toFixed(2)} m²</option>`).join('');
selNave.innerHTML = opts;
$('#contactNave').innerHTML = `<option value="">Aún no lo sé</option>${opts}`;
const firstStd = disp.find((n) => n.m2 === 260) || disp[0];
selNave.value = firstStd.n;

let meses = ESQUEMA.meses;
const engInput = $('#cotEng');
$$('#cotMeses button').forEach((b) => b.addEventListener('click', () => {
  $$('#cotMeses button').forEach((x) => x.classList.remove('is-active'));
  b.classList.add('is-active'); meses = +b.dataset.m; calc();
}));
[selNave, engInput, $('#cotIva')].forEach((i) => i.addEventListener('input', calc));
selNave.addEventListener('change', () => { const n = +selNave.value; if (n !== selected) selectNave(n); });

const shown = {};
function tweenText(id, value) {
  const node = $(id);
  const from = shown[id] ?? 0;
  const o = { v: from };
  gsap.to(o, { v: value, duration: reduced ? 0 : 0.7, ease: 'power3.out', overwrite: true, onUpdate: () => (node.textContent = fmt(o.v)) });
  shown[id] = value;
}

let lastCalc = null;
function calc() {
  const nv = NAVES[+selNave.value - 1];
  const eng = +engInput.value / 100;
  engInput.style.setProperty('--p', ((+engInput.value - 30) / 70) * 100 + '%');
  const iva = $('#cotIva').checked ? 1 + ESQUEMA.iva : 1;
  const base = nv.m2 * PRECIO_M2;
  const precio = base * iva;
  const enganche = precio * eng;
  const saldo = precio - enganche;
  const contado = eng >= 1;
  $('#cotMeses').classList.toggle('is-disabled', contado);
  $('#cotEngLbl').textContent = contado ? 'Contado' : `${Math.round(eng * 100)} %`;
  $('#cotMesesLbl').textContent = contado ? '—' : `${meses} meses`;
  $('#cotIvaTag').textContent = iva > 1 ? 'IVA incluido' : 'antes de IVA';
  $('#cotM2').textContent = nv.m2.toFixed(2);
  $('#cotPm2').textContent = fmt(PRECIO_M2);
  tweenText('#cotPrecio', precio);
  tweenText('#cotEnganche', enganche);
  tweenText('#cotSaldo', saldo);
  tweenText('#cotMensual', contado ? 0 : saldo / meses);
  tweenText('#cotRenta', (base * ESQUEMA.retornoRenta) / 12);
  renderChart(base);
  const plan = amortizacion(enganche, saldo, contado ? 0 : meses);
  renderAmort(plan, contado);
  lastCalc = { nv, base, precio, enganche, saldo, contado, iva: iva > 1, meses, plan };
  $('#cotWa').href = waLink(
    `Hola, coticé en el sitio de Viza Park:\n• Nave ${nv.n} (${nv.m2.toFixed(2)} m²)\n• Precio: ${fmt(precio)}${iva > 1 ? ' IVA incl.' : ' + IVA'}\n• Enganche: ${fmt(enganche)}\n` +
    (contado ? '• Pago de contado\n' : `• ${meses} mensualidades de ${fmt(saldo / meses)}\n`) + 'Me gustaría recibir más información.'
  );
}
/* Tabla de amortización (meses sin intereses) */
const fecha = (d) => d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }).replace('.', '');
function amortizacion(enganche, saldo, n) {
  const hoy = new Date();
  const rows = [{ k: 0, fecha: 'A la firma', concepto: 'Enganche', monto: enganche, resta: saldo }];
  if (!n) return rows;
  const pago = Math.floor((saldo / n) * 100) / 100;
  let resta = saldo;
  for (let k = 1; k <= n; k++) {
    const monto = k === n ? Math.round(resta * 100) / 100 : pago;
    resta = Math.max(0, resta - monto);
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + k, 1);
    rows.push({ k, fecha: fecha(d), concepto: `Mensualidad ${k} de ${n}`, monto, resta });
  }
  return rows;
}
const money = (v) => v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
function renderAmort(rows, contado) {
  $('#amortBody').innerHTML = rows.map((r) =>
    `<tr><td>${r.k}</td><td>${r.fecha}</td><td>${r.concepto}</td><td>${money(r.monto)}</td><td>${money(r.resta)}</td></tr>`).join('');
  $('#amortTotal').textContent = money(rows.reduce((s, r) => s + r.monto, 0));
  $('#amortSum').textContent = contado ? 'Pago único de contado' : `${rows.length - 1} mensualidades sin intereses`;
}

/* Medidas de referencia: módulo de 10.40 m de frente (plano arquitectónico) */
const FRENTE = 10.4;
const IRREGULAR = [14, 35];
function medidas(nv) {
  if (IRREGULAR.includes(nv.n)) return { irregular: true, frente: FRENTE, fondo: 25 };
  return { irregular: false, frente: FRENTE, fondo: nv.m2 / FRENTE };
}

/* Plano del parque para el PDF con la nave elegida resaltada */
function planoPDF(sel) {
  const pts = (p) => p.map((q) => q.join(',')).join(' ');
  const naves = NAVES.map((nv) => {
    const isSel = nv.n === sel.n;
    const fill = isSel ? '#f26b1d' : nv.estado === 'disponible' ? '#c9d8f2' : '#d5d8df';
    const xs = nv.pts.map((p) => p[0]), ys = nv.pts.map((p) => p[1]);
    const cx = IRREGULAR.includes(nv.n) ? Math.max(...xs) - 18 : (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2 + 4;
    return `<polygon points="${pts(nv.pts)}" fill="${fill}" stroke="#fff" stroke-width="2"/>` +
      (nv.estado === 'apartada' && !isSel ? `<polygon points="${pts(nv.pts)}" fill="url(#h)"/>` : '') +
      `<text x="${cx}" y="${cy}" font-size="${isSel ? 15 : 11}" font-weight="700" text-anchor="middle" fill="${isSel ? '#fff' : '#55607a'}">${String(nv.n).padStart(2, '0')}</text>`;
  }).join('');
  const s = sel.pts, sx = s.map((p) => p[0]), sy = s.map((p) => p[1]);
  const mx = (Math.min(...sx) + Math.max(...sx)) / 2, my = (Math.min(...sy) + Math.max(...sy)) / 2;
  return `<svg viewBox="-45 0 830 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ubicación de la nave ${sel.n} en el master plan">
<defs><pattern id="h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#9aa1b0" stroke-width="2"/></pattern></defs>
<polygon points="485,30 775,30 775,995 70,990 -35,980" fill="#f1f3f7" stroke="#9aa1b0" stroke-width="2"/>
<polygon points="485,30 515,30 -7,980 -35,980" fill="#cfe0c3"/><rect x="722" y="30" width="53" height="965" fill="#cfe0c3"/>
<rect x="520" y="405" width="40" height="108" fill="url(#h)" stroke="#9aa1b0"/>
<text x="545" y="20" font-size="16" font-weight="700" text-anchor="middle" fill="#55607a">ACCESO</text>
${naves}
<circle cx="${mx}" cy="${my}" r="46" fill="none" stroke="#f26b1d" stroke-width="4" stroke-dasharray="8 6"/>
</svg>`;
}

/* Dibujo de la nave con cotas */
function cotasPDF(nv) {
  const m = medidas(nv);
  const W = 420, H = 210, L = 70, T = 30;
  const fondoPx = 300, frentePx = Math.min(150, fondoPx * (m.frente / m.fondo));
  const x0 = L, y0 = T + (150 - frentePx) / 2, x1 = x0 + fondoPx, y1 = y0 + frentePx;
  const shape = m.irregular
    ? `<polygon points="${x0 + 70},${y0} ${x1},${y0} ${x1},${y1} ${x0},${y1}" fill="#fde7da" stroke="#f26b1d" stroke-width="3"/>`
    : `<rect x="${x0}" y="${y0}" width="${fondoPx}" height="${frentePx}" fill="#fde7da" stroke="#f26b1d" stroke-width="3"/>`;
  const fmtM = (v) => v.toFixed(2) + ' m';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Medidas de la nave ${nv.n}">
<defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0a1530"/></marker></defs>
${shape}
<rect x="${x1 - 6}" y="${y0 + frentePx * 0.3}" width="6" height="${frentePx * 0.4}" fill="#0a1530"/>
<text x="${x1 - 12}" y="${y0 + frentePx * 0.3 - 6}" font-size="10" text-anchor="end" fill="#55607a">Cortina / andén</text>
<text x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2}" font-size="17" font-weight="800" text-anchor="middle" fill="#0a1530">NAVE ${String(nv.n).padStart(2, '0')}</text>
<text x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + 20}" font-size="14" text-anchor="middle" fill="#c4541a" font-weight="700">${nv.m2.toFixed(2)} m²</text>
<line x1="${x0}" y1="${y1 + 22}" x2="${x1}" y2="${y1 + 22}" stroke="#0a1530" marker-start="url(#a)" marker-end="url(#a)"/>
<text x="${(x0 + x1) / 2}" y="${y1 + 38}" font-size="13" font-weight="700" text-anchor="middle" fill="#0a1530">Fondo ${m.irregular ? 'variable' : fmtM(m.fondo)}</text>
<line x1="${x0 - 22}" y1="${y0}" x2="${x0 - 22}" y2="${y1}" stroke="#0a1530" marker-start="url(#a)" marker-end="url(#a)"/>
<text x="${x0 - 30}" y="${(y0 + y1) / 2}" font-size="13" font-weight="700" text-anchor="middle" fill="#0a1530" transform="rotate(-90 ${x0 - 30} ${(y0 + y1) / 2})">Frente ${fmtM(m.frente)}</text>
</svg>`;
}

/* PDF de la cotización: documento limpio en un iframe oculto */
function cotizacionHTML(c) {
  const m = medidas(c.nv);
  const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const folio = `VP-${c.nv.n}-${Date.now().toString().slice(-6)}`;
  const vals = [1, 2, 3].map((i) => c.base * (1 + ESQUEMA.plusvaliaAnual) ** i);
  const row = (a, b, hl) => `<tr${hl ? ' class="hl"' : ''}><th>${a}</th><td>${b}</td></tr>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Cotización Viza Park · Nave ${c.nv.n}</title>
<style>
@page{size:letter;margin:14mm}
*{box-sizing:border-box}body{font:12px/1.45 Inter,Arial,sans-serif;color:#0a1530;margin:0}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f26b1d;padding-bottom:12px;margin-bottom:18px}
header img{height:54px}header div{text-align:right;color:#55607a;font-size:11px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#2c5fa8;margin:18px 0 8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border-bottom:1px solid #e3e6ee;text-align:left}td{text-align:right;font-variant-numeric:tabular-nums}
.sum th{font-weight:500;color:#55607a}.hl th,.hl td{font-weight:700;color:#c4541a}
.am thead th{background:#0a1530;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.06em}.am td,.am th{font-size:11px;padding:4px 8px}
.am td:nth-child(-n+3),.am th:nth-child(-n+3){text-align:left}.am tr{page-break-inside:avoid}.am tfoot th,.am tfoot td{font-weight:700;border-top:2px solid #0a1530}
.box{background:#f4f1ea;border-radius:8px;padding:12px 14px}.big{font-size:26px;font-weight:800;margin:2px 0}
footer{margin-top:18px;padding-top:10px;border-top:1px solid #e3e6ee;font-size:10px;color:#6b7590}
.plan{display:grid;grid-template-columns:250px 1fr;gap:18px;align-items:center;page-break-inside:avoid}
.plan svg{width:100%;height:auto;display:block}.plan .map{border:1px solid #e3e6ee;border-radius:8px;padding:6px}
.legend{display:flex;gap:10px;white-space:nowrap;font-size:9.5px;color:#55607a;margin-top:6px}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.specs{font-size:11px;color:#55607a;margin:6px 0 0}.specs b{color:#0a1530}
.am-wrap{page-break-before:always}
</style></head><body>
<header><img src="${location.origin}/assets/brand/logo-alt.png" alt="Viza Park"><div><b>Cotización ${folio}</b><br>${hoy}<br>Tel. ${CONTACTO.telefono}</div></header>
<h1>Nave ${String(c.nv.n).padStart(2, '0')} · ${c.nv.m2.toFixed(2)} m²</h1>
<div>Parque industrial Viza Park · ${CONTACTO.direccion}</div>
<div class="grid">
 <div><h2>Resumen</h2><div class="box"><div>Precio de lista ${c.iva ? '(IVA incluido)' : '(antes de IVA)'}</div><div class="big">${money(c.precio)}</div><div>${c.nv.m2.toFixed(2)} m² × ${money(PRECIO_M2)} por m²</div></div>
  <table class="sum">${row('Enganche', money(c.enganche))}${row('Saldo', money(c.saldo))}${c.contado ? row('Forma de pago', 'Contado') : row(`${c.meses} mensualidades sin intereses de`, money(c.saldo / c.meses), true)}${row('Renta mensual estimada (10 % anual)', money((c.base * ESQUEMA.retornoRenta) / 12))}</table></div>
 <div><h2>Proyección del activo</h2><table class="sum">${row('Valor hoy', money(c.base))}${vals.map((v, i) => row(`Año ${i + 1}`, money(v))).join('')}</table>
  <p style="color:#6b7590;font-size:10px">Plusvalía estimada de ${(ESQUEMA.plusvaliaAnual * 100).toFixed(2)} % anual.</p></div>
</div>
<h2>Tu nave en el master plan</h2>
<div class="plan">
 <div class="map">${planoPDF(c.nv)}
  <div class="legend"><span><i style="background:#f26b1d"></i>Tu nave</span><span><i style="background:#c9d8f2"></i>Disponible</span><span><i style="background:#d5d8df"></i>Apartada</span></div></div>
 <div>${cotasPDF(c.nv)}
  <p class="specs"><b>Superficie:</b> ${c.nv.m2.toFixed(2)} m² · <b>Frente:</b> ${m.frente.toFixed(2)} m · <b>Fondo:</b> ${m.irregular ? 'variable (nave en esquina, forma irregular)' : m.fondo.toFixed(2) + ' m'}</p>
  <p class="specs">Incluye recepción, sanitario, almacén, 3 cajones de estacionamiento y rampa para andén. Medidas de referencia; consulta el plano ejecutivo para medidas definitivas.</p></div>
</div>
<div class="am-wrap">
<h2>Tabla de amortización</h2>
<table class="am"><thead><tr><th>Pago</th><th>Fecha estimada</th><th>Concepto</th><th>Monto</th><th>Saldo restante</th></tr></thead><tbody>
${c.plan.map((r) => `<tr><td>${r.k}</td><td>${r.fecha}</td><td>${r.concepto}</td><td>${money(r.monto)}</td><td>${money(r.resta)}</td></tr>`).join('')}
</tbody><tfoot><tr><th colspan="3">Total</th><td>${money(c.plan.reduce((s, r) => s + r.monto, 0))}</td><td></td></tr></tfoot></table>
</div>
<footer>Cotización ilustrativa con vigencia sujeta a disponibilidad. Precios y proyecciones sujetos a cambio sin previo aviso; las proyecciones de plusvalía y renta son estimaciones y no garantizan rendimientos futuros. Desarrolla ARREY.</footer>
</body></html>`;
}
$('#cotPrint').addEventListener('click', () => {
  if (!lastCalc) calc();
  $('#printFrame')?.remove();
  const f = document.createElement('iframe');
  f.id = 'printFrame';
  f.setAttribute('aria-hidden', 'true');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(f);
  const doc = f.contentDocument;
  doc.open(); doc.write(cotizacionHTML(lastCalc)); doc.close();
  const go = () => { f.contentWindow.focus(); f.contentWindow.print(); };
  const img = doc.querySelector('img');
  if (img && !img.complete) { img.onload = img.onerror = go; } else setTimeout(go, 150);
});

// Gráfica de proyección
const chartPlot = $('#chartPlot'), chartTip = $('#chartTip');
$('#chartRate').textContent = (ESQUEMA.plusvaliaAnual * 100).toFixed(2) + ' %';
const CW = 600, CH = 230, PL = 56, PB = 28, PT = 26;
const svgC = el('svg', { viewBox: `0 0 ${CW} ${CH}` });
chartPlot.appendChild(svgC);
const gGrid = el('g', {}, svgC), gBars = el('g', {}, svgC);
const labelsY = ['Hoy', 'Año 1', 'Año 2', 'Año 3'];
const barEls = labelsY.map((l, i) => {
  const g = el('g', {}, gBars);
  const slot = (CW - PL) / 4;
  const x = PL + slot * i + slot / 2;
  const hit = el('rect', { x: x - slot / 2, y: PT, width: slot, height: CH - PT - PB, class: 'hit' }, g);
  const path = el('path', { class: 'bar' + (i === 0 ? ' is-base' : '') }, g);
  const lbl = el('text', { x, y: CH - 8, class: 'lbl' }, g); lbl.textContent = l;
  const val = el('text', { x, class: 'val' }, g);
  return { g, x, hit, path, val, h: 0 };
});
const roundTop = (x, y, w, h, r = 4) => h <= 0 ? '' :
  `M${x - w / 2},${y + h} V${y + r} Q${x - w / 2},${y} ${x - w / 2 + r},${y} H${x + w / 2 - r} Q${x + w / 2},${y} ${x + w / 2},${y + r} V${y + h} Z`;
function renderChart(base) {
  const vals = labelsY.map((_, i) => base * (1 + ESQUEMA.plusvaliaAnual) ** i);
  const max = Math.ceil((vals[3] * 1.12) / 1e6) * 1e6;
  const sy = (v) => ((CH - PT - PB) * v) / max;
  gGrid.innerHTML = '';
  const steps = 4;
  for (let k = 0; k <= steps; k++) {
    const v = (max / steps) * k, y = CH - PB - sy(v);
    el('line', { x1: PL, x2: CW, y1: y, y2: y, class: 'grid' }, gGrid);
    const t = el('text', { x: PL - 10, y: y + 4, class: 'ax' }, gGrid); t.textContent = `$${(v / 1e6).toFixed(1)} M`;
  }
  const tbody = $('#chartTable tbody'); tbody.innerHTML = '';
  barEls.forEach((b, i) => {
    const target = sy(vals[i]);
    const o = { h: b.h };
    gsap.to(o, {
      h: target, duration: reduced ? 0 : 0.9, delay: i * 0.06, ease: 'expo.out', overwrite: true,
      onUpdate: () => { b.h = o.h; b.path.setAttribute('d', roundTop(b.x, CH - PB - o.h, 54, o.h)); },
    });
    b.val.setAttribute('y', CH - PB - target - 10);
    b.val.textContent = i === 0 || i === 3 ? `$${(vals[i] / 1e6).toFixed(2)} M` : '';
    const gain = vals[i] - vals[0];
    b.hit.onmousemove = (e) => {
      const r = chartPlot.parentElement.getBoundingClientRect();
      chartTip.innerHTML = `<b>${labelsY[i]}</b> · ${fmt(vals[i])}${i ? ` <span style="color:#2f6fd6">(+${fmt(gain)})</span>` : ''}`;
      chartTip.style.left = e.clientX - r.left + 'px'; chartTip.style.top = e.clientY - r.top + 'px';
      chartTip.classList.add('is-on');
    };
    b.hit.onmouseleave = () => chartTip.classList.remove('is-on');
    tbody.insertAdjacentHTML('beforeend', `<tr><th>${labelsY[i]}</th><td>${fmt(vals[i])}</td></tr>`);
  });
}
ScrollTrigger.create({ trigger: '#cotizador', start: 'top 70%', once: true, onEnter: calc });
calc();

/* ═══════════════════ CONTACTO ═══════════════════ */
const form = $('#contactForm'), formMsg = $('#formMsg');
const setMsg = (txt, ok) => { formMsg.textContent = txt; formMsg.className = 'form-msg ' + (ok ? 'is-ok' : 'is-err'); };
function validate(needEmail) {
  let ok = true;
  ['nombre', 'tel', 'email'].forEach((n) => {
    const i = form.elements[n];
    const bad = n === 'email' ? (needEmail && !i.checkValidity()) || (i.value && !i.checkValidity()) || (needEmail && !i.value) : !i.value.trim();
    i.classList.toggle('is-invalid', bad);
    if (bad) ok = false;
  });
  if (!ok) setMsg(needEmail ? 'Completa nombre, teléfono y un correo válido.' : 'Completa nombre y teléfono.', false);
  return ok;
}
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate(true)) return;
  const btn = form.querySelector('[data-via="email"]');
  btn.disabled = true; btn.textContent = 'Enviando…'; setMsg('', true);
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({ ok: false, msg: 'No pudimos enviar el correo. Escríbenos por WhatsApp, por favor.' }));
    setMsg(data.msg, data.ok);
    if (data.ok) form.reset();
  } catch {
    setMsg('No pudimos enviar el correo. Escríbenos por WhatsApp, por favor.', false);
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar por correo';
  }
});
form.querySelector('[data-via="wa"]').addEventListener('click', () => {
  if (!validate(false)) return;
  const f = new FormData(form);
  const lines = [
    'Hola, quiero información de Viza Park.',
    `Nombre: ${f.get('nombre')}`,
    f.get('empresa') && `Empresa: ${f.get('empresa')}`,
    `Teléfono: ${f.get('tel')}`,
    f.get('email') && `Correo: ${f.get('email')}`,
    f.get('nave') && `Nave de interés: Nave ${f.get('nave')}`,
    f.get('msg') && `Mensaje: ${f.get('msg')}`,
  ].filter(Boolean);
  open(waLink(lines.join('\n')), '_blank', 'noopener');
  setMsg('Abrimos WhatsApp con tu mensaje listo para enviar.', true);
});

/* ═══════════════════ FAQ: solo una abierta a la vez ═══════════════════ */
$$('.faq__item').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) $$('.faq__item').forEach((o) => { if (o !== d && o.open) o.open = false; });
}));

/* ═══════════════════ VIDEO MODAL ═══════════════════ */
const modal = $('#videoModal');
function openVideo() {
  $('#videoFrame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${CONTACTO.youtube}?autoplay=1&rel=0" title="Recorrido virtual Viza Park" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  modal.hidden = false; lenis?.stop();
  gsap.fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
}
function closeVideo() {
  gsap.to(modal, { autoAlpha: 0, duration: 0.3, onComplete: () => { modal.hidden = true; $('#videoFrame').innerHTML = ''; } });
  lenis?.start();
}
$$('[data-video]').forEach((b) => b.addEventListener('click', openVideo));
$('.modal__close').addEventListener('click', closeVideo);
modal.addEventListener('click', (e) => { if (e.target === modal) closeVideo(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeVideo(); });

/* ═══════════════════ CURSOR + MAGNETIC ═══════════════════ */
if (finePointer && !reduced) {
  const cur = $('#cursor');
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
  addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });
  document.addEventListener('mouseover', (e) => cur.classList.toggle('is-hover', !!e.target.closest('a, button, .nv, select, input, label')));
  $$('.magnetic').forEach((m) => {
    const mx = gsap.quickTo(m, 'x', { duration: 0.5, ease: 'elastic.out(1, .4)' });
    const my = gsap.quickTo(m, 'y', { duration: 0.5, ease: 'elastic.out(1, .4)' });
    m.addEventListener('mousemove', (e) => {
      const r = m.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.3);
    });
    m.addEventListener('mouseleave', () => { mx(0); my(0); });
  });
}
