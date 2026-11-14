// Catálogo de Bongi Arcade (juegos arcade + minijuegos). Para sumar un juego: crear js/juegos/games/<id>.js
// (exporta default { mount(root, ctx) }) y agregar una entrada acá.
export const GAMES = [
  // ---------- BONGI ARCADE ----------
  { id: 'crush', arcade: true, isNew: true, title: 'Bongi Crush', tag: 'Combinar', icon: 'confite', color: '#ff8fb1', music: 'plaza',
    difficulty: 'Fácil', duration: '2–4 min por nivel', tags: 'nuevo arcade puzle',
    desc: 'La fábrica de combinaciones: 30 niveles con objetivos, golosinas especiales y estrellas.',
    how: ['Intercambiá dos golosinas vecinas para formar líneas de 3 o más iguales.', 'Con 4 en línea nace un Chupetín relámpago; con forma de L o T, un Chocolate explosivo; con 5, una Gomita arcoíris; con un cuadrado de 4, un Caramelo multicolor.', 'Cada nivel tiene un objetivo: puntos, glaseado, golosinas para juntar o bloques de chocolate para romper.', 'El Bombón sorpresa regala movimientos o puntos. Ganá hasta 3 estrellas por nivel.'],
    controls: [['Celular', 'Deslizá una golosina hacia su vecina'], ['Mouse', 'Clic en una y clic en la vecina'], ['Teclado', 'Flechas para mover, Espacio para elegir y flechas para cambiar']],
    load: () => import('../games/crush.js?v=cfab42284a'), xp: s => s / 100, daily: 3000 },
  { id: 'world', arcade: true, isNew: true, title: 'Bongi World', tag: 'Plataformas', icon: 'chocolate', color: '#ffd166', music: 'chocolate',
    difficulty: 'Media', duration: '3–6 min por mundo', tags: 'nuevo arcade aventura',
    desc: 'Aventura de plataformas por cinco mundos dulces, con secretos, poderes y jefes.',
    how: ['Llevá a Bongi hasta la bandera de cada nivel.', 'Saltá sobre los enemigos para derrotarlos y golpeá los bloques sorpresa desde abajo.', 'Poderes: Chicle saltarín (doble salto), Alfajor escudo (aguanta un golpe), Caramelo veloz y Confites lanzables.', 'El segundo nivel de cada mundo termina con un jefe: saltale encima tres veces.'],
    controls: [['Moverse', '◀ ▶ · A D · flechas'], ['Saltar', 'Botón Saltar · Espacio · Z'], ['Correr / lanzar', 'Botón Correr · X · Shift'], ['Pausa', 'P · Esc']],
    load: () => import('../games/world.js?v=cfab42284a'), xp: s => s / 60, daily: 2000 },
  { id: 'maze', arcade: true, isNew: true, title: 'Bongi Maze', tag: 'Laberinto', icon: 'caramelo', color: '#7ae0ff', music: 'laberinto',
    difficulty: 'Media', duration: '3–5 min', tags: 'nuevo arcade clasico',
    desc: 'Recorré el laberinto dulce juntando confites mientras cuatro golosinas traviesas te persiguen.',
    how: ['Juntá todos los confites para pasar de laberinto.', 'Choco te persigue, Gomi te corta el camino, Ácido es impredecible y Azuquita patrulla su rincón.', 'El Bombón dorado los asusta un rato: ¡ahí podés atraparlos!', 'Los pasadizos de los costados te llevan al otro lado.'],
    controls: [['Moverse', 'Flechas · WASD · deslizar · cruz en pantalla'], ['Pausa', 'P · Esc']],
    load: () => import('../games/maze.js?v=cfab42284a'), xp: s => s / 40, daily: 1500 },
  { id: 'blocks', arcade: true, isNew: true, title: 'Bongi Blocks', tag: 'Encastre', icon: 'paleta', color: '#b8f2c8', music: 'bloques',
    difficulty: 'Media', duration: '3–8 min', tags: 'nuevo arcade clasico puzle',
    desc: 'Encastrá piezas de golosina, completá filas y hacé estallar los confites.',
    how: ['Mové y rotá las piezas que caen para completar filas.', 'Cada fila completa estalla en confites. Varias juntas suman mucho más.', 'Encadená filas en piezas seguidas para hacer combos.', 'Podés guardar una pieza para después. Cada 10 filas sube el nivel y la velocidad.'],
    controls: [['Mover', '◀ ▶ · deslizar'], ['Rotar', 'Botón ⟳ · ▲ · X · tocar'], ['Bajar', '▼ (suave) · Espacio o deslizar abajo (de golpe)'], ['Guardar', 'Botón Guardar · C']],
    load: () => import('../games/blocks.js?v=cfab42284a'), xp: s => s / 80, daily: 3000 },
  { id: 'breaker', arcade: true, isNew: true, title: 'Bongi Breaker', tag: 'Rompebloques', icon: 'regaliz', color: '#ffb38f', music: 'fabrica',
    difficulty: 'Fácil', duration: '3–6 min', tags: 'nuevo arcade clasico',
    desc: 'Una barra de regaliz, un bombón que rebota y 10 paredes de golosinas para romper.',
    how: ['Mové la barra para que el bombón no se caiga.', 'Donde pega en la barra cambia el ángulo del rebote.', 'Algunos bloques necesitan varios golpes; los dorados no se rompen.', 'Atrapá los poderes: más pelotas, barra larga, bola de chocolate, barra pegajosa, rompefilas y puntos extra.'],
    controls: [['Mover', 'Arrastrar · ◀ ▶ · mouse'], ['Lanzar', 'Tocar · Espacio']],
    load: () => import('../games/breaker.js?v=cfab42284a'), xp: s => s / 50, daily: 2000 },
  { id: 'bombi', arcade: true, isNew: true, title: 'Bombi Bongi', tag: 'Explosivo', icon: 'bombon', color: '#d9c8ff', music: 'fabrica',
    difficulty: 'Media', duration: '3–6 min', tags: 'nuevo arcade aventura',
    desc: 'Poné bombas de caramelo, abrí camino entre bloques de golosina y encontrá el portal.',
    how: ['Poné bombas para romper bloques y atrapar a los enemigos.', 'Las explosiones van en cruz: ¡no te quedes en el medio!', 'Debajo de los bloques hay poderes y golosinas escondidas.', 'El portal se abre cuando no queda ningún enemigo.'],
    controls: [['Moverse', 'Flechas · WASD · cruz en pantalla'], ['Bomba', 'Botón Bomba · Espacio · Z'], ['Detonar (caramelo explosivo)', 'Botón Boom · X']],
    load: () => import('../games/bombi.js?v=cfab42284a'), xp: s => s / 40, daily: 1500 },
  { id: 'pong', arcade: true, isNew: true, title: 'Bongi Pong', tag: 'Duelo', icon: 'malvavisco', color: '#f6dbe3', music: 'accion',
    difficulty: 'Fácil', duration: '2–4 min', tags: 'nuevo arcade clasico 2jugadores',
    desc: 'Duelo de golosinas: contra el Bongi Bot o contra un amigo en el mismo celular.',
    how: ['Mové tu barra para devolver el bombón.', 'Si le pegás con la barra en movimiento, el bombón sale con efecto.', 'Gana quien llega primero a 7 puntos.', 'En el modo desafío, cada punto que hacés acelera el juego.'],
    controls: [['1 jugador', 'Arrastrar · ▲ ▼ · W S'], ['2 jugadores', 'Cada uno arrastra en su mitad · W S y ▲ ▼']],
    load: () => import('../games/pong.js?v=cfab42284a'), xp: s => s / 15, daily: 700 },
  { id: 'candyof', arcade: true, isNew: true, title: 'Candy of Bongi', tag: 'Acción', icon: 'chupetin', color: '#ffe08a', music: 'accion',
    difficulty: 'Difícil', duration: '4–8 min', tags: 'nuevo arcade accion',
    desc: 'Operación Dulce: defendé la fábrica de la invasión ácida con lanzadores de golosinas.',
    how: ['Los Ácidos quieren robar la receta secreta del chocolate. ¡Defendé la fábrica!', 'Tus lanzadores disparan gomitas, confites, burbujas, chupetines y crema: los ácidos se convierten en caramelos.', 'Juntá cajas de poder para cambiar de lanzador y las bombas de chocolate para limpiar la pantalla.', 'Modos: Oleadas con jefes, Supervivencia y Contrarreloj.'],
    controls: [['Moverse', 'Palanca izquierda · WASD'], ['Apuntar y lanzar', 'Palanca derecha · mouse (clic)'], ['Bomba de chocolate', 'Botón Bomba · Espacio']],
    load: () => import('../games/candyof.js?v=cfab42284a'), xp: s => s / 50, daily: 2500 },
  // ---------- MINIJUEGOS ----------
  { id: 'atrapa', title: 'Atrapa Golosinas', tag: 'Reflejos', icon: 'caramelo', color: '#ffd166',
    desc: 'Mové la bolsa y atrapá todo lo dulce que cae. Esquivá el brócoli y el ají.',
    how: ['Arrastrá el dedo o usá ← → (o A y D) para mover la bolsa.', 'Cada golosina suma 10 puntos; la estrella dorada, 50; el reloj suma 5 segundos.', 'Brócoli, ají y piedras restan 20 y cortan tu combo.', 'Tenés 60 segundos. ¡Cada vez cae más rápido!'],
    load: () => import('../games/atrapa.js?v=cfab42284a'), xp: s => s / 6, daily: 300 },
  { id: 'memoria', title: 'Memoria Dulce', tag: 'Memoria', icon: 'paleta', color: '#06d6a0',
    desc: 'Encontrá los pares de golosinas con la menor cantidad de movimientos.',
    how: ['Tocá dos cartas para darlas vuelta.', 'Si son iguales, quedan descubiertas.', 'Menos movimientos y menos tiempo = más puntos.', 'Superá un nivel para desbloquear el siguiente.'],
    load: () => import('../games/memoria.js?v=cfab42284a'), xp: s => s / 20, daily: 900 },
  { id: 'match', title: 'Candy Match', tag: 'Combinar', icon: 'confite', color: '#ff8fb1',
    desc: 'Intercambiá golosinas vecinas y armá filas de tres o más iguales.',
    how: ['Tocá una golosina y después una vecina para intercambiarlas (o deslizá).', 'Solo valen los cambios que forman una fila o columna de 3 o más.', 'Las cascadas multiplican los puntos.', 'Llegá a la meta de cada nivel antes de quedarte sin movimientos.'],
    load: () => import('../games/match.js?v=cfab42284a'), xp: s => s / 60, daily: 2500 },
  { id: 'trivia', title: '¿Cuánto conocés de golosinas?', tag: 'Trivia', icon: 'alfajor', color: '#ffb38f',
    desc: 'Diez preguntas sobre chocolates, alfajores y golosinas. Datos verificados.',
    how: ['Elegí la dificultad.', 'Respondé antes de que se acabe el tiempo: cuanto más rápido, más puntos.', 'Las respuestas seguidas correctas suman racha.', 'Después de cada pregunta vas a ver una curiosidad.'],
    load: () => import('../games/trivia.js?v=cfab42284a'), xp: s => s / 40, daily: 1500 },
  { id: 'desafio', title: 'El desafío Bongi', tag: 'Rapidez', icon: 'chupetin', color: '#bfe9ff',
    desc: '45 segundos de consignas rápidas: clasificá, reconocé y contá golosinas.',
    how: ['Elegí un modo o jugá el mixto.', '¿Dulce o copetín?: clasificá las fotos de la vidriera.', '¿Qué golosina es?: reconocé la ilustración.', 'Contá los confites: memorizá cuántos aparecen.'],
    load: () => import('../games/desafio.js?v=cfab42284a'), xp: s => s / 8, daily: 200 },
  { id: 'carrera', title: 'Carrera de Chocolates', tag: 'Esquivar', icon: 'chocolate', color: '#f6dbe3',
    desc: 'Corré por el camino de caramelo, juntá chocolates y esquivá obstáculos.',
    how: ['Deslizá o tocá a los costados de la pista para cambiar de carril. En teclado: ← → o A y D.', 'Cada chocolate suma 25 puntos; cada metro recorrido, 1.', 'Tenés 3 vidas. La velocidad aumenta con la distancia.'],
    load: () => import('../games/carrera.js?v=cfab42284a'), xp: s => s / 25, daily: 900 },
  { id: 'globo', title: 'Globo de Chicle', tag: 'Precisión', icon: 'chicle', color: '#d9c8ff',
    desc: 'Inflá el globo de chicle hasta el aro dorado… sin que te explote.',
    how: ['Mantené apretado el globo (o la barra espaciadora) para inflarlo.', 'Soltá cuando llegue al aro dorado: si lo tocás, es un globo perfecto.', 'Si te pasás, ¡explota! y la ronda no suma.', 'Son 10 rondas y cada una infla más rápido.'],
    load: () => import('../games/globo.js?v=cfab42284a'), xp: s => s / 15, daily: 800 },
  { id: 'frascos', title: 'Frascos Musicales', tag: 'Ritmo', icon: 'mielcita', color: '#b8f2c8',
    desc: 'Mirá y escuchá la secuencia de frascos y repetila sin equivocarte.',
    how: ['Los frascos se iluminan y suenan en un orden.', 'Repetí la secuencia tocándolos (o con las teclas 1 a 4).', 'Cada ronda suma un frasco y va más rápido.', 'Tenés dos oportunidades.'],
    load: () => import('../games/frascos.js?v=cfab42284a'), xp: s => s / 5, daily: 300 }
];

// Datos de presentación de los minijuegos (las tarjetas usan el mismo diseño que los arcade)
const MINI_META = {
  atrapa: { difficulty: 'Fácil', duration: '1 min', tags: 'rapido clasico' },
  memoria: { difficulty: 'Fácil', duration: '1–2 min', tags: 'rapido puzle' },
  match: { difficulty: 'Fácil', duration: '2–3 min', tags: 'rapido puzle' },
  trivia: { difficulty: 'Media', duration: '2–3 min', tags: 'rapido' },
  desafio: { difficulty: 'Media', duration: '45 s', tags: 'rapido' },
  carrera: { difficulty: 'Media', duration: '1–2 min', tags: 'rapido aventura' },
  globo: { difficulty: 'Fácil', duration: '1 min', tags: 'rapido' },
  frascos: { difficulty: 'Media', duration: '1–3 min', tags: 'rapido' }
};
for (const g of GAMES) {
  if (g.arcade) { g.kind = 'Arcade'; continue; }
  Object.assign(g, { kind: 'Minijuego' }, MINI_META[g.id]);
  g.tags = `mini ${g.tags}`;
}

export const AVATARS = ['bombon', 'caramelo', 'chupetin', 'gomita', 'alfajor', 'confite', 'chicle', 'paleta', 'chocolate', 'malvavisco', 'regaliz', 'mielcita'];
export const ARCADE_IDS = GAMES.filter(g => g.arcade).map(g => g.id);


export const byId = id => GAMES.find(g => g.id === id);

/** Desafío del día: mismo juego y meta para todos en la misma fecha. */
export function dailyFor(dateStr) {
  let h = 0; for (const ch of dateStr) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const g = GAMES[h % GAMES.length];
  return { game: g, target: g.daily };
}

export const ACHIEVEMENTS = [
  { id: 'primera', name: 'Primer caramelo', desc: 'Terminá tu primera partida.', test: c => c.state.stats.finished >= 1 },
  { id: 'explorador', name: 'Probador oficial', desc: 'Terminá una partida de cada uno de los 8 minijuegos.', test: c => GAMES.filter(g => !g.arcade).every(g => (c.state.games[g.id]?.finished || 0) > 0) },
  { id: 'campeon', name: 'Campeón Bongi', desc: 'Tené un récord en los 8 juegos de Bongi Arcade.', test: c => GAMES.filter(g => g.arcade).every(g => (c.state.games[g.id]?.best || 0) > 0) },
  { id: 'coleccionista', name: 'Coleccionista de dulces', desc: 'Juntá 500 golosinas en total en Bongi Arcade.', test: c => (c.state.totals?.candies || 0) >= 500 },
  { id: 'gomitas', name: 'Experto en gomitas', desc: 'Superá el nivel 10 de Bongi Crush.', test: c => c.id === 'crush' && c.result.won && (c.result.extra?.level || 0) >= 10 },
  { id: 'crush3', name: 'Tres estrellas', desc: 'Ganá un nivel de Bongi Crush con 3 estrellas.', test: c => c.id === 'crush' && c.result.stars === 3 },
  { id: 'chocolate', name: 'Maestro del chocolate', desc: 'Superá el Reino de los Chocolates en Bongi World.', test: c => c.id === 'world' && (c.result.extra?.worlds || 0) >= 1 },
  { id: 'castillo', name: 'Héroe del castillo', desc: 'Derrotá al jefe del Castillo de los Dulces en Bongi World.', test: c => c.id === 'world' && (c.result.extra?.worlds || 0) >= 5 },
  { id: 'laberinto', name: 'Rey del laberinto', desc: 'Completá 3 laberintos seguidos en Bongi Maze.', test: c => c.id === 'maze' && (c.result.extra?.mazes || 0) >= 3 },
  { id: 'bloques40', name: 'Arquitecto dulce', desc: 'Completá 40 filas en una partida de Bongi Blocks.', test: c => c.id === 'blocks' && (c.result.extra?.lines || 0) >= 40 },
  { id: 'bloques4', name: 'Cuádruple confite', desc: 'Completá 4 filas de una sola vez en Bongi Blocks.', test: c => c.id === 'blocks' && (c.result.extra?.quad || 0) >= 1 },
  { id: 'rompebloques', name: 'Rompebloques profesional', desc: 'Superá 5 niveles de Bongi Breaker.', test: c => c.id === 'breaker' && (c.result.extra?.cleared || 0) >= 5 },
  { id: 'bombi3', name: 'Dinamita de caramelo', desc: 'Superá 3 niveles de Bombi Bongi.', test: c => c.id === 'bombi' && (c.result.extra?.cleared || 0) >= 3 },
  { id: 'pongbot', name: 'Le gané al Bongi Bot', desc: 'Ganale al Bongi Bot en dificultad difícil.', test: c => c.id === 'pong' && c.result.extra?.hardWin === 1 },
  { id: 'operacion', name: 'Receta a salvo', desc: 'Derrotá a un jefe en Candy of Bongi.', test: c => c.id === 'candyof' && (c.result.extra?.bosses || 0) >= 1 },
  { id: 'record', name: 'Nuevo récord', desc: 'Superá uno de tus récords.', test: c => c.isRecord && c.prevBest > 0 },
  { id: 'diario', name: 'Antojo del día', desc: 'Cumplí un desafío diario.', test: c => c.dailyDone },
  { id: 'racha3', name: 'Tres días seguidos', desc: 'Jugá tres días seguidos.', test: c => c.state.streak.count >= 3 },
  { id: 'nivel5', name: 'Bombón', desc: 'Llegá al nivel 5.', test: c => c.level.level >= 5 },
  { id: 'maraton', name: 'Maratón dulce', desc: 'Terminá 25 partidas.', test: c => c.state.stats.finished >= 25 },
  { id: 'atrapa300', name: 'Manos rápidas', desc: 'Hacé 300 puntos en Atrapa Golosinas.', test: c => c.id === 'atrapa' && c.result.score >= 300 },
  { id: 'atrapacombo', name: 'Bolsa llena', desc: 'Atrapá 20 golosinas seguidas.', test: c => c.id === 'atrapa' && (c.result.extra?.combo || 0) >= 20 },
  { id: 'memoriaperfecta', name: 'Memoria de elefante', desc: 'Completá Memoria Dulce sin errores.', test: c => c.id === 'memoria' && c.result.extra?.perfect === 1 },
  { id: 'memoria3', name: 'Memoria XL', desc: 'Superá el nivel 3 de Memoria Dulce.', test: c => c.id === 'memoria' && (c.result.extra?.level || 0) >= 3 },
  { id: 'matchcombo', name: 'Cascada de caramelos', desc: 'Lográ un combo x4 en Candy Match.', test: c => c.id === 'match' && (c.result.extra?.combo || 0) >= 4 },
  { id: 'matchnivel3', name: 'Confitero', desc: 'Llegá al nivel 3 de Candy Match.', test: c => c.id === 'match' && (c.result.extra?.level || 0) >= 3 },
  { id: 'trivia10', name: 'Enciclopedia dulce', desc: 'Respondé bien las 10 preguntas de una trivia.', test: c => c.id === 'trivia' && (c.result.extra?.correct || 0) >= 10 },
  { id: 'triviaracha', name: 'Racha de cacao', desc: 'Encadená 5 respuestas correctas.', test: c => c.id === 'trivia' && (c.result.extra?.streak || 0) >= 5 },
  { id: 'desafio15', name: 'Ojo de halcón', desc: 'Acertá 15 consignas en El desafío Bongi.', test: c => c.id === 'desafio' && (c.result.extra?.correct || 0) >= 15 },
  { id: 'globoperfecto', name: 'Pulmones de acero', desc: 'Inflá 5 globos perfectos en una partida de Globo de Chicle.', test: c => c.id === 'globo' && (c.result.extra?.perfects || 0) >= 5 },
  { id: 'frascos10', name: 'Oído de oro', desc: 'Repetí una secuencia de 10 en Frascos Musicales.', test: c => c.id === 'frascos' && (c.result.extra?.seq || 0) >= 10 },
  { id: 'carrera1000', name: 'Mil metros de chocolate', desc: 'Recorré 1000 m en Carrera de Chocolates.', test: c => c.id === 'carrera' && (c.result.extra?.meters || 0) >= 1000 }
];
