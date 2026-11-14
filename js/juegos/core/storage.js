// Progreso del jugador guardado SOLO en este dispositivo (localStorage).
// No se piden datos personales: solo un apodo opcional.
const KEY = 'bb.juegos.v1';

const fresh = () => ({
  nick: '', xp: 0, created: Date.now(),
  streak: { count: 0, last: '' },
  daily: { date: '', done: false },
  stats: { played: 0, finished: 0, ms: 0 },
  games: {},            // id → { played, finished, best, top: [{score, date, nick}] , extra: {} }
  achievements: {},     // id → fecha ISO
  settings: { sound: true, volume: 0.7, music: false }
});

let state = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === 'object') return { ...fresh(), ...raw, settings: { ...fresh().settings, ...(raw.settings || {}) } };
  } catch { /* datos corruptos o sin acceso */ }
  return fresh();
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado */ } }

export const store = {
  get: () => state,
  save: persist,
  reset() { state = fresh(); persist(); },
  game(id) { return (state.games[id] ||= { played: 0, finished: 0, best: 0, top: [], extra: {} }); },
  setting(k, v) { if (v === undefined) return state.settings[k]; state.settings[k] = v; persist(); return v; }
};

/* ---------- Fecha local (Córdoba) para racha y desafío diario ---------- */
export function today(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Cordoba' }).format(d); // AAAA-MM-DD
}
function yesterday() { return today(new Date(Date.now() - 864e5)); }

export function touchStreak() {
  const t = today();
  if (state.streak.last === t) return state.streak.count;
  state.streak.count = state.streak.last === yesterday() ? state.streak.count + 1 : 1;
  state.streak.last = t;
  persist();
  return state.streak.count;
}

/* ---------- Niveles ---------- */
export const LEVEL_NAMES = ['Caramelito', 'Gomita', 'Chupetín', 'Confite', 'Bombón', 'Alfajor', 'Chocolatín', 'Maestro dulce', 'Leyenda dulce'];
export function levelInfo(xp = state.xp) {
  let lvl = 1, need = 150, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = 150 + (lvl - 1) * 100; }
  return { level: lvl, name: LEVEL_NAMES[Math.min(lvl - 1, LEVEL_NAMES.length - 1)], into: xp - acc, need, pct: (xp - acc) / need };
}

/** Registra una partida terminada. Devuelve datos para la pantalla de resultados. */
export function recordResult(id, result, xpGain) {
  const g = store.game(id);
  const prevBest = g.best;
  g.finished++; state.stats.finished++;
  state.stats.ms += result.ms || 0;
  const isRecord = result.score > prevBest;
  if (isRecord) g.best = result.score;
  g.top.push({ score: result.score, date: today(), nick: state.nick || 'Vos' });
  g.top.sort((a, b) => b.score - a.score);
  g.top = g.top.slice(0, 5);
  for (const [k, v] of Object.entries(result.extra || {})) {
    if (typeof v === 'number') g.extra[k] = Math.max(g.extra[k] || 0, v);
  }
  const before = levelInfo();
  state.xp += xpGain;
  const after = levelInfo();
  persist();
  return { isRecord, prevBest, levelUp: after.level > before.level, level: after };
}

export function markPlayed(id) { store.game(id).played++; state.stats.played++; touchStreak(); persist(); }

/* ---------- Apodo con filtro de palabras ofensivas y spam ---------- */
const BLOCK = ['puto', 'puta', 'mierda', 'concha', 'pija', 'verga', 'culo', 'bolud', 'pelotud', 'forro', 'trolo', 'garch', 'orto', 'chota', 'sorete', 'idiota', 'imbecil', 'estupid', 'tarad', 'mogolic', 'nazi', 'hitler', 'fuck', 'shit', 'bitch', 'porn', 'sexo', 'sex', 'nigg', 'negr0', 'marica', 'putit', 'cagad', 'pajer', 'violad', 'droga', 'coca', 'faso', 'kill', 'matar'];
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/7/g, 't')
  .replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');

export function validateNick(raw) {
  const nick = String(raw || '').trim().replace(/\s+/g, ' ');
  if (nick.length < 3 || nick.length > 16) return { ok: false, msg: 'El apodo tiene que tener entre 3 y 16 caracteres.' };
  if (!/^[\p{L}\p{N} _-]+$/u.test(nick)) return { ok: false, msg: 'Usá solo letras, números, espacios, guiones o guion bajo.' };
  if (/(https?|www|\.com|\.ar)/i.test(nick) || /\d{5,}/.test(nick)) return { ok: false, msg: 'El apodo no puede tener enlaces ni números largos.' };
  const n = normalize(nick);
  if (BLOCK.some(w => n.includes(w.replace(/(.)\1+/g, '$1')))) return { ok: false, msg: 'Ese apodo no está permitido. Probá con otro.' };
  return { ok: true, nick };
}
