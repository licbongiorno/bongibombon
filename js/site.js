// Comportamiento compartido por todas las páginas.
import { initAnalytics } from './analytics.js?v=cfab42284a';

const config = JSON.parse(document.getElementById('bb-config')?.textContent || '{}');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Menú móvil ---------- */
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('menu');
if (toggle && menu) {
  const setOpen = open => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
}

/* ---------- Horario: abierto / cerrado en hora de Córdoba ---------- */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ES = { Monday: 'lunes', Tuesday: 'martes', Wednesday: 'miércoles', Thursday: 'jueves', Friday: 'viernes', Saturday: 'sábado', Sunday: 'domingo' };
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmt = hhmm => hhmm.replace(/^0/, '').replace(':00', '') + ' h';

export function storeStatus(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: config.tz || 'America/Argentina/Cordoba', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = t => parts.find(p => p.type === t)?.value;
  const day = get('weekday');
  const mins = Number(get('hour')) * 60 + Number(get('minute'));
  const today = (config.hours || []).filter(h => h.days.includes(day)).sort((a, b) => toMin(a.opens) - toMin(b.opens));
  const current = today.find(h => mins >= toMin(h.opens) && mins < toMin(h.closes));
  if (current) {
    const left = toMin(current.closes) - mins;
    return { state: 'open', day, text: left <= 30 ? `Abierto: cerramos a las ${fmt(current.closes)}, ¡vení ya!` : `Abierto ahora · hasta las ${fmt(current.closes)}` };
  }
  const later = today.find(h => mins < toMin(h.opens));
  if (later) return { state: 'closed', day, text: `Cerrado ahora · abrimos hoy a las ${fmt(later.opens)}` };
  for (let i = 1; i <= 7; i++) {
    const d = DAYS[(DAYS.indexOf(day) + i) % 7];
    const first = (config.hours || []).filter(h => h.days.includes(d)).sort((a, b) => toMin(a.opens) - toMin(b.opens))[0];
    if (first) return { state: 'closed', day, text: `Cerrado ahora · abrimos ${i === 1 ? 'mañana' : 'el ' + DAY_ES[d]} a las ${fmt(first.opens)}` };
  }
  return { state: 'closed', day, text: 'Cerrado' };
}

function paintStatus() {
  const s = storeStatus();
  document.querySelectorAll('[data-store-status]').forEach(el => {
    el.dataset.state = s.state;
    const t = el.querySelector('[data-status-text]');
    if (t) t.textContent = s.text;
  });
  document.querySelectorAll('.hours tr[data-day]').forEach(tr => tr.classList.toggle('is-today', tr.dataset.day.split(',').includes(s.day)));
}
paintStatus();
setInterval(paintStatus, 60_000);

/* ---------- Aparición escalonada (una vez por grupo) ---------- */
const groups = document.querySelectorAll('.pop-in');
groups.forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', String(i % 12))));
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  groups.forEach(g => io.observe(g));
} else groups.forEach(g => g.classList.add('is-in'));

/* ---------- Mapa diferido: el iframe de Google Maps solo carga si se pide ---------- */
document.querySelectorAll('[data-map-src]').forEach(box => {
  box.querySelector('button')?.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = box.dataset.mapSrc;
    f.title = 'Mapa de Bongi Bombón en Jujuy 868, Río Segundo';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.allowFullscreen = true;
    box.append(f);
    box.querySelector('button')?.closest('div')?.remove();
  }, { once: true });
});

/* ---------- Hero interactivo (solo en la home) ---------- */
const heroCanvas = document.querySelector('.hero__canvas');
if (heroCanvas) import('./hero.js?v=cfab42284a').then(m => m.startHero(heroCanvas, { reduceMotion }));

initAnalytics();
