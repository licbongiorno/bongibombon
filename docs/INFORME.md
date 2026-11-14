# Informe del proyecto: rediseño, juegos, SEO local y GEO de Bongi Bombón

Fecha: 14 de noviembre de 2026 · Sitio: https://bongibombon.com.ar

## 1. Diagnóstico del sitio anterior

| Área | Hallazgo |
|---|---|
| Tecnología | Un único `index.html` estático (HTML, CSS y JS en línea) servido por Vercel. Sin `robots.txt`, `sitemap.xml` ni `llms.txt` (404). |
| Rendimiento | 20 fotos PNG de hasta 2,6 MB (23 MB en total) mostradas a 90 px. Google Fonts externas. Carruseles con autoplay. |
| SEO | Una sola URL. `og:url` y `og:image` incorrectos (dominio `.com` y una imagen `data:` que las redes no leen). `aggregateRating` 5/50 sin respaldo (Google prohíbe reseñas autogestionadas en LocalBusiness). Meta `keywords` sin efecto. |
| Contenido | Métricas sin respaldo (“99,9 % clientes felices”, “1500+ sonrisas”). Dos reseñas firmadas con el apellido del dueño. El título decía “al por mayor”, pero no lo decía en ningún otro lado. |
| Identidad | Paleta y tipografía con personalidad (Fredoka + naranja, frutilla, banana), pero el hero era un degradé con burbujas: no se veía ni una golosina en los primeros segundos. |
| Accesibilidad | Íconos sin nombre accesible, contraste insuficiente en varios textos y sin foco visible. |

**Competencia:** busqué golosinerías de Río Segundo, Pilar y alrededores en buscadores y directorios. Los directorios (argentino.com.ar) bloquearon el acceso automatizado y las páginas de Facebook piden iniciar sesión, así que no pude armar un listado verificado. Lo que sí se ve es que **casi no hay contenido indexado de golosinerías de la zona**: la competencia real está en el mapa de Google (Google Business Profile), no en sitios web. Es una oportunidad: con un sitio sólido y un perfil de Google bien cargado, Bongi Bombón puede ser la referencia para estas búsquedas.

## 2. Estrategia

- **Identidad:** se conservan el nombre y la tipografía Fredoka. La paleta histórica se ordena y se suma un **cacao** para el texto y un fondo **leche de frutilla**. El recurso propio es un set de **ilustraciones SVG originales** de golosinas que se usa en el hero, los juegos y los íconos. Todo el riesgo visual está en un solo lugar: un **hero con confites que caen y reaccionan al cursor o al dedo**, más un **frasco de golosinas** con la etiqueta de la marca.
- **Arquitectura:** inicio (vidriera, cómo comprar, juegos, el local, reseñas, FAQ, blog) → `/golosinas` (catálogo) → `/juegos` → `/blog` con 3 guías.
- **Conversión sin carrito:** no hay infraestructura de venta online confirmada, así que todo lleva a **WhatsApp** (catálogo con precios, consulta por categoría, lista de favoritos y pedido calculado) y al **local**, con el botón “Cómo llegar”.
- **Técnica:** sitio estático sin frameworks ni librerías de animación (CSS + un solo canvas). Los juegos se cargan solo al abrirlos y el audio se sintetiza en el navegador (cero archivos de audio).

## 3. Qué se implementó

### Sitio
- Hero interactivo con lluvia de confites (canvas con DPR ≤ 2, pausa fuera de pantalla y modo estático si la persona prefiere menos movimiento) y estado **abierto/cerrado en tiempo real**, calculado en hora de Córdoba.
- Vidriera con las fotos reales optimizadas: **de 23 MB a ~0,5 MB** (WebP/AVIF de 360 y 720 px, `srcset`, carga diferida). Los originales quedaron en `assets/originales/` y no se publican.
- `/golosinas`: 20 categorías, filtros (dulce, copetín, mi lista), **favoritos que arman un mensaje de WhatsApp**, consulta de precio por categoría y filtro compartible por URL.
- Sección del local: dirección, horarios con el día actual resaltado y **mapa diferido** (el iframe de Google solo carga si lo pedís).
- Barra de acciones fija en celular: WhatsApp, Cómo llegar y Juegos.
- Blog: calculadora de golosinas para cumpleaños (que arma el pedido por WhatsApp), diccionario de tipos de golosinas y curiosidades del chocolate con fuentes.
- Página 404 con identidad propia.

### Bongi Juegos (8 juegos completos)
| Juego | Mecánica |
|---|---|
| Atrapa Golosinas | Canvas. Mover la bolsa; 60 s; combos x2/x3; estrella +50; reloj +5 s; brócoli, ají y piedra −20; dificultad creciente. |
| Memoria Dulce | 3 niveles que se desbloquean en orden; movimientos, cronómetro, puntaje por tiempo y errores. |
| Candy Match | Tablero 7×7, intercambio con toque, deslizamiento o teclado; cascadas con multiplicador; niveles con meta y movimientos; pista; mezcla automática. |
| ¿Cuánto conocés de golosinas? | 36 preguntas verificadas en 3 dificultades; tiempo, rachas y una explicación después de cada respuesta. |
| El desafío Bongi | 45 s en 4 modos: ¿dulce o copetín? (fotos reales), ¿qué golosina es?, contar confites y mixto. |
| Carrera de Chocolates | Corredor de 3 carriles con teclado, deslizamiento o toques; 3 vidas; velocidad creciente. |
| Globo de Chicle | Mantener apretado para inflar y soltar en el aro dorado; 10 rondas cada vez más rápidas. |
| Frascos Musicales | Secuencias de frascos con luz y sonido que se alargan; dos vidas; teclas 1 a 4. |

**Plataforma:** apodo con filtro de palabras ofensivas, enlaces y spam; niveles con experiencia; **19 logros**; **desafío diario** (igual para todos en la misma fecha); racha de días; top 5 y estadísticas por juego; pantalla de resultados con contador animado, confeti y fanfarria de récord; compartir resultado; botón global de sonido, volumen y música opcional (apagada por defecto). Todo se guarda **solo en el dispositivo** y la página lo aclara: **no se presenta como ranking global**.

### SEO y GEO
- Título, descripción, H1 único, canonical, Open Graph y Twitter Card por página. Imagen social de 1200×630.
- JSON-LD conectado por `@id`: `Store` (dirección, geo, horarios, catálogo, redes), `WebSite`, `BreadcrumbList`, `CollectionPage` + `ItemList` (catálogo), `Article` (blog), `VideoGame` (juegos) y `FAQPage` que coincide con la FAQ visible.
- `sitemap.xml` generado automáticamente, `robots.txt` abierto a buscadores y asistentes de IA, `llms.txt` con los datos del comercio (es una ayuda para asistentes; no garantiza posicionamiento) y `site.webmanifest`.
- Bloques de respuesta directa para preguntas reales: “¿Dónde hay una golosinería en Río Segundo?”, “¿Qué venden?”, “¿Horario?”, “¿Queda cerca de Pilar?”.
- `vercel.json`: URLs limpias, caché larga en `assets/` y cabeceras de seguridad (CSP, nosniff, Referrer-Policy y Permissions-Policy).

### Medición
`js/analytics.js` envía eventos a `dataLayer`: `whatsapp_click`, `maps_click`, `phone_click`, `social_click`, `category_view`, `favorite_add`, `list_send`, `game_start`, `game_end`, `game_record`, `achievement_unlock` y `page_context` (visitante recurrente). GA4 queda listo para activarse pegando el ID real; con el ID cargado se pide consentimiento antes de medir. Alternativa sin cookies: activar **Vercel Web Analytics** desde el panel de Vercel.

## 4. Resultados medidos (Lighthouse 12, perfil móvil, servidor local)

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Inicio | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| Golosinas | 98 | 100 | 100 | 100 | 2,3 s | 0 |
| Juegos | 98 | 100 | 100 | 100 | 2,3 s | 0,001 |
| Guía de cumpleaños | 99 | 100 | 100 | 100 | 1,8 s | 0 |

Conviene volver a medir en producción con PageSpeed Insights, porque la red real y el CDN cambian los valores.

**Pruebas realizadas:** 28 verificaciones funcionales automatizadas, todas aprobadas (menú, horario, mapa diferido, enlaces de WhatsApp, filtros, favoritos persistentes, calculadora, filtro de apodos, persistencia del sonido, enlaces internos, recursos SEO, movimiento reducido y consola sin errores). **Los 8 juegos se jugaron de principio a fin** con Playwright en celular y llegaron a la pantalla de resultados con récords y logros guardados. Las capturas se revisaron en celular (390 px) y escritorio (1440 px).

## 5. Datos a confirmar con el dueño (no se inventaron)

1. **Venta por mayor:** el título anterior decía “al por mayor”. Se quitó hasta confirmarlo. Si es real, conviene sumarlo a la FAQ y al JSON-LD.
2. **Envíos o cobertura** en Pilar, Laguna Larga, Toledo, Oncativo, etc.: no se menciona ningún servicio de entrega.
3. **Años de trayectoria:** el sitio anterior decía “10+”. Con la fecha de apertura, se puede sumar `foundingDate`.
4. **Email:** `info@bongibombon.com` no se pudo verificar (el dominio `.com` no responde) y se quitó.
5. **Reseñas:** se quitaron las dos firmadas con el apellido Bongiorno. Las demás conviene enlazarlas a su fuente (Google o Facebook).
6. **Fotos del local** (fachada, góndolas, equipo): no hay ninguna en el repositorio y son el contenido que más confianza genera.
7. **Promociones y novedades reales:** no hay una sección de novedades con productos inventados. Cuando haya datos, se cargan en `src/catalog.json` o en una sección nueva.
8. **ID de Google Analytics 4** y acceso a Google Search Console.

## 6. Estrategia de palabras clave y geografía

| Intención | Búsquedas | Página que responde |
|---|---|---|
| Comercio local | golosinería en Río Segundo, tienda o local de golosinas Río Segundo Córdoba, golosinería cerca de mí | Inicio (H1, FAQ, Store) |
| Producto + lugar | chocolates, alfajores, caramelos, gomitas o chupetines en Río Segundo | /golosinas (cada categoría con ancla) |
| Ocasión | golosinas para cumpleaños o eventos, mesa dulce, sorpresitas, copetín | /blog/golosinas-para-cumpleanos + calculadora |
| Información | tipos de golosinas, curiosidades del chocolate | Blog |
| Vecinos | golosinería cerca de Pilar, Toledo, Laguna Larga, Oncativo | Inicio (sección “El local”, mención de la RN 9 y FAQ de Pilar) |

**Decisión geográfica:** no se crearon páginas por localidad. Sin envíos ni sucursales confirmados, serían contenido duplicado y Google lo trata como spam. Las localidades vecinas se cubren con información verdadera: Río Segundo está sobre la RN 9 y Pilar es la ciudad vecina. Para Costa Sacate, Lozada y Villa del Rosario no hay ningún vínculo verificable que justifique mencionarlas. Si se confirman envíos, recién ahí corresponde una página “Zona de entrega”.

## 7. Próximos pasos con mayor impacto (fuera del código)

1. **Google Business Profile** (es el factor número 1 en SEO local): categoría principal “Tienda de golosinas”, secundarias “Tienda de chocolates” y “Tienda de snacks”; los mismos horarios, dirección y teléfono que la web; enlace a `https://bongibombon.com.ar`; fotos reales cada semana; publicaciones con las promos del día; responder todas las reseñas.
2. **Pedir reseñas** a clientes reales, por ejemplo con un QR en el mostrador. Nunca pagarlas ni escribirlas.
3. **Bing Places** (alimenta Copilot y ChatGPT) y **Apple Business Connect**, con datos idénticos.
4. **Google Search Console** y **Bing Webmaster Tools**: verificar el dominio y enviar `sitemap.xml`.
5. Mantener coherentes nombre, dirección y teléfono en Instagram, Facebook y directorios locales.
6. Publicar 1 o 2 artículos por mes (por ejemplo, “Ideas de sorpresitas por edad” o “Golosinas sin TACC”, solo con productos reales).
7. Ranking compartido: si se quiere un ranking real entre jugadores, hace falta un backend (por ejemplo, una función de Vercel con una base KV) que valide las partidas en el servidor (semilla por partida, tiempo mínimo, límite por IP y moderación de apodos). Hoy no existe, y por eso la web no promete un ranking global.

Para medir cada mes: posición para “golosinería Río Segundo” en Search Console, acciones del perfil de Google (llamadas, cómo llegar, clics al sitio), eventos `whatsapp_click` y `maps_click`, y partidas por visitante.

---

## 8. Ampliación: Bongi Arcade (sala de videojuegos)

Bongi Juegos pasó a ser **Bongi Arcade** (`/juegos`): 8 juegos arcade originales más los 8 minijuegos existentes, con perfil compartido.

### Juegos arcade (en el orden de prioridad pedido)

| Juego | Inspiración mecánica | Qué tiene |
|---|---|---|
| Bongi Crush | Combinar 3 | 30 niveles en 3 mundos con mapa y estrellas. Objetivos de puntos, glaseado, golosinas para juntar, bloques de chocolate y especiales. Especiales: Chupetín relámpago (4 en línea), Chocolate explosivo (L/T), Gomita arcoíris (5), Caramelo multicolor (cuadrado) y Bombón sorpresa. Combinaciones entre especiales, cascadas, pista, mezcla automática y "Dulce final". |
| Bongi World | Plataformas | 5 mundos de 2 niveles (Chocolates, Gomitas, Alfajores, Fábrica, Castillo), cada uno con música, fondo, enemigos y jefe. Física con tiempo de gracia, salto anticipado y salto variable. Doble salto desbloqueable, escudo, velocidad, confites lanzables, bloques sorpresa y ocultos, plataformas móviles, trampolines, pinches, puntos de control y bonus de tiempo. |
| Bongi Maze | Laberinto | Laberintos generados por nivel (simétricos, sin callejones sin salida, comprobados para que se puedan completar). Cuatro enemigos con personalidad: Choco persigue, Gomi corta el paso, Ácido se espanta, Azuquita flanquea. Bombón dorado, pasadizos, golosina bonus y velocidad creciente. |
| Bongi Blocks | Encastre | Piezas de golosina, rotación con correcciones contra paredes, pieza fantasma, guardar, 3 próximas, retardo de fijación, combos, multiplicador por cuádruples seguidos, niveles y explosión de confites. Gestos táctiles y botones. |
| Bongi Breaker | Rompebloques | 10 niveles, bloques de 1 a 3 golpes, dorados y explosivos. Física en pasos pequeños (el bombón no atraviesa bloques). 8 poderes y combos. |
| Bombi Bongi | Bombas en laberinto | Bombas en cruz con reacción en cadena, 6 poderes (rango, bombas, velocidad, escudo, bomba especial, caramelo explosivo con detonación a distancia), golosinas escondidas, 3 enemigos, portal y reloj. 3 escenarios. |
| Bongi Pong | Ping-pong | Contra el Bongi Bot (3 dificultades, con predicción y error humano), 2 jugadores en el mismo dispositivo (multitáctil y teclado) y modo desafío. Efecto según el movimiento de la barra. 3 escenarios. |
| Candy of Bongi | Acción con disparos (parodia) | Operación Dulce: 5 lanzadores de golosinas y bombas de chocolate, 4 tipos de Ácidos y el jefe Gran Limón Ácido. Modos Oleadas (misión de 10 con jefes), Supervivencia y Contrarreloj. Doble palanca táctil o teclado y mouse. Sin violencia: los ácidos se convierten en caramelos. |

**Propiedad intelectual:** se tomaron solo las mecánicas de género. Nombres, personajes (Bongi, Choco, Gomi, Ácido, Azuquita, Gran Limón Ácido), gráficos (dibujados en código), laberintos (generados), niveles, música y sonidos (sintetizados) son originales. No se usa ningún recurso de otros juegos. Las piezas de encastre son las formas geométricas propias del género, con estética de golosina y paneles propios.

### Plataforma común
- **Motor arcade compartido** (`js/juegos/core/arcade.js`): resolución lógica escalada, paso fijo de 1/60 s, teclado y controles táctiles (que flotan sobre la pantalla en celulares apaisados), partículas, sacudón opcional, carteles y menú de pausa con Continuar, Reiniciar y Salir.
- **Barra del juego:** pausa, reiniciar, sonido y salir. Esc pausa en lugar de cerrar. "Jugar de nuevo" o "Siguiente nivel" arranca sin repetir las instrucciones. La pantalla de inicio muestra instrucciones y controles; la de resultado, victoria o derrota, estrellas, récord, recompensas y logros.
- **Progresión:** apodo con filtro, avatar (12 golosinas), Puntos Bongi (virtuales, sin valor monetario, aclarado en la página), experiencia y niveles, 32 logros, desafío diario sobre los 16 juegos, racha, estadísticas y golosinas recogidas. Récords locales, presentados como tales: no hay ranking global.
- **Hub:** tarjetas con ilustración propia, dificultad, duración, récord, etiqueta de nuevo y filtros (Nuevos, Tus más jugados, Clásicos, Aventura, Puzle, 2 jugadores).
- **Música** por juego y por mundo (9 pistas originales), siempre opcional.

### Pruebas
Cada juego arcade se jugó de principio a fin con Playwright en celular y se recorrieron sus pantallas de inicio, pausa (Esc), victoria, derrota y reinicio, sin errores de consola. Los 8 minijuegos anteriores se volvieron a probar completos. Lighthouse en celular: inicio 99/100/100/100; Bongi Arcade 96/100/100/100.

### Pendiente o posible a futuro
- **Ranking compartido:** requiere un backend que valide las partidas en el servidor (semilla por partida, repetición o validación de eventos, límites por IP y moderación de apodos). No se implementó para no mostrar un ranking que se pueda falsear.
- **Más contenido:** más niveles de Bongi Crush y Bongi World. Agregarlos es sumar datos (`SPEC` en `crush.js` y trozos en `world.js`).
