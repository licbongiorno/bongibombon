// Generador estático mínimo, sin dependencias.
// Une src/partials/* con src/pages/**/*.html y escribe el HTML final en la raíz
// (lo que Vercel sirve tal cual). También genera sitemap.xml.
// Uso: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'src/site.json'), 'utf8'));
const partialsDir = join(root, 'src/partials');
const pagesDir = join(root, 'src/pages');
const today = new Date().toISOString().slice(0, 10);

const partials = Object.fromEntries(
  readdirSync(partialsDir).filter(f => f.endsWith('.html'))
    .map(f => [f.replace(/\.html$/, ''), readFileSync(join(partialsDir, f), 'utf8')])
);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ---------- Parciales generados desde src/catalog.json ----------
const catalog = JSON.parse(readFileSync(join(root, 'src/catalog.json'), 'utf8'));
const picture = (c, eager = false) => `<picture>
      <source type="image/avif" srcset="/assets/img/productos/${c.slug}-360.avif 360w, /assets/img/productos/${c.slug}-720.avif 720w" sizes="(min-width: 1000px) 270px, (min-width: 640px) 31vw, 46vw">
      <img class="jar__img" src="/assets/img/productos/${c.slug}-360.webp" srcset="/assets/img/productos/${c.slug}-360.webp 360w, /assets/img/productos/${c.slug}-720.webp 720w" sizes="(min-width: 1000px) 270px, (min-width: 640px) 31vw, 46vw" width="360" height="450" alt="${esc(c.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    </picture>`;
const sectorTag = c => c.sector === 'dulce' ? '<span class="jar__tag">Dulce</span>' : '<span class="jar__tag jar__tag--salado">Copetín</span>';
const waText = t => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(t)}`;

partials['shelf-home'] = `<ul class="shelf pop-in">\n${catalog.filter(c => c.home).map(c => `  <li class="jar">
    ${picture(c)}
    <div class="jar__body"><h3 class="jar__name"><a href="/golosinas#${c.slug}" data-track="category_view" data-track-label="${c.slug}">${c.name}</a></h3>${sectorTag(c)}</div>
  </li>`).join('\n')}\n</ul>`;

partials['shelf-full'] = `<ul class="shelf" id="catalogo" aria-live="polite">\n${catalog.map((c, i) => `  <li class="jar" id="${c.slug}" data-sector="${c.sector}" data-name="${esc(c.name)}">
    ${picture(c, i < 2)}
    <button class="jar__fav" type="button" aria-pressed="false" data-fav="${c.slug}"><svg aria-hidden="true" viewBox="0 0 24 24"><use href="/assets/brand/iconos.svg#heart-line"/></svg><span class="sr-only">Agregar ${esc(c.name)} a mi lista</span></button>
    <div class="jar__body"><h2 class="jar__name">${c.name}</h2>${sectorTag(c)}</div>
    <p class="jar__actions muted">${esc(c.desc)}<br><a href="${waText(`¡Hola Bongi Bombón! Quiero consultar precios y variedades de ${c.name.toLowerCase()}.`)}" rel="noopener" target="_blank" data-track="whatsapp_click" data-track-label="consulta_${c.slug}">Consultar precio por WhatsApp</a></p>
  </li>`).join('\n')}\n</ul>`;

const catalogItemList = {
  '@type': 'ItemList', name: 'Categorías de golosinas y snacks de Bongi Bombón', numberOfItems: catalog.length,
  itemListElement: catalog.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: `${site.url}/golosinas#${c.slug}`, description: c.desc }))
};

// ---------- Bongi Arcade: tarjetas y datos estructurados desde el registro de juegos ----------
const { GAMES } = await import('../js/juegos/core/registry.js');
const { POSTERS } = await import('./posters.mjs');
const { candySVG } = await import('../js/candies.js');
const DIFF_CLASS = { 'Fácil': 'easy', 'Media': 'mid', 'Difícil': 'hard' };
partials['arcade-cards'] = `<ul class="arcade-cards" data-arcade-grid>\n${GAMES.filter(g => g.arcade).map(g => `  <li class="acard" id="${g.id}" data-id="${g.id}" data-tags="${g.tags}" style="--c:${g.color}">
    <div class="acard__screen">${POSTERS[g.id]()}${g.isNew ? '<span class="acard__new">Nuevo</span>' : ''}<span class="acard__fav">Tus más jugados</span></div>
    <div class="acard__body">
      <h3>${esc(g.title)}</h3>
      <p>${esc(g.desc)}</p>
      <ul class="acard__meta" aria-label="Datos del juego"><li class="lvl lvl--${DIFF_CLASS[g.difficulty]}">${g.difficulty}</li><li>${esc(g.duration)}</li><li>${esc(g.tag)}</li></ul>
      <p class="acard__best" data-best="${g.id}">Sin récord todavía</p>
      <button type="button" class="btn btn--sm btn--banana" data-play="${g.id}">Jugar</button>
    </div>
  </li>`).join('\n')}\n</ul>`;
partials['home-arcade'] = `<ul class="game-cards pop-in" aria-label="Juegos de Bongi Arcade">\n${GAMES.filter(g => g.arcade).map(g => `  <li><a class="game-card" style="--bg:${g.color}" href="/juegos#${g.id}"><span class="game-card__icon" aria-hidden="true">${candySVG(g.icon)}</span><div><strong>${esc(g.title)}</strong><span>${esc(g.tag)}</span></div></a></li>`).join('\n')}\n</ul>`;
partials['mini-cards'] = `<ul class="arcade__grid" data-grid>\n${GAMES.filter(g => !g.arcade).map(g => `  <li class="gcard" id="${g.id}" style="--c:${g.color}"><div class="gcard__icon" aria-hidden="true">${candySVG(g.icon)}</div><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p><p class="gcard__best" data-best="${g.id}">Sin récord todavía</p><button type="button" class="btn btn--sm" data-play="${g.id}">Jugar</button></li>`).join('\n')}\n</ul>`;
const GENRE = { crush: 'Puzle', world: 'Plataformas', maze: 'Laberinto', blocks: 'Puzle', breaker: 'Arcade', bombi: 'Acción y laberinto', pong: 'Deportes', candyof: 'Acción', atrapa: 'Arcade', memoria: 'Memoria', match: 'Puzle', trivia: 'Trivia', desafio: 'Habilidad', carrera: 'Arcade', globo: 'Habilidad', frascos: 'Música y memoria' };
const gamesItemList = {
  '@type': 'ItemList', name: 'Bongi Arcade', numberOfItems: GAMES.length,
  itemListElement: GAMES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'VideoGame', name: g.title, description: g.desc, url: `${site.url}/juegos#${g.id}`, gamePlatform: 'Navegador web', applicationCategory: 'Game', genre: GENRE[g.id] || 'Arcade', isAccessibleForFree: true, inLanguage: 'es-AR', ...(g.id === 'pong' ? { numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2 } } : {}) } }))
};

function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}


// Datos estructurados del comercio: se reutilizan en todas las páginas por @id.
const storeLd = {
  '@type': 'Store',
  '@id': `${site.url}/#comercio`,
  name: site.name,
  description: 'Golosinería en Río Segundo, Córdoba: golosinas, chocolates, alfajores, caramelos, gomitas y snacks de copetín para cumpleaños, mesas dulces y fiestas.',
  url: `${site.url}/`,
  image: `${site.url}/assets/brand/og-bongi-bombon.png`,
  logo: `${site.url}/assets/brand/logo-bongi-bombon.png`,
  telephone: site.phoneE164,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.streetAddress,
    addressLocality: site.locality,
    addressRegion: site.region,
    postalCode: site.postalCode,
    addressCountry: site.country
  },
  geo: { '@type': 'GeoCoordinates', latitude: site.lat, longitude: site.lng },
  hasMap: site.mapsUrl,
  areaServed: [{ '@type': 'City', name: 'Río Segundo' }],
  openingHoursSpecification: site.hours.map(h => ({
    '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes
  })),
  sameAs: [site.instagram, site.facebook],
  knowsAbout: ['golosinas', 'chocolates', 'alfajores', 'caramelos', 'gomitas', 'chupetines', 'confites', 'snacks', 'mesas dulces'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Golosinas y snacks',
    url: `${site.url}/golosinas`,
    itemListElement: [
      { '@type': 'OfferCatalog', name: 'Sector dulce: alfajores, bombones, caramelos, chicles, chocolates, chupetines, confites, gomitas, malvaviscos, mielcitas, paletitas, pastillitas y regaliz' },
      { '@type': 'OfferCatalog', name: 'Sector copetín: cascarones, chizitos, maní salado, palitos salados, papas fritas, puflitos y tutucas' }
    ]
  }
};

const websiteLd = {
  '@type': 'WebSite', '@id': `${site.url}/#web`, url: `${site.url}/`, name: site.name,
  inLanguage: 'es-AR', publisher: { '@id': `${site.url}/#comercio` }
};

const pages = [];
for (const file of walk(pagesDir)) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Falta bloque meta en ${file}`);
  const meta = JSON.parse(m[1]);
  let body = raw.slice(m[0].length);
  const path = meta.path; // '' para la home, 'golosinas', 'blog/xyz'
  const canonical = `${site.url}/${path}`.replace(/\/$/, '') || site.url;
  const canonicalUrl = path === '' ? `${site.url}/` : canonical;

  const graph = [websiteLd, storeLd];
  if (meta.breadcrumbs) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Inicio', url: '/' }, ...meta.breadcrumbs].map((b, i) => ({
        '@type': 'ListItem', position: i + 1, name: b.name, item: `${site.url}${b.url}`.replace(/\/$/, '') || `${site.url}/`
      }))
    });
  }
  graph.push({
    '@type': meta.pageType || 'WebPage', '@id': `${canonicalUrl}#pagina`, url: canonicalUrl,
    name: meta.title, description: meta.description, inLanguage: 'es-AR',
    isPartOf: { '@id': `${site.url}/#web` }, about: { '@id': `${site.url}/#comercio` },
    ...(meta.pageLd || {})
  });
  for (const extra of meta.ld || []) graph.push(extra);
  if (meta.catalogLd) graph[graph.length - 1 - (meta.ld || []).length].mainEntity = catalogItemList;
  if (meta.gamesLd) graph[graph.length - 1 - (meta.ld || []).length].mainEntity = gamesItemList;
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 1)
    .replace(/</g, '\\u003c');

  const vars = {
    title: esc(meta.title), description: esc(meta.description), canonical: canonicalUrl,
    ogImage: `${site.url}${meta.ogImage || '/assets/brand/og-bongi-bombon.png'}`,
    ogType: meta.ogType || 'website',
    robots: meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    jsonld, extraHead: meta.head || '', bodyClass: meta.bodyClass || '',
    scripts: (meta.scripts || []).map(s => `<script type="module" src="${s}"></script>`).join('\n'),
    year: String(new Date().getFullYear()), today,
    configJson: JSON.stringify({ whatsapp: site.whatsapp, hours: site.hours, tz: 'America/Argentina/Cordoba' }),
    ...Object.fromEntries(Object.entries(site).filter(([, v]) => typeof v !== 'object').map(([k, v]) => [`site.${k}`, v]))
  };

  // Navegación activa
  for (const k of ['inicio', 'golosinas', 'juegos', 'local', 'blog']) vars[`nav.${k}`] = meta.nav === k ? ' aria-current="page"' : '';

  let html = partials.layout.replace('{{content}}', () => body);
  for (let i = 0; i < 4; i++) html = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => {
    if (!(n in partials)) throw new Error(`Parcial inexistente: ${n}`);
    return partials[n];
  });
  for (let i = 0; i < 2; i++) html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (all, k) => (k in vars ? vars[k] : all));
  const leftover = html.match(/\{\{[^}]*\}\}/);
  if (leftover) throw new Error(`Variable sin resolver ${leftover[0]} en ${file}`);

  const outFile = path === '404' ? join(root, '404.html') : join(root, path, 'index.html');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  if (!meta.noindex) pages.push({ loc: canonicalUrl, priority: meta.priority || '0.6', lastmod: meta.updated || today });
  console.log('✓', relative(root, outFile));
}

pages.sort((a, b) => b.priority - a.priority);
writeFileSync(join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(p => `  <url><loc>${p.loc}</loc><lastmod>${p.lastmod}</lastmod><priority>${p.priority}</priority></url>`).join('\n') +
  `\n</urlset>\n`);
console.log('✓ sitemap.xml', pages.length, 'URLs');
