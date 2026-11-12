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
$('#cTel').href = `tel:+52${CONTACTO.telefono.replace(/\s/g, '')}`;
$('#cTel').textContent = CONTACTO.telefono;
$('#cIg').href = CONTACTO.instagram;
$('#cFb').href = CONTACTO.facebook;
$('#addr').textContent = CONTACTO.direccion;
$('#footAddr').textContent = CONTACTO.direccion;
$('#mapsLink').href = CONTACTO.maps;
$('#year').textContent = new Date().getFullYear();

/* ───────────── Image sequence ───────────── */
const FRAMES = 151;
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
  const img = frames[Math.round(i)];
  if (!img || !img.complete || !img.naturalWidth) return;
  const cw = canvas.width, ch = canvas.height;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
}

/* ───────────── Loader ───────────── */
function preload() {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = FRAMES + 1;
    const bar = $('#loaderBar'), pct = $('#loaderPct');
    const tick = () => {
      loaded++;
      const p = Math.round((loaded / total) * 100);
      bar.style.width = p + '%';
      pct.textContent = p;
      if (loaded === 1 || loaded % 10 === 0) drawFrame(seqState.frame);
      if (loaded >= total) resolve();
    };
    const hero = new Image();
    hero.onload = hero.onerror = tick;
    hero.src = '/assets/img/acceso.webp';
    for (let i = 0; i < FRAMES; i++) {
      const img = new Image();
      img.onload = img.onerror = tick;
      img.src = `/assets/seq/f${String(i + 1).padStart(3, '0')}.webp`;
      frames.push(img);
    }
    setTimeout(resolve, 7000); // nunca bloquear más de 7 s
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
      .from(['.hero__eyebrow', '.hero__sub', '.hero__ctas', '.hero__badge', '.hero__scroll', '.nav'], {
        y: 24, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
      }, '<.4');
  }
  ScrollTrigger.refresh();
});

addEventListener('resize', () => sizeCanvas());

/* ───────────── Nav ───────────── */
const nav = $('#nav');
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate(self) {
    const y = self.scroll();
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !$('#mobileMenu').classList.contains('is-open'));
    lastY = y;
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
  .to('.hero__content', { yPercent: -30, autoAlpha: 0, ease: 'none' }, 0)
  .to('.hero__badge', { y: -120, ease: 'none' }, 0);

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
    const secs = p * 8.4;
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
gsap.to('.ubi__rings i', {
  scale: 1, duration: 1.6, stagger: 0.2, ease: 'expo.out',
  scrollTrigger: { trigger: '.ubi__map', start: 'top 70%' },
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
// marcadores de módulos
[[1, 474, 128], [2, 668, 64], [3, 433, 300], [4, 625, 300], [5, 446, 572], [6, 393, 845]].forEach(([m, x, y]) => {
  const g = el('g', { class: 'mp-mark mp-mod', 'data-mod': m }, gLabels);
  el('circle', { cx: x, cy: y, r: 11 }, g);
  const t = el('text', { x, y: y + 4.5 }, g); t.textContent = m;
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
    stagger: { each: 0.018, from: 'start' },
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
  $('#mdMod').textContent = `Módulo ${nv.modulo} · ${MODULOS[nv.modulo]}`;
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

// Filtros
let fEstado = 'all', fMod = 0;
function applyFilters() {
  NAVES.forEach((nv) => {
    const ok = (fEstado === 'all' || nv.estado === fEstado) && (!fMod || nv.modulo === fMod);
    naveEls.get(nv.n).classList.toggle('is-dim', !ok);
  });
  $$('.mp__mods li').forEach((li) => li.classList.toggle('is-active', +li.dataset.mod === fMod));
}
$$('.mp__filters .chip').forEach((c) => c.addEventListener('click', () => {
  $$('.mp__filters .chip').forEach((x) => x.classList.remove('is-active'));
  c.classList.add('is-active'); fEstado = c.dataset.filter; applyFilters();
}));
$('#mpModulo').addEventListener('change', (e) => { fMod = +e.target.value; applyFilters(); });
$$('.mp__mods li').forEach((li) => li.addEventListener('click', () => {
  fMod = fMod === +li.dataset.mod ? 0 : +li.dataset.mod;
  $('#mpModulo').value = fMod; applyFilters();
}));

/* ═══════════════════ COTIZADOR ═══════════════════ */
const selNave = $('#cotNave');
const opts = disp.map((nv) => `<option value="${nv.n}">Nave ${String(nv.n).padStart(2, '0')} · ${nv.m2.toFixed(2)} m² · Módulo ${nv.modulo}</option>`).join('');
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
  lastCalc = { nv, precio, enganche, saldo, contado, iva: iva > 1 };
  $('#cotWa').href = waLink(
    `Hola, coticé en el sitio de Viza Park:\n• Nave ${nv.n} (${nv.m2.toFixed(2)} m²)\n• Precio: ${fmt(precio)}${iva > 1 ? ' IVA incl.' : ' + IVA'}\n• Enganche: ${fmt(enganche)}\n` +
    (contado ? '• Pago de contado\n' : `• ${meses} mensualidades de ${fmt(saldo / meses)}\n`) + 'Me gustaría recibir más información.'
  );
}
$('#cotPrint').addEventListener('click', () => print());

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
$('#contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const lines = [
    'Hola, quiero información de Viza Park.',
    `Nombre: ${f.get('nombre')}`,
    f.get('empresa') && `Empresa: ${f.get('empresa')}`,
    `Teléfono: ${f.get('tel')}`,
    f.get('email') && `Correo: ${f.get('email')}`,
    f.get('nave') && `Nave de interés: ${f.get('nave')}`,
    f.get('msg') && `Mensaje: ${f.get('msg')}`,
  ].filter(Boolean);
  open(waLink(lines.join('\n')), '_blank', 'noopener');
});

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
