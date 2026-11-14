// Catálogo de juegos. Para sumar un juego: crear js/juegos/games/<id>.js
// (exporta default { mount(root, ctx) }) y agregar una entrada acá.
export const GAMES = [
  { id: 'atrapa', title: 'Atrapa Golosinas', tag: 'Reflejos', icon: 'caramelo', color: '#ffd166',
    desc: 'Mové la bolsa y atrapá todo lo dulce que cae. Esquivá el brócoli y el ají.',
    how: ['Arrastrá el dedo o usá ← → (o A y D) para mover la bolsa.', 'Cada golosina suma 10 puntos; la estrella dorada, 50; el reloj suma 5 segundos.', 'Brócoli, ají y piedras restan 20 y cortan tu combo.', 'Tenés 60 segundos. ¡Cada vez cae más rápido!'],
    load: () => import('../games/atrapa.js'), xp: s => s / 6, daily: 300 },
  { id: 'memoria', title: 'Memoria Dulce', tag: 'Memoria', icon: 'paleta', color: '#06d6a0',
    desc: 'Encontrá los pares de golosinas con la menor cantidad de movimientos.',
    how: ['Tocá dos cartas para darlas vuelta.', 'Si son iguales, quedan descubiertas.', 'Menos movimientos y menos tiempo = más puntos.', 'Superá un nivel para desbloquear el siguiente.'],
    load: () => import('../games/memoria.js'), xp: s => s / 20, daily: 900 },
  { id: 'match', title: 'Candy Match', tag: 'Combinar', icon: 'confite', color: '#ff8fb1',
    desc: 'Intercambiá golosinas vecinas y armá filas de tres o más iguales.',
    how: ['Tocá una golosina y después una vecina para intercambiarlas (o deslizá).', 'Solo valen los cambios que forman una fila o columna de 3 o más.', 'Las cascadas multiplican los puntos.', 'Llegá a la meta de cada nivel antes de quedarte sin movimientos.'],
    load: () => import('../games/match.js'), xp: s => s / 60, daily: 2500 },
  { id: 'trivia', title: '¿Cuánto conocés de golosinas?', tag: 'Trivia', icon: 'alfajor', color: '#ffb38f',
    desc: 'Diez preguntas sobre chocolates, alfajores y golosinas. Datos verificados.',
    how: ['Elegí la dificultad.', 'Respondé antes de que se acabe el tiempo: cuanto más rápido, más puntos.', 'Las respuestas seguidas correctas suman racha.', 'Después de cada pregunta vas a ver una curiosidad.'],
    load: () => import('../games/trivia.js'), xp: s => s / 40, daily: 1500 },
  { id: 'desafio', title: 'El desafío Bongi', tag: 'Rapidez', icon: 'chupetin', color: '#bfe9ff',
    desc: '45 segundos de consignas rápidas: clasificá, reconocé y contá golosinas.',
    how: ['Elegí un modo o jugá el mixto.', '¿Dulce o copetín?: clasificá las fotos de la vidriera.', '¿Qué golosina es?: reconocé la ilustración.', 'Contá los confites: memorizá cuántos aparecen.'],
    load: () => import('../games/desafio.js'), xp: s => s / 8, daily: 200 },
  { id: 'carrera', title: 'Carrera de Chocolates', tag: 'Esquivar', icon: 'chocolate', color: '#f6dbe3',
    desc: 'Corré por el camino de caramelo, juntá chocolates y esquivá obstáculos.',
    how: ['Deslizá o tocá a los costados de la pista para cambiar de carril. En teclado: ← → o A y D.', 'Cada chocolate suma 25 puntos; cada metro recorrido, 1.', 'Tenés 3 vidas. La velocidad aumenta con la distancia.'],
    load: () => import('../games/carrera.js'), xp: s => s / 25, daily: 900 },
  { id: 'globo', title: 'Globo de Chicle', tag: 'Precisión', icon: 'chicle', color: '#d9c8ff',
    desc: 'Inflá el globo de chicle hasta el aro dorado… sin que te explote.',
    how: ['Mantené apretado el globo (o la barra espaciadora) para inflarlo.', 'Soltá cuando llegue al aro dorado: si lo tocás, es un globo perfecto.', 'Si te pasás, ¡explota! y la ronda no suma.', 'Son 10 rondas y cada una infla más rápido.'],
    load: () => import('../games/globo.js'), xp: s => s / 15, daily: 800 },
  { id: 'frascos', title: 'Frascos Musicales', tag: 'Ritmo', icon: 'mielcita', color: '#b8f2c8',
    desc: 'Mirá y escuchá la secuencia de frascos y repetila sin equivocarte.',
    how: ['Los frascos se iluminan y suenan en un orden.', 'Repetí la secuencia tocándolos (o con las teclas 1 a 4).', 'Cada ronda suma un frasco y va más rápido.', 'Tenés dos oportunidades.'],
    load: () => import('../games/frascos.js'), xp: s => s / 5, daily: 300 }
];

export const byId = id => GAMES.find(g => g.id === id);

/** Desafío del día: mismo juego y meta para todos en la misma fecha. */
export function dailyFor(dateStr) {
  let h = 0; for (const ch of dateStr) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const g = GAMES[h % GAMES.length];
  return { game: g, target: g.daily };
}

export const ACHIEVEMENTS = [
  { id: 'primera', name: 'Primer bocado', desc: 'Terminá tu primera partida.', test: c => c.state.stats.finished >= 1 },
  { id: 'explorador', name: 'Probador oficial', desc: 'Terminá una partida de cada uno de los 8 juegos.', test: c => GAMES.every(g => (c.state.games[g.id]?.finished || 0) > 0) },
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
