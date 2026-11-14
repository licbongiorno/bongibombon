// Identidad sonora de Bongi Juegos, sintetizada en el navegador con Web Audio.
// Ventajas: cero archivos que descargar, cero servicios externos, nada suena
// hasta que la persona interactúa (política de autoplay de los navegadores).
import { store } from './storage.js';

let ac = null, master = null, musicGain = null, musicTimer = 0, musicStep = 0;

function ctx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.gain.value = 0.18; musicGain.connect(master);
    applyVolume();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function applyVolume() {
  if (!master) return;
  const on = store.setting('sound');
  master.gain.setTargetAtTime(on ? store.setting('volume') : 0, ac.currentTime, 0.02);
}

function tone({ f = 440, f2, type = 'sine', t = 0, dur = 0.12, vol = 0.3, attack = 0.005, dest }) {
  const a = ctx(); if (!a || !store.setting('sound')) return;
  const o = a.createOscillator(), g = a.createGain();
  const start = a.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, start);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(dest || master);
  o.start(start); o.stop(start + dur + 0.02);
}
function noise({ t = 0, dur = 0.15, vol = 0.2, freq = 1200 }) {
  const a = ctx(); if (!a || !store.setting('sound')) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + t);
}

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

export const sfx = {
  click: () => tone({ f: 660, f2: 880, type: 'triangle', dur: 0.06, vol: 0.18 }),
  pick: (pitch = 0) => { tone({ f: 520 + pitch * 40, f2: 1040 + pitch * 60, type: 'sine', dur: 0.12, vol: 0.28 }); tone({ f: 1560 + pitch * 60, type: 'triangle', t: 0.03, dur: 0.06, vol: 0.08 }); },
  point: () => { tone({ f: NOTE(76), type: 'square', dur: 0.08, vol: 0.12 }); tone({ f: NOTE(83), type: 'square', t: 0.07, dur: 0.12, vol: 0.12 }); },
  flip: () => noise({ dur: 0.07, vol: 0.18, freq: 2400 }),
  error: () => { tone({ f: 220, f2: 110, type: 'sawtooth', dur: 0.22, vol: 0.14 }); },
  bonk: () => { tone({ f: 160, f2: 60, type: 'square', dur: 0.18, vol: 0.2 }); noise({ dur: 0.12, vol: 0.15, freq: 300 }); },
  combo: (n = 1) => { const base = 72 + Math.min(n, 8) * 2; [0, 4, 7].forEach((s, i) => tone({ f: NOTE(base + s), type: 'triangle', t: i * 0.05, dur: 0.14, vol: 0.16 })); },
  win: () => [72, 76, 79, 84, 88].forEach((n, i) => tone({ f: NOTE(n), type: 'triangle', t: i * 0.09, dur: 0.22, vol: 0.2 })),
  lose: () => [67, 64, 60].forEach((n, i) => tone({ f: NOTE(n), type: 'triangle', t: i * 0.14, dur: 0.25, vol: 0.18 })),
  achievement: () => { [84, 88, 91, 96].forEach((n, i) => tone({ f: NOTE(n), type: 'sine', t: i * 0.06, dur: 0.35, vol: 0.14 })); noise({ t: 0.05, dur: 0.3, vol: 0.06, freq: 6000 }); },
  record: () => { [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => tone({ f: NOTE(n + 12), type: i % 2 ? 'square' : 'triangle', t: i * 0.08, dur: 0.18, vol: 0.13 })); },
  tick: () => tone({ f: 1200, type: 'square', dur: 0.03, vol: 0.06 }),
  /** Nota de un frasco musical (0–3): do, mi, sol, do agudo. */
  note: (i, dur = 0.32) => { const n = [60, 64, 67, 72][i] + 12; tone({ f: NOTE(n), type: 'triangle', dur, vol: 0.28 }); tone({ f: NOTE(n + 12), type: 'sine', dur: dur * .6, vol: 0.06 }); },
  /** Silbido ascendente del chicle al inflarse (p: 0–1). */
  inflate: p => tone({ f: 220 + p * 500, f2: 240 + p * 520, type: 'sine', dur: 0.09, vol: 0.07 }),
  pop: () => { noise({ dur: 0.18, vol: 0.35, freq: 900 }); tone({ f: 500, f2: 90, type: 'square', dur: 0.12, vol: 0.12 }); },
  // --- Arcade ---
  jump: () => tone({ f: 330, f2: 660, type: 'square', dur: 0.14, vol: 0.1 }),
  jump2: () => tone({ f: 500, f2: 1000, type: 'square', dur: 0.12, vol: 0.09 }),
  coin: () => { tone({ f: NOTE(83), type: 'square', dur: 0.06, vol: 0.09 }); tone({ f: NOTE(88), type: 'square', t: 0.06, dur: 0.14, vol: 0.09 }); },
  stomp: () => { tone({ f: 300, f2: 120, type: 'square', dur: 0.1, vol: 0.16 }); noise({ dur: 0.06, vol: 0.1, freq: 700 }); },
  hurt: () => { tone({ f: 400, f2: 80, type: 'sawtooth', dur: 0.35, vol: 0.14 }); },
  powerup: () => [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone({ f: NOTE(n + 12), type: 'triangle', t: i * 0.04, dur: 0.1, vol: 0.12 })),
  explode: (big = 1) => { noise({ dur: 0.35 * big, vol: 0.32, freq: 260 }); tone({ f: 140, f2: 40, type: 'sine', dur: 0.3 * big, vol: 0.3 }); },
  shoot: (k = 0) => tone({ f: 900 - k * 120, f2: 300 - k * 40, type: k % 2 ? 'triangle' : 'square', dur: 0.07, vol: 0.06 }),
  bounce: (p = 0) => tone({ f: 420 + p * 60, type: 'square', dur: 0.04, vol: 0.09 }),
  brick: (p = 0) => tone({ f: NOTE(72 + (p % 12)), type: 'triangle', dur: 0.08, vol: 0.12 }),
  rotate: () => tone({ f: 700, f2: 900, type: 'triangle', dur: 0.04, vol: 0.07 }),
  drop: () => { tone({ f: 200, f2: 90, type: 'square', dur: 0.08, vol: 0.12 }); },
  line: (n = 1) => { [72, 76, 79, 84].slice(0, n + 1).forEach((m, i) => tone({ f: NOTE(m + 12), type: 'square', t: i * 0.05, dur: 0.12, vol: 0.1 })); noise({ dur: 0.2, vol: 0.12, freq: 4000 }); },
  chomp: (alt = 0) => tone({ f: alt ? 520 : 380, f2: alt ? 380 : 520, type: 'triangle', dur: 0.07, vol: 0.08 }),
  power: () => { for (let i = 0; i < 6; i++) tone({ f: 300 + i * 90, type: 'square', t: i * 0.03, dur: 0.05, vol: 0.06 }); },
  gameover: () => [64, 62, 60, 55, 52].forEach((n, i) => tone({ f: NOTE(n), type: 'square', t: i * 0.16, dur: 0.24, vol: 0.12 })),
  fanfare: () => [67, 72, 76, 79, 76, 79, 84].forEach((n, i) => tone({ f: NOTE(n), type: i > 4 ? 'square' : 'triangle', t: i * 0.11, dur: i === 6 ? 0.5 : 0.16, vol: 0.13 }))
};

/* Música opcional (apagada por defecto). Pistas originales compuestas para Bongi:
   melodía y bajo en notas MIDI (0 = silencio) y tempo en ms por paso. */
export const TRACKS = {
  plaza: { tempo: 230, wave: 'triangle', mel: [72, 76, 79, 76, 77, 81, 79, 0, 72, 76, 79, 84, 83, 79, 77, 0], bass: [48, 48, 53, 53, 55, 55, 48, 48] },
  chocolate: { tempo: 190, wave: 'square', mel: [67, 0, 71, 72, 74, 72, 71, 67, 69, 0, 72, 74, 76, 74, 72, 69], bass: [43, 43, 48, 48, 45, 45, 50, 50] },
  gomitas: { tempo: 170, wave: 'triangle', mel: [76, 79, 81, 79, 76, 74, 72, 0, 74, 76, 79, 76, 74, 72, 69, 0], bass: [45, 52, 45, 52, 43, 50, 43, 50] },
  alfajor: { tempo: 210, wave: 'square', mel: [69, 72, 76, 72, 69, 72, 77, 76, 74, 71, 67, 71, 74, 76, 74, 0], bass: [45, 45, 41, 41, 43, 43, 40, 40] },
  fabrica: { tempo: 150, wave: 'square', mel: [72, 72, 79, 72, 75, 72, 79, 77, 70, 70, 77, 70, 74, 70, 77, 75], bass: [36, 36, 36, 36, 34, 34, 34, 34] },
  castillo: { tempo: 200, wave: 'sawtooth', mel: [69, 0, 69, 72, 71, 69, 68, 0, 69, 0, 76, 74, 72, 71, 69, 0], bass: [33, 33, 40, 40, 33, 33, 40, 44] },
  laberinto: { tempo: 160, wave: 'square', mel: [72, 0, 79, 0, 76, 0, 79, 0, 74, 0, 77, 0, 76, 74, 72, 0], bass: [48, 0, 55, 0, 48, 0, 55, 0] },
  bloques: { tempo: 180, wave: 'triangle', mel: [76, 71, 72, 74, 72, 71, 69, 69, 72, 76, 74, 72, 71, 72, 74, 76], bass: [40, 40, 45, 45, 44, 44, 45, 45] },
  accion: { tempo: 140, wave: 'square', mel: [64, 64, 67, 64, 69, 67, 64, 62, 64, 64, 67, 69, 71, 69, 67, 64], bass: [40, 40, 40, 43, 45, 45, 43, 40] }
};
let track = TRACKS.plaza;
function scheduleMusic() {
  const a = ctx(); if (!a) return;
  const n = track.mel[musicStep % track.mel.length];
  if (n) tone({ f: NOTE(n), type: track.wave, dur: track.tempo / 1000 * .9, vol: track.wave === 'triangle' ? 0.5 : 0.22, dest: musicGain });
  if (musicStep % 2 === 0) { const b = track.bass[(musicStep / 2) % track.bass.length]; if (b) tone({ f: NOTE(b), type: 'sine', dur: track.tempo / 1000 * 1.7, vol: 0.6, dest: musicGain }); }
  musicStep++;
}
export const music = {
  start() { if (musicTimer || !store.setting('music') || !store.setting('sound')) return; ctx(); musicTimer = setInterval(scheduleMusic, track.tempo); },
  stop() { clearInterval(musicTimer); musicTimer = 0; },
  sync() { if (store.setting('music') && store.setting('sound')) this.start(); else this.stop(); },
  /** Cambia de pista (por juego o por mundo). */
  play(name) { const t = TRACKS[name] || TRACKS.plaza; if (t === track && musicTimer) return; track = t; musicStep = 0; this.stop(); this.sync(); }
};

export function setSound(on) { store.setting('sound', on); ctx(); applyVolume(); music.sync(); }
export function setVolume(v) { store.setting('volume', v); if (ac) applyVolume(); }
export function setMusic(on) { store.setting('music', on); music.sync(); }
/** Llamar en el primer gesto del usuario para desbloquear el audio. */
export function unlock() { ctx(); }
