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
  pop: () => { noise({ dur: 0.18, vol: 0.35, freq: 900 }); tone({ f: 500, f2: 90, type: 'square', dur: 0.12, vol: 0.12 }); }
};

/* Música opcional: una melodía corta en bucle, apagada por defecto. */
const MELODY = [72, 76, 79, 76, 77, 81, 79, 0, 72, 76, 79, 84, 83, 79, 77, 0];
const BASS = [48, 48, 53, 53, 55, 55, 48, 48];
function scheduleMusic() {
  const a = ctx(); if (!a) return;
  const n = MELODY[musicStep % MELODY.length];
  if (n) tone({ f: NOTE(n), type: 'triangle', dur: 0.22, vol: 0.5, dest: musicGain });
  if (musicStep % 2 === 0) tone({ f: NOTE(BASS[(musicStep / 2) % BASS.length]), type: 'sine', dur: 0.4, vol: 0.6, dest: musicGain });
  musicStep++;
}
export const music = {
  start() { if (musicTimer || !store.setting('music') || !store.setting('sound')) return; ctx(); musicTimer = setInterval(scheduleMusic, 230); },
  stop() { clearInterval(musicTimer); musicTimer = 0; },
  sync() { if (store.setting('music') && store.setting('sound')) this.start(); else this.stop(); }
};

export function setSound(on) { store.setting('sound', on); ctx(); applyVolume(); music.sync(); }
export function setVolume(v) { store.setting('volume', v); if (ac) applyVolume(); }
export function setMusic(on) { store.setting('music', on); music.sync(); }
/** Llamar en el primer gesto del usuario para desbloquear el audio. */
export function unlock() { ctx(); }
