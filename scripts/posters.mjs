// Ilustraciones (SVG en línea) de las tarjetas de Bongi Arcade.
// Se componen con el set de golosinas de js/candies.js más el motivo de cada juego.
import { CANDIES } from '../js/candies.js';

const inner = id => CANDIES[id].svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const c = (id, x, y, s = 40, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><svg x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" viewBox="0 0 64 64">${inner(id)}</svg></g>`;
const bongi = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-5 10l-1 7M5 10l1 7" stroke="#3b1f2b" stroke-width="3" stroke-linecap="round"/><circle r="13" fill="#5b2d1f"/><circle cx="-3" cy="-3" r="9" fill="#7a3e2b"/><path d="M-13 3Q0 16 13 3v3Q0 19-13 6z" fill="#ef476f"/><circle cx="1" cy="-14" r="3" fill="#ffd166"/><circle cx="4" cy="-2" r="3.4" fill="#fff"/><circle cx="-4" cy="-2" r="3.4" fill="#fff"/><circle cx="5" cy="-2" r="1.7" fill="#3b1f2b"/><circle cx="-3" cy="-2" r="1.7" fill="#3b1f2b"/><path d="M-3 3a4 4 0 0 0 8 0" stroke="#fff" stroke-width="1.6" fill="none"/></g>`;
const wrap = (bg, body) => `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="320" height="180" fill="${bg}"/>${body}</svg>`;

export const POSTERS = {
  crush: () => wrap('#4a2550', (() => {
    const ids = ['caramelo', 'gomita', 'confite', 'chupetin', 'bombon', 'chicle'];
    let s = '<rect x="70" y="10" width="180" height="160" rx="16" fill="rgba(255,255,255,.08)"/>';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) s += c(ids[(r * 2 + k * 3) % 6], 90 + k * 35, 30 + r * 38, 32);
    return s + '<circle cx="230" cy="40" r="20" fill="#ffd166" opacity=".35"/>';
  })()),
  world: () => wrap('#7fd3ff', `<circle cx="270" cy="38" r="22" fill="#ffd166"/><path d="M0 140h320v40H0z" fill="#7a3e2b"/><path d="M0 140h320v8H0z" fill="#9b5639"/>
    <rect x="150" y="70" width="22" height="22" rx="4" fill="#ffd166" stroke="#c98a00" stroke-width="3"/><text x="161" y="87" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="16" fill="#7a3e2b">?</text>
    <rect x="196" y="98" width="70" height="14" rx="7" fill="#ef476f"/><path d="M40 140c10-40 40-40 50 0z" fill="#5b2d1f"/>${bongi(110, 120, 1.4)}${c('gomita', 230, 128, 26)}${c('mielcita', 222, 80, 20)}`),
  maze: () => wrap('#1d1030', `<g fill="none" stroke="#7ae0ff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".9"><path d="M20 20h120v40M180 20h120v60h-60M20 70v90h100M160 160h140V110M60 60v50h50M200 110h-40v-30"/></g>
    ${[...Array(9)].map((_, i) => `<circle cx="${40 + i * 30}" cy="90" r="4" fill="#ffd166"/>`).join('')}${bongi(55, 90, .95)}${c('chocolate', 245, 90, 34)}${c('gomita', 280, 40, 26)}`),
  blocks: () => wrap('#24323f', (() => {
    const col = ['#ef476f', '#ffd166', '#06d6a0', '#7ae0ff', '#ff6b35', '#c9a0ff'];
    const cells = [[0, 3, 0], [1, 3, 0], [2, 3, 1], [3, 3, 1], [4, 3, 2], [6, 3, 3], [0, 2, 4], [1, 2, 4], [2, 2, 1], [5, 2, 5], [6, 2, 3], [4, 0, 2], [4, 1, 2], [5, 1, 2]];
    return '<rect x="96" y="6" width="128" height="168" fill="rgba(255,255,255,.06)"/>' + cells.map(([x, y, k]) => `<rect x="${100 + x * 17}" y="${106 + y * 17}" width="16" height="16" rx="5" fill="${col[k]}"/><circle cx="${105 + x * 17}" cy="${111 + y * 17}" r="2.5" fill="#fff" opacity=".6"/>`).join('') + c('confite', 60, 60, 40, -20) + c('confite', 270, 120, 34, 30);
  })()),
  breaker: () => wrap('#3b1f2b', (() => {
    const col = ['#ef476f', '#ffd166', '#06d6a0', '#7ae0ff', '#ff8fb1'];
    let s = '';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) s += `<rect x="${18 + k * 36}" y="${16 + r * 18}" width="32" height="14" rx="5" fill="${col[(r + k) % 5]}"/>`;
    return s + '<rect x="120" y="152" width="84" height="12" rx="6" fill="#d62839"/><path d="M126 158h72" stroke="#9e1b2b" stroke-width="3" stroke-dasharray="6 6"/><circle cx="182" cy="118" r="10" fill="#4a2318"/><circle cx="185" cy="108" r="3" fill="#ffd166"/>';
  })()),
  bombi: () => wrap('#2f6b3a', (() => {
    let s = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) {
      const px = 10 + x * 34, py = 6 + y * 34;
      if (x % 2 && y % 2) s += `<rect x="${px}" y="${py}" width="32" height="32" rx="6" fill="#5b2d1f"/>`;
      else if ((x * 7 + y * 3) % 5 === 0) s += `<rect x="${px + 2}" y="${py + 2}" width="28" height="28" rx="8" fill="#ff8fb1"/><path d="M${px + 8} ${py + 10}h16M${px + 8} ${py + 20}h16" stroke="#fff" stroke-width="3" opacity=".6"/>`;
    }
    return s + bongi(94, 90, 1.1) + '<circle cx="150" cy="90" r="12" fill="#3b1f2b"/><path d="M150 78q4-8 10-6" stroke="#ffd166" stroke-width="3" fill="none"/><g fill="#ffd166"><circle cx="196" cy="90" r="10"/><circle cx="230" cy="90" r="8" opacity=".7"/></g>';
  })()),
  pong: () => wrap('#5b2d1f', `<rect x="10" y="10" width="300" height="160" rx="18" fill="#7a3e2b"/><path d="M160 18v144" stroke="#ffd9a8" stroke-width="4" stroke-dasharray="10 10"/>
    <rect x="24" y="52" width="14" height="70" rx="7" fill="#06d6a0"/><rect x="282" y="70" width="14" height="70" rx="7" fill="#ef476f"/>
    <circle cx="200" cy="80" r="11" fill="#4a2318" stroke="#ffd166" stroke-width="3"/><text x="120" y="54" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="34" fill="#ffd9a8">3</text><text x="200" y="54" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="34" fill="#ffd9a8">2</text>`),
  candyof: () => wrap('#2b3a1f', `<path d="M0 150h320v30H0z" fill="#5b2d1f"/><rect x="20" y="70" width="80" height="80" rx="6" fill="#ef476f"/><path d="M20 70l40-30 40 30z" fill="#c41e4a"/><rect x="48" y="110" width="24" height="40" fill="#ffd166"/>
    ${bongi(140, 120, 1.3)}<rect x="152" y="110" width="30" height="10" rx="5" fill="#06d6a0"/>
    <g fill="#ffd166"><circle cx="198" cy="114" r="4"/><circle cx="216" cy="110" r="4" fill="#ef476f"/><circle cx="234" cy="106" r="4" fill="#7ae0ff"/></g>
    <g transform="translate(270 96)"><circle r="22" fill="#d4e157"/><circle cx="-8" cy="-5" r="5" fill="#fff"/><circle cx="8" cy="-5" r="5" fill="#fff"/><circle cx="-7" cy="-4" r="2.4" fill="#3b1f2b"/><circle cx="9" cy="-4" r="2.4" fill="#3b1f2b"/><path d="M-8 9q8-6 16 0" stroke="#3b1f2b" stroke-width="2.5" fill="none"/><path d="M-4-22q4-10 12-8" stroke="#2d9b46" stroke-width="4" fill="none"/></g>`)
};
