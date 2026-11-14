// Genera assets/brand/frasco.svg: el frasco de golosinas del hero, compuesto
// con las mismas ilustraciones de js/candies.js. Uso: node scripts/frasco.mjs
import { writeFileSync } from 'node:fs';
import { CANDIES } from '../js/candies.js';
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const ids = ['caramelo','chupetin','gomita','chocolate','alfajor','confite','bombon','chicle','paleta','mielcita','regaliz','malvavisco'];
const inner = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const items = [];
// Relleno por filas desde el fondo del frasco (área interior aprox. x 70–430, y 190–610)
let y = 560, row = 0;
while (y > 200) {
  const n = 5 + (row % 2);
  for (let i = 0; i < n; i++) {
    const size = 70 + rnd() * 34;
    const x = 78 + (i + (row % 2 ? 0 : .5)) * (340 / n) + (rnd() - .5) * 20;
    const id = ids[Math.floor(rnd() * ids.length)];
    const rot = (rnd() - .5) * 70;
    items.push(`<g transform="translate(${x.toFixed(1)} ${(y + (rnd() - .5) * 18).toFixed(1)}) rotate(${rot.toFixed(1)})"><svg x="${(-size / 2).toFixed(1)}" y="${(-size / 2).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" viewBox="0 0 64 64">${inner(CANDIES[id].svg)}</svg></g>`);
  }
  y -= 58; row++;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 680">
<defs><clipPath id="vidrio"><path d="M70 170c-28 24-40 60-40 110v280c0 50 30 90 90 90h260c60 0 90-40 90-90V280c0-50-12-86-40-110z"/></clipPath>
<linearGradient id="brillo" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".25" stop-color="#fff" stop-opacity=".08"/><stop offset=".85" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient></defs>
<ellipse cx="250" cy="660" rx="220" ry="18" fill="#3b1f2b" opacity=".25"/>
<path d="M70 170c-28 24-40 60-40 110v280c0 50 30 90 90 90h260c60 0 90-40 90-90V280c0-50-12-86-40-110z" fill="#fff" fill-opacity=".22"/>
<g clip-path="url(#vidrio)">${items.join('')}</g>
<path d="M70 170c-28 24-40 60-40 110v280c0 50 30 90 90 90h260c60 0 90-40 90-90V280c0-50-12-86-40-110z" fill="url(#brillo)" stroke="#fff" stroke-opacity=".85" stroke-width="8"/>
<path d="M62 300c0-40 8-70 26-92" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".7" fill="none"/>
<rect x="60" y="120" width="380" height="60" rx="18" fill="#c41e4a"/>
<rect x="60" y="120" width="380" height="22" rx="11" fill="#ef476f"/>
<path d="M60 150h380" stroke="#8f1235" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>
</svg>`;
writeFileSync(new URL('../assets/brand/frasco.svg', import.meta.url), svg);
console.log('frasco.svg', svg.length, 'bytes');
