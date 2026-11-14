// Plataforma Bongi Arcade: perfil, sonido, desafío diario, logros, récords
// y el "escenario" (dialog) donde se monta cada juego bajo demanda.
import { store, today, levelInfo, recordResult, markPlayed, validateNick, touchStreak } from './storage.js?v=cfab42284a';
import { sfx, music, setSound, setVolume, setMusic, unlock } from './audio.js?v=cfab42284a';
import { confetti, floatText, shake } from './fx.js?v=cfab42284a';
import { GAMES, byId, dailyFor, ACHIEVEMENTS, AVATARS } from './registry.js?v=cfab42284a';
import { candySVG } from '../../candies.js?v=cfab42284a';
import { track } from '../../analytics.js?v=cfab42284a';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = n => Math.round(n).toLocaleString('es-AR');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const stage = $('[data-stage]');
// Respaldo para navegadores sin <dialog> nativo (por ejemplo iOS anteriores a 15.4)
for (const d of document.querySelectorAll('dialog')) {
  if (typeof d.showModal === 'function') continue;
  d.showModal = () => { d.setAttribute('open', ''); d.classList.add('dialog-fallback'); };
  d.close = () => { if (!d.hasAttribute('open')) return; d.removeAttribute('open'); d.dispatchEvent(new Event('close')); };
  d.addEventListener('submit', e => { if (e.target.method === 'dialog' && !e.defaultPrevented) { e.preventDefault(); d.close(); } });
}
const body = $('[data-stage-body]');
const hudEl = $('[data-hud]');
const gameTools = $$('[data-game-tool]');
let active = null;   // { game, impl, instance, startedAt }
let lastTrigger = null;

/* ---------- Ilustraciones ---------- */
$$('[data-icon]').forEach(el => (el.innerHTML = candySVG(el.dataset.icon)));

/* ---------- Perfil ---------- */
function paintProfile() {
  const s = store.get(), lv = levelInfo();
  $('[data-avatar]').innerHTML = candySVG(s.avatar || 'bombon');
  $('[data-nick]').textContent = s.nick || 'Jugador sin apodo';
  $('[data-edit-nick]').textContent = s.nick ? 'Editar perfil' : 'Elegir apodo y avatar';
  $('[data-level]').textContent = lv.level;
  $('[data-level-name]').textContent = lv.name;
  const bar = $('[data-xpbar]');
  bar.setAttribute('aria-valuenow', String(Math.round(lv.pct * 100)));
  bar.setAttribute('aria-valuetext', `${fmt(lv.into)} de ${fmt(lv.need)} puntos de experiencia`);
  bar.firstElementChild.style.width = `${lv.pct * 100}%`;
  $('[data-streak]').textContent = `${s.streak.count} ${s.streak.count === 1 ? 'día' : 'días'}`;
  $('[data-points]').textContent = fmt(s.points || 0);
  $('[data-ach-count]').textContent = `${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length}`;
  for (const g of GAMES) {
    const best = s.games[g.id]?.best || 0;
    $$(`[data-best="${g.id}"]`).forEach(el => (el.textContent = best ? `Tu récord: ${fmt(best)}` : 'Sin récord todavía'));
  }
  // Tus más jugados
  const fav = GAMES.map(g => [g, s.games[g.id]?.played || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  $$('.acard').forEach(c => c.classList.toggle('is-fav', fav.some(([g]) => g.id === c.dataset.id)));
  paintDaily(); paintBadges(); paintRecords();
}

function paintDaily() {
  const d = dailyFor(today()), done = store.get().daily.date === today() && store.get().daily.done;
  $('[data-daily-text]').textContent = done
    ? '¡Cumplido! Volvé mañana para un desafío nuevo.'
    : `Hacé ${fmt(d.target)} puntos en ${d.game.title}. Premio: 50 Puntos Bongi extra.`;
  $('[data-daily]').classList.toggle('is-done', done);
  $('[data-daily-play]').dataset.play = d.game.id;
}

function paintBadges() {
  const got = store.get().achievements;
  $('[data-badges]').innerHTML = ACHIEVEMENTS.map(a => `<li class="badge${got[a.id] ? ' is-on' : ''}">
    <span class="badge__medal" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="/assets/brand/iconos.svg#${got[a.id] ? 'trophy' : 'star'}"/></svg></span>
    <span><strong>${esc(a.name)}</strong><span>${esc(a.desc)}</span><em>${got[a.id] ? 'Desbloqueado' : 'Bloqueado'}</em></span></li>`).join('');
}

function paintRecords() {
  const s = store.get();
  const played = GAMES.filter(g => s.games[g.id]?.top?.length);
  $('[data-records]').innerHTML = (played.length ? played.map(g => `<div class="rec"><h3>${esc(g.title)}</h3><ol>${s.games[g.id].top.map(t =>
    `<li><span>${esc(t.nick)}</span><b>${fmt(t.score)}</b><small>${esc(t.date.split('-').reverse().join('/'))}</small></li>`).join('')}</ol></div>`).join('')
    : '<p class="muted">Todavía no hay récords en este dispositivo. ¡Elegí un juego y estrenalo!</p>') +
    `<p class="rec__stats">Partidas empezadas: <b>${fmt(s.stats.played)}</b> · terminadas: <b>${fmt(s.stats.finished)}</b> · tiempo jugado: <b>${Math.round(s.stats.ms / 60000)} min</b> · golosinas recogidas: <b>${fmt(s.totals?.candies || 0)}</b></p>`;
}

/* ---------- Sonido y ajustes ---------- */
function paintSound() {
  const on = store.setting('sound');
  $$('[data-sound-toggle]').forEach(b => {
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('use').setAttribute('href', `/assets/brand/iconos.svg#${on ? 'sound-on' : 'sound-off'}`);
    b.querySelector('span').textContent = on ? 'Sonido activado' : 'Sonido desactivado';
  });
  $('[data-volume]').value = store.setting('volume');
  $('[data-music]').checked = store.setting('music');
  $('[data-shake]').checked = store.setting('shake');
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-sound-toggle]')) { setSound(!store.setting('sound')); paintSound(); sfx.click(); }
}, true);
$('[data-volume]').addEventListener('input', e => setVolume(Number(e.target.value)));
$('[data-volume]').addEventListener('change', () => sfx.pick());
$('[data-music]').addEventListener('change', e => { unlock(); setMusic(e.target.checked); });
$('[data-shake]').addEventListener('change', e => store.setting('shake', e.target.checked));
document.addEventListener('pointerdown', unlock, { once: true });
document.addEventListener('keydown', unlock, { once: true });

/* ---------- Perfil: apodo y avatar ---------- */
const nickDialog = $('[data-nick-dialog]');
const nickForm = $('[data-nick-form]');
const avatarBox = $('[data-avatars]');
avatarBox.innerHTML = AVATARS.map(a => `<label class="avatar-opt"><input type="radio" name="avatar" value="${a}"><span>${candySVG(a)}</span><span class="sr-only">${a}</span></label>`).join('');
$('[data-edit-nick]').addEventListener('click', () => {
  nickForm.nick.value = store.get().nick;
  const cur = avatarBox.querySelector(`input[value="${store.get().avatar || 'bombon'}"]`); if (cur) cur.checked = true;
  $('#nick-err').textContent = ''; nickDialog.showModal();
});
nickForm.addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  const raw = nickForm.nick.value.trim();
  if (raw) {
    const v = validateNick(raw);
    if (!v.ok) { e.preventDefault(); $('#nick-err').textContent = v.msg; nickForm.nick.focus(); return; }
    store.get().nick = v.nick;
  }
  const av = nickForm.querySelector('input[name="avatar"]:checked')?.value;
  if (av && AVATARS.includes(av)) store.get().avatar = av;
  store.save(); paintProfile(); sfx.point();
});

/* ---------- Borrar progreso (confirmación en la página) ---------- */
const resetBtn = $('[data-reset]');
resetBtn.addEventListener('click', () => {
  if (resetBtn.dataset.armed) { store.reset(); paintSound(); paintProfile(); resetBtn.textContent = 'Progreso borrado'; delete resetBtn.dataset.armed; return; }
  resetBtn.dataset.armed = '1'; resetBtn.textContent = 'Tocá de nuevo para confirmar: se borra todo';
  setTimeout(() => { if (resetBtn.dataset.armed) { delete resetBtn.dataset.armed; resetBtn.textContent = 'Borrar mi progreso'; } }, 5000);
});

/* ---------- Toasts ---------- */
function toast(html) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = html;
  $('[data-toasts]').append(t);
  setTimeout(() => t.classList.add('is-out'), 3600);
  setTimeout(() => t.remove(), 4200);
}

/* ---------- HUD ---------- */
function hud(items) {
  hudEl.innerHTML = Object.entries(items).map(([k, v]) => `<span class="hud__item"><small>${esc(k)}</small><b>${esc(v)}</b></span>`).join('');
}

/* ---------- Escenario ---------- */
function setTools(on) { gameTools.forEach(b => (b.hidden = !on)); }

async function openGame(id, { skipIntro = false } = {}) {
  const game = byId(id); if (!game) return;
  unlock(); sfx.click();
  teardown();
  $('[data-stage-title]').textContent = game.title;
  stage.dataset.game = id;
  stage.classList.toggle('stage--arcade', !!game.arcade);
  hud({}); setTools(false);
  if (!stage.open) stage.showModal();
  document.documentElement.classList.add('is-playing');
  const modP = game.load();
  modP.catch(() => loadError(game));
  if (skipIntro) { const mod = await modP.catch(() => null); return mod && startGame(game, mod.default); }
  body.innerHTML = `<div class="intro">
      <div class="intro__icon" aria-hidden="true">${candySVG(game.icon)}</div>
      <h3>Cómo se juega</h3>
      <ul>${game.how.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
      ${game.controls ? `<div class="intro__controls"><p>Controles</p><dl>${game.controls.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>` : ''}
      <button class="btn btn--banana" type="button" data-start>¡A jugar!</button>
    </div>`;
  $('[data-start]', body).focus();
  $('[data-start]', body).addEventListener('click', async () => { const mod = await modP.catch(() => null); if (mod) startGame(game, mod.default); }, { once: true });
}
function loadError(game) {
  body.innerHTML = `<div class="intro"><h3>No se pudo cargar ${esc(game.title)}</h3><p>Revisá tu conexión a internet y probá de nuevo.</p><button class="btn btn--banana" type="button" data-retry>Reintentar</button></div>`;
  $('[data-retry]', body).addEventListener('click', () => location.reload());
}

function startGame(game, impl, opts = {}) {
  teardown();
  body.innerHTML = '';
  const root = document.createElement('div');
  root.className = `game game--${game.id}`;
  body.append(root);
  markPlayed(game.id);
  track('game_start', { label: game.id });
  music.play(game.music || 'plaza');
  setTools(true);
  const ctx = {
    sfx, hud, reduceMotion, confetti, shake,
    music: name => music.play(name),
    float: (x, y, text, color) => floatText(root, x, y, text, color),
    best: store.game(game.id).best,
    extra: store.game(game.id).extra,
    data: store.data(game.id),
    save: () => store.save(),
    again: !!opts.again,
    end: result => finish(game, result),
    restart: () => startGame(game, impl, { again: true }),
    exit: () => closeStage()
  };
  active = { game, impl, startedAt: performance.now(), instance: null };
  active.instance = impl.mount(root, ctx);
}

function teardown() {
  if (!active) return;
  active.instance?.destroy?.();
  active = null;
  music.stop();
}

function finish(game, result) {
  if (!active || active.game !== game) return;
  const ms = performance.now() - active.startedAt;
  const impl = active.impl;
  teardown();
  setTools(false);
  result.score = Math.max(0, Math.round(result.score || 0));
  result.ms = ms;

  let xp = 10 + Math.min(90, Math.round(game.xp(result.score)));
  const d = dailyFor(today()), s = store.get();
  let dailyDone = false;
  if (d.game.id === game.id && result.score >= d.target && !(s.daily.date === today() && s.daily.done)) {
    s.daily = { date: today(), done: true }; dailyDone = true; xp += 50;
  }
  const info = recordResult(game.id, result, xp);
  touchStreak();

  const unlocked = [];
  const c = { state: store.get(), id: game.id, result, isRecord: info.isRecord, prevBest: info.prevBest, dailyDone, level: info.level };
  for (const a of ACHIEVEMENTS) {
    if (!c.state.achievements[a.id] && a.test(c)) { c.state.achievements[a.id] = today(); unlocked.push(a); c.state.points = (c.state.points || 0) + 25; }
  }
  store.save();
  track('game_end', { label: game.id, score: result.score, record: info.isRecord });
  if (info.isRecord && info.prevBest > 0) track('game_record', { label: game.id, score: result.score });
  unlocked.forEach(a => track('achievement_unlock', { label: a.id }));

  showResults(game, impl, result, info, xp, unlocked, dailyDone);
  paintProfile();
}

function showResults(game, impl, result, info, xp, unlocked, dailyDone) {
  const record = info.isRecord && result.score > 0;
  const won = result.won !== false;
  const headline = record ? (info.prevBest ? '¡Nuevo récord!' : '¡Primer récord!') : result.title || (won ? '¡Victoria!' : 'Fin de la partida');
  body.innerHTML = `<div class="results${record ? ' is-record' : ''}${won ? '' : ' is-lost'}">
    ${record ? '<p class="results__ribbon">Récord</p>' : ''}
    <h3>${esc(headline)}</h3>
    ${result.stars != null ? `<p class="results__stars" aria-label="${result.stars} de 3 estrellas">${[1, 2, 3].map(i => `<span class="${i <= result.stars ? 'on' : ''}">★</span>`).join('')}</p>` : ''}
    <p class="results__score"><span data-count>0</span><small>puntos</small></p>
    ${result.summary ? `<p class="results__summary">${esc(result.summary)}</p>` : ''}
    <ul class="results__facts">
      <li><small>Tu récord</small><b>${fmt(Math.max(info.prevBest, result.score))}</b></li>
      <li><small>Puntos Bongi</small><b>+${fmt(xp + unlocked.length * 25)}</b></li>
      <li><small>Nivel</small><b>${info.level.level}</b></li>
    </ul>
    ${info.levelUp ? `<p class="results__note">¡Subiste a nivel ${info.level.level}: ${esc(info.level.name)}!</p>` : ''}
    ${dailyDone ? '<p class="results__note">¡Cumpliste el desafío de hoy! +50 Puntos Bongi.</p>' : ''}
    ${unlocked.length ? `<div class="results__badges"><p>Logros desbloqueados</p><ul>${unlocked.map(a => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/brand/iconos.svg#trophy"/></svg>${esc(a.name)}</li>`).join('')}</ul></div>` : ''}
    <div class="row results__actions">
      <button class="btn btn--banana" type="button" data-again>${esc(result.againLabel || 'Jugar de nuevo')}</button>
      <button class="btn btn--light" type="button" data-other>Salir al menú</button>
      <button class="btn btn--light" type="button" data-share>Compartir</button>
    </div>
    <p class="results__cta">¿Antojo? <a href="/golosinas">Mirá las golosinas de verdad</a> en Bongi Bombón, Río Segundo.</p>
  </div>`;
  const counter = $('[data-count]', body);
  const target = result.score;
  if (reduceMotion || target === 0) counter.textContent = fmt(target);
  else {
    const t0 = performance.now(), dur = Math.min(1600, 400 + target / 2);
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      counter.textContent = fmt(target * e);
      if (p < 1 && counter.isConnected) requestAnimationFrame(tick);
    })(t0);
  }
  if (record) { sfx.record(); confetti({ count: 180 }); }
  else if (won) { sfx.win(); if (result.stars === 3) confetti({ count: 90 }); } else sfx.gameover();
  unlocked.forEach((a, i) => setTimeout(() => { sfx.achievement(); toast(`<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/brand/iconos.svg#trophy"/></svg><span><b>Logro desbloqueado</b>${esc(a.name)}</span>`); }, 900 + i * 700));
  $('[data-again]', body).focus();
  $('[data-again]', body).addEventListener('click', () => startGame(game, impl, { again: true }));
  $('[data-other]', body).addEventListener('click', closeStage);
  $('[data-share]', body).addEventListener('click', async () => {
    const text = `¡Hice ${fmt(result.score)} puntos en ${game.title} de Bongi Arcade! ¿Me superás?`;
    const url = `https://bongibombon.com.ar/juegos#${game.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Bongi Arcade', text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); toast('<span><b>¡Copiado!</b>Pegalo donde quieras.</span>'); }
    } catch { /* cancelado */ }
  });
}

function closeStage() {
  teardown();
  body.innerHTML = '';
  if (stage.open) stage.close();
}
stage.addEventListener('close', () => {
  teardown(); body.innerHTML = '';
  document.documentElement.classList.remove('is-playing');
  paintProfile();
  lastTrigger?.focus();
});
// Esc pausa el juego en lugar de cerrarlo de golpe
stage.addEventListener('cancel', e => {
  if (active?.instance && (active.instance.togglePause || active.instance.pause)) {
    e.preventDefault();
    togglePause();
  }
});
function togglePause() {
  const inst = active?.instance; if (!inst) return;
  if (inst.togglePause) inst.togglePause();
  else if (inst.paused) { inst.resume?.(); inst.paused = false; } else { inst.pause?.(); inst.paused = true; }
}
$('[data-close]').addEventListener('click', closeStage);
$('[data-pause]').addEventListener('click', () => { sfx.click(); togglePause(); });
$('[data-restart]').addEventListener('click', () => { if (active) { sfx.click(); startGame(active.game, active.impl, { again: true }); } });

document.addEventListener('visibilitychange', () => {
  if (!active) return;
  if (document.hidden) { active.instance?.pause?.(); music.stop(); }
  else { if (!active.instance?.togglePause) active.instance?.resume?.(); music.sync(); }
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-play]');
  if (b) { lastTrigger = b; openGame(b.dataset.play); }
});

/* ---------- Filtros del hub ---------- */
$$('[data-arcade-filter]').forEach(btn => btn.addEventListener('click', () => {
  const f = btn.dataset.arcadeFilter;
  $$('[data-arcade-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  let shown = 0;
  $$('.acard').forEach(c => { c.hidden = !(f === 'todo' || c.dataset.tags.split(' ').includes(f) || (f === 'fav' && c.classList.contains('is-fav'))); if (!c.hidden) shown++; });
  $('[data-arcade-empty]').hidden = shown > 0;
  sfx.tick();
}));

/* ---------- Inicio ---------- */
paintSound();
paintProfile();
const hash = location.hash.slice(1);
if (byId(hash)) document.getElementById(hash)?.classList.add('is-highlight');
