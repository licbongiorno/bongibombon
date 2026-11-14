// Set de ilustraciones originales de Bongi Bombón (SVG 64×64).
// Se usan en el hero, en los juegos (DOM y canvas) y como iconografía.
// Agregar una golosina nueva = sumar una entrada acá.

const S = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
const shine = (x, y, rx = 5, ry = 2.6, r = -25) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".55" transform="rotate(${r} ${x} ${y})"/>`;

export const CANDIES = {
  caramelo: { name: 'Caramelo', kind: 'dulce', color: '#ef476f', svg: S(`
    <path d="M15 32 4 22c-1-1 0-2.6 1.4-2.4L17 22v20L5.4 44.4C4 44.6 3 43 4 42z" fill="#ffd166"/>
    <path d="m49 32 11-10c1-1 0-2.6-1.4-2.4L47 22v20l11.6 2.4c1.4.2 2.4-1.4 1.4-2.4z" fill="#ffd166"/>
    <ellipse cx="32" cy="32" rx="17" ry="14.5" fill="#ef476f"/>
    <path d="M22 20.5c-2.6 3.4-4 7.2-4 11.5s1.4 8.1 4 11.5M32 17.5v29M42 20.5c2.6 3.4 4 7.2 4 11.5s-1.4 8.1-4 11.5" stroke="#fff" stroke-width="3" fill="none"/>${shine(26, 25)}`) },
  chupetin: { name: 'Chupetín', kind: 'dulce', color: '#ff6b35', svg: S(`
    <rect x="29.5" y="36" width="5" height="26" rx="2.5" fill="#f3e6d8" stroke="#d8c3ad" stroke-width="1"/>
    <circle cx="32" cy="24" r="20" fill="#ff6b35"/>
    <path d="M32 24m0-2a2 2 0 1 1-2 2 4 4 0 0 1 4-4 6 6 0 0 1 6 6 8 8 0 0 1-8 8 10 10 0 0 1-10-10 12 12 0 0 1 12-12 14 14 0 0 1 14 14" stroke="#ffd166" stroke-width="3.2" fill="none" stroke-linecap="round"/>${shine(24, 14, 5, 2.4)}`) },
  chocolate: { name: 'Chocolate', kind: 'dulce', color: '#7a3e2b', svg: S(`
    <path d="M10 18h44v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#ef476f"/>
    <path d="M14 8h36a4 4 0 0 1 4 4v20H10V12a4 4 0 0 1 4-4" fill="#7a3e2b"/>
    <path d="M14 10h10v9H14zM27 10h10v9H27zM40 10h10v9H40zM14 21h10v9H14zM27 21h10v9H27zM40 21h10v9H40z" fill="#9b5639"/>
    <path d="M10 32h44v6H10z" fill="#c41e4a"/><path d="M22 46h20" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/>`) },
  gomita: { name: 'Gomita', kind: 'dulce', color: '#06d6a0', svg: S(`
    <g fill="#06d6a0"><circle cx="21" cy="13" r="6"/><circle cx="43" cy="13" r="6"/><circle cx="32" cy="21" r="12"/>
    <ellipse cx="32" cy="44" rx="15" ry="15"/><circle cx="17" cy="35" r="6"/><circle cx="47" cy="35" r="6"/><circle cx="21" cy="56" r="6.5"/><circle cx="43" cy="56" r="6.5"/></g>
    <circle cx="27.5" cy="19" r="2" fill="#045d47"/><circle cx="36.5" cy="19" r="2" fill="#045d47"/>
    <path d="M29 25.5q3 2.4 6 0" stroke="#045d47" stroke-width="2" fill="none" stroke-linecap="round"/>${shine(25, 38, 4, 2)}`) },
  alfajor: { name: 'Alfajor', kind: 'dulce', color: '#5b2d1f', svg: S(`
    <ellipse cx="32" cy="42" rx="25" ry="10" fill="#4a2318"/>
    <rect x="7" y="27" width="50" height="15" fill="#4a2318"/>
    <rect x="7" y="31" width="50" height="5" fill="#d99a52"/>
    <ellipse cx="32" cy="27" rx="25" ry="10" fill="#6b3524"/>
    <path d="M18 25q6-4 12 0t12 0" stroke="#8a4a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>${shine(22, 24, 5, 1.8, -8)}`) },
  confite: { name: 'Confites', kind: 'dulce', color: '#ffd166', svg: S(`
    <ellipse cx="22" cy="40" rx="14" ry="11" fill="#06d6a0"/><ellipse cx="42" cy="42" rx="14" ry="11" fill="#ef476f"/>
    <ellipse cx="32" cy="24" rx="14" ry="11" fill="#ffd166"/>${shine(27, 20, 4, 2)}${shine(37, 38, 4, 2)}${shine(17, 36, 4, 2)}`) },
  bombon: { name: 'Bombón', kind: 'dulce', color: '#4a2318', svg: S(`
    <path d="M10 36h44l-5 20H15z" fill="#ef476f"/><path d="M14 36l3 20M22 36l2 20M30 36l1 20M38 36l-1 20M46 36l-3 20" stroke="#c41e4a" stroke-width="2"/>
    <circle cx="32" cy="31" r="17" fill="#4a2318"/><path d="M20 24q12-9 24 0" stroke="#7a3e2b" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="15" r="3.5" fill="#ffd166"/>${shine(25, 26, 4, 2)}`) },
  chicle: { name: 'Chicle', kind: 'dulce', color: '#ff8fb1', svg: S(`
    <circle cx="32" cy="30" r="22" fill="#ff8fb1"/><circle cx="32" cy="30" r="22" fill="none" stroke="#ef476f" stroke-width="2" opacity=".5"/>
    <path d="M24 52h16l-2 6H26z" fill="#ff8fb1"/>${shine(23, 20, 7, 3.5)}<circle cx="41" cy="36" r="2.5" fill="#fff" opacity=".6"/>`) },
  regaliz: { name: 'Regaliz', kind: 'dulce', color: '#d62839', svg: S(`
    <g transform="rotate(-35 32 32)"><rect x="26" y="2" width="12" height="60" rx="6" fill="#d62839"/>
    <path d="M26 10l12 6M26 20l12 6M26 30l12 6M26 40l12 6M26 50l12 6" stroke="#9e1b2b" stroke-width="3"/>
    <rect x="28" y="4" width="3" height="54" rx="1.5" fill="#fff" opacity=".35"/></g>`) },
  malvavisco: { name: 'Malvavisco', kind: 'dulce', color: '#ffc2d1', svg: S(`
    <rect x="12" y="16" width="40" height="36" rx="12" fill="#fff"/><ellipse cx="32" cy="18" rx="20" ry="8" fill="#ffe3ea"/>
    <rect x="12" y="16" width="40" height="36" rx="12" fill="none" stroke="#ffc2d1" stroke-width="3"/>
    <path d="M18 30v14" stroke="#ffc2d1" stroke-width="3" stroke-linecap="round"/>`) },
  paleta: { name: 'Paletita', kind: 'dulce', color: '#ffd166', svg: S(`
    <rect x="29.5" y="40" width="5" height="22" rx="2.5" fill="#f3e6d8" stroke="#d8c3ad"/>
    <rect x="16" y="4" width="32" height="40" rx="9" fill="#06d6a0"/><rect x="16" y="17" width="32" height="14" fill="#ffd166"/>
    <path d="M16 31h32v4a9 9 0 0 1-9 9H25a9 9 0 0 1-9-9z" fill="#ef476f"/>${shine(23, 10, 3, 1.6, -60)}`) },
  mielcita: { name: 'Mielcita', kind: 'dulce', color: '#f4a300', svg: S(`
    <path d="M8 22h48v20H8z" fill="#ffe7a8" opacity=".9"/><path d="M8 22 2 16v32l6-6zM56 22l6-6v32l-6-6z" fill="#ffe7a8"/>
    <rect x="14" y="20" width="36" height="24" rx="5" fill="#f4a300"/>${shine(22, 26, 5, 2, -10)}`) },
  // Snacks (sector copetín)
  papas: { name: 'Papas fritas', kind: 'copetin', color: '#ffd166', svg: S(`
    <path d="M14 14h36l-4 46H18z" fill="#ef476f"/><path d="M20 8c4 2 4 10 0 14M28 4c4 3 3 12-1 16M36 6c3 3 3 11-1 15M44 9c3 3 1 10-3 13" stroke="#ffd166" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M14 14h36l-1 10H15z" fill="#c41e4a"/><circle cx="32" cy="40" r="8" fill="#ffd166"/>`) },
  // Objetos especiales de los juegos
  estrella: { name: 'Estrella dorada', kind: 'especial', color: '#ffd166', svg: S(`
    <path d="m32 4 8.5 17.5L60 24 46 37.6 49.3 57 32 47.8 14.7 57 18 37.6 4 24l19.5-2.5z" fill="#ffd166" stroke="#f4a300" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="26" cy="31" r="2.5" fill="#3b1f2b"/><circle cx="38" cy="31" r="2.5" fill="#3b1f2b"/><path d="M27 38q5 4 10 0" stroke="#3b1f2b" stroke-width="2.4" fill="none" stroke-linecap="round"/>`) },
  reloj: { name: 'Reloj', kind: 'especial', color: '#06d6a0', svg: S(`
    <circle cx="32" cy="34" r="24" fill="#06d6a0"/><circle cx="32" cy="34" r="18" fill="#fff"/><rect x="27" y="4" width="10" height="7" rx="2" fill="#06d6a0"/>
    <path d="M32 22v12l8 5" stroke="#3b1f2b" stroke-width="3.5" stroke-linecap="round" fill="none"/>`) },
  brocoli: { name: 'Brócoli', kind: 'malo', color: '#2d9b46', svg: S(`
    <path d="M26 34h12l3 24H23z" fill="#9bd26b"/>
    <g fill="#2d9b46"><circle cx="20" cy="26" r="11"/><circle cx="44" cy="26" r="11"/><circle cx="32" cy="18" r="13"/><circle cx="32" cy="32" r="9"/></g>
    <circle cx="27" cy="22" r="2" fill="#173f22"/><circle cx="37" cy="22" r="2" fill="#173f22"/><path d="M27 30q5-3 10 0" stroke="#173f22" stroke-width="2.2" fill="none" stroke-linecap="round"/>`) },
  aji: { name: 'Ají picante', kind: 'malo', color: '#d62839', svg: S(`
    <path d="M40 12c-2-6 4-9 8-6" stroke="#2d9b46" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M42 14c8 6 4 22-6 32S12 60 8 56s10-8 18-18 8-26 16-24" fill="#d62839"/>
    <path d="M36 20c-2 8-6 16-14 24" stroke="#fff" stroke-width="2.5" opacity=".45" fill="none" stroke-linecap="round"/>`) },
  piedra: { name: 'Piedra', kind: 'malo', color: '#8d8a93', svg: S(`
    <path d="M10 44 16 22l16-10 18 8 6 22-14 12H22z" fill="#8d8a93"/><path d="M16 22l16 8 18-10M32 30l-4 24" stroke="#6e6b74" stroke-width="2.4" fill="none"/>`) }
};

export const SWEET_IDS = ['caramelo', 'chupetin', 'chocolate', 'gomita', 'alfajor', 'confite', 'bombon', 'chicle', 'regaliz', 'malvavisco', 'paleta', 'mielcita'];

export function candySVG(id) { return CANDIES[id]?.svg || ''; }

const cache = new Map();
/** Devuelve un HTMLImageElement listo para dibujar en canvas. */
export function candyImage(id) {
  if (cache.has(id)) return cache.get(id);
  const img = new Image();
  img.decoding = 'async';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CANDIES[id].svg);
  const p = img.decode ? img.decode().then(() => img).catch(() => img) : Promise.resolve(img);
  cache.set(id, { img, ready: p });
  return cache.get(id);
}
export function preload(ids) { return Promise.all(ids.map(id => candyImage(id).ready)); }
