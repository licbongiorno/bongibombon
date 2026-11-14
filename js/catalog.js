// Catálogo: filtros por sector, lista de favoritos (en este dispositivo)
// y envío de la lista por WhatsApp. No hay carrito ni pagos: la venta se cierra en el local.
import { track } from './analytics.js';

const KEY = 'bb.favoritos';
const cfg = JSON.parse(document.getElementById('bb-config').textContent);
const cards = [...document.querySelectorAll('#catalogo .jar')];
const chips = [...document.querySelectorAll('[data-filter]')];
const empty = document.querySelector('[data-empty]');
const status = document.querySelector('[data-filter-status]');
const bar = document.querySelector('[data-list-bar]');
const send = document.querySelector('[data-list-send]');

const load = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* sin almacenamiento */ } };
let favs = load();
let current = 'todo';

function applyFilter(f) {
  current = f;
  chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
  let shown = 0;
  for (const card of cards) {
    const ok = f === 'todo' || (f === 'lista' ? favs.has(card.id) : card.dataset.sector === f);
    card.hidden = !ok; if (ok) shown++;
  }
  empty.hidden = !(f === 'lista' && shown === 0);
  status.textContent = `${shown} categorías visibles`;
  const url = new URL(location.href);
  if (f === 'dulce' || f === 'copetin') url.searchParams.set('sector', f); else url.searchParams.delete('sector');
  history.replaceState(null, '', url);
}

function paintFavs() {
  for (const btn of document.querySelectorAll('[data-fav]')) {
    const on = favs.has(btn.dataset.fav);
    const name = btn.closest('.jar').dataset.name;
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('use').setAttribute('href', `/assets/brand/iconos.svg#${on ? 'heart' : 'heart-line'}`);
    btn.querySelector('.sr-only').textContent = on ? `Quitar ${name} de mi lista` : `Agregar ${name} a mi lista`;
  }
  document.querySelectorAll('[data-fav-count]').forEach(el => (el.textContent = `(${favs.size})`));
  document.querySelector('[data-fav-total]').textContent = String(favs.size);
  bar.hidden = favs.size === 0;
  const names = cards.filter(c => favs.has(c.id)).map(c => `• ${c.dataset.name}`);
  const msg = `¡Hola Bongi Bombón! Quiero consultar precios y variedades de:\n${names.join('\n')}`;
  send.href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
}

document.addEventListener('click', e => {
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    const id = fav.dataset.fav;
    if (favs.has(id)) favs.delete(id); else { favs.add(id); track('favorite_add', { label: id }); }
    save(favs); paintFavs();
    fav.classList.remove('is-bump'); void fav.offsetWidth; fav.classList.add('is-bump');
    if (current === 'lista') applyFilter('lista');
    return;
  }
  const chip = e.target.closest('[data-filter]');
  if (chip) { applyFilter(chip.dataset.filter); return; }
  if (e.target.closest('[data-filter-reset]')) applyFilter('todo');
  if (e.target.closest('[data-list-send]')) track('list_send', { label: String(favs.size) });
});

const sector = new URLSearchParams(location.search).get('sector');
applyFilter(sector === 'dulce' || sector === 'copetin' ? sector : 'todo');
paintFavs();

// Si se llega con #categoria, resaltarla brevemente
if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.classList.contains('jar')) {
    target.animate?.([{ boxShadow: '0 0 0 6px #ffd166' }, { boxShadow: '0 0 0 0 #ffd166' }], { duration: 1600, delay: 300 });
    track('category_view', { label: target.id });
  }
}
