# Bongi Bombón — sitio web

Sitio estático de **Bongi Bombón**, golosinería en Jujuy 868, Río Segundo (Córdoba). Se publica en Vercel tal cual está en la raíz del repositorio: no hace falta un paso de compilación en el servidor.

## Cómo editar

1. Los textos y páginas se editan en `src/` (no en los `index.html` generados):
   - `src/site.json` — **datos del negocio** (dirección, teléfono, horarios, redes). Fuente única.
   - `src/catalog.json` — categorías del catálogo (nombre, sector, descripción, texto alternativo).
   - `src/pages/**.html` — contenido de cada página. El bloque `<!--meta {...} -->` define título, descripción, migas y datos estructurados.
   - `src/partials/` — `layout`, `header` y `footer` compartidos.
2. Regenerar: `node scripts/build.mjs` (escribe los HTML finales y `sitemap.xml`).
3. Commit y push: Vercel publica.

Nuevas fotos de producto: guardar el original en `assets/originales/` y generar las versiones WebP/AVIF de 360 y 720 px en `assets/img/productos/<slug>-<ancho>.<ext>` (recorte 4:5).

## Estructura

```
index.html, golosinas/, juegos/, blog/…   HTML generado (lo que se publica)
css/main.css          estilos del sitio (tokens de marca, componentes)
css/juegos.css        estilos de Bongi Juegos
js/site.js            menú, horario abierto/cerrado, apariciones, mapa diferido
js/hero.js            lluvia interactiva de confites del hero (canvas)
js/candies.js         set de ilustraciones SVG de golosinas (hero + juegos)
js/catalog.js         filtros, favoritos y lista por WhatsApp
js/calc.js            calculadora de golosinas para cumpleaños
js/analytics.js       capa de medición (dataLayer / GA4 opcional con consentimiento)
js/juegos/core/       plataforma: storage, audio, fx, loop, registry, shell
js/juegos/games/      un archivo por juego
js/juegos/data/       preguntas de la trivia (con fuentes)
assets/               fuentes, íconos, marca, fotos optimizadas
scripts/              build.mjs (generador), frasco.mjs (ilustración del hero)
docs/INFORME.md       informe del proyecto
```

## Agregar un juego a Bongi Arcade

1. Crear `js/juegos/games/<id>.js` que exporte `default { mount(root, ctx) }` y devuelva `{ destroy(), togglePause?, pause? }`.
   `ctx` ofrece `hud()`, `sfx`, `music(pista)`, `data` (progreso propio que persiste con `save()`), `again`, `restart()`, `exit()`, `float()`, `shake()`, `confetti()` y `end({ score, won, stars, extra, summary, title, againLabel })`.
2. Para un juego de acción, usar el motor `js/juegos/core/arcade.js`: `arcade(root, ctx, { width, height, update, draw, controls, onPointer, help })` da escalado, paso fijo, teclado, controles táctiles, partículas (`fx.burst`, `fx.text`, `fx.shake`), carteles y menú de pausa.
3. Sumar la entrada en `js/juegos/core/registry.js` (con `arcade: true`, dificultad, duración, etiquetas y controles) y, si corresponde, su ilustración en `scripts/posters.mjs`. Las tarjetas del hub y de la home se generan solas al correr `node scripts/build.mjs`.

## Medición

`js/analytics.js` envía eventos a `window.dataLayer` (whatsapp_click, maps_click, category_view, game_start, game_end, etc.). Para activar Google Analytics 4, pegar el ID real en `GA_MEASUREMENT_ID`: se pide consentimiento antes de medir.

## Brújula (`/vida`)

App personal aparte del sitio de la golosinería: registro diario breve, revisión semanal, poda de proyectos y filtro de decisiones. Es un único `vida/index.html` sin dependencias, instalable como PWA y con funcionamiento sin conexión (`vida/sw.js`). Los datos quedan solo en el navegador del dispositivo (localStorage); se exportan en JSON o Markdown desde el ícono de ajustes. No se indexa (`noindex` + `robots.txt`) ni está enlazada desde el sitio.
