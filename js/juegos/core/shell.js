// Plataforma Bongi Juegos: perfil, sonido, desafío diario, logros, récords
// y el "escenario" (dialog) donde se monta cada juego bajo demanda.
import { store, today, levelInfo, recordResult, markPlayed, validateNick, touchStreak } from './storage.js';
import { sfx, music, setSound, setVolume, setMusic, unlock } from './audio.js';
import { confetti, floatText, shake } from './fx.js';
import { GAMES, byId, dailyFor, ACHIEVEMENTS } from './registry.js';
import { candySVG } from '../../candies.js';
import { track } from '../../analytics.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = n => Math.round(n).toLocaleString('es-AR');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const stage = $('[data-stage]');
const body = $('[data-stage-body]');
const hudEl = $('[data-hud]');
let active = null; // { game, instance, startedAt }

/* ---------- Ilustraciones ---------- */
$$('[data-icon]').forEach(el => (el.innerHTML = candySVG(el.dataset.icon)));
$('[data-avatar]').innerHTML = candySVG('bombon');

/* ---------- Perfil ---------- */
function paintProfile() {
  const s = store.get(), lv = levelInfo();
  $('[data-nick]').textContent = s.nick || 'Jugador sin apodo';
  $('[data-edit-nick]').textContent = s.nick ? 'Cambiar' : 'Elegir apodo';
  $('[data-level]').textContent = lv.level;
  $('[data-level-name]').textContent = lv.name;
  const bar = $('[data-xpbar]');
  bar.setAttribute('aria-valuenow', String(Math.round(lv.pct * 100)));
  bar.setAttribute('aria-valuetext', `${fmt(lv.into)} de ${fmt(lv.need)} puntos de experiencia`);
  bar.firstElementChild.style.width = `${lv.pct * 100}%`;
  const st = s.streak.last === today() || s.streak.count === 0 ? s.streak.count : s.streak.count;
  $('[data-streak]').textContent = `${st} ${st === 1 ? 'día' : 'días'}`;
  $('[data-played]').textContent = fmt(s.stats.finished);
  $('[data-ach-count]').textContent = `${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length}`;
  for (const g of GAMES) {
    const best = s.games[g.id]?.best || 0;
    const el = $(`[data-best="${g.id}"]`);
    if (el) el.textContent = best ? `Tu récord: ${fmt(best)} pts` : 'Sin récord todavía';
  }
  paintDaily(); paintBadges(); paintRecords();
}

function paintDaily() {
  const d = dailyFor(today()), done = store.get().daily.date === today() && store.get().daily.done;
  $('[data-daily-text]').textContent = done
    ? `¡Cumplido! Volvé mañana para un desafío nuevo.`
    : `Hacé ${fmt(d.target)} puntos en ${d.game.title}. Premio: 50 puntos de experiencia extra.`;
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
  const blocks = GAMES.map(g => {
    const top = s.games[g.id]?.top || [];
    return `<div class="rec"><h3>${esc(g.title)}</h3>${top.length
      ? `<ol>${top.map(t => `<li><span>${esc(t.nick)}</span><b>${fmt(t.score)}</b><small>${esc(t.date.split('-').reverse().join('/'))}</small></li>`).join('')}</ol>`
      : '<p class="muted">Todavía no jugaste. ¡Estrenalo!</p>'}</div>`;
  });
  $('[data-records]').innerHTML = blocks.join('') +
    `<p class="rec__stats">Partidas empezadas: <b>${fmt(s.stats.played)}</b> · terminadas: <b>${fmt(s.stats.finished)}</b> · tiempo jugado: <b>${Math.round(s.stats.ms / 60000)} min</b></p>`;
}

/* ---------- Sonido ---------- */
function paintSound() {
  const on = store.setting('sound');
  $$('[data-sound-toggle]').forEach(b => {
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('use').setAttribute('href', `/assets/brand/iconos.svg#${on ? 'sound-on' : 'sound-off'}`);
    b.querySelector('span').textContent = on ? 'Sonido activado' : 'Sonido desactivado';
  });
  $('[data-volume]').value = store.setting('volume');
  $('[data-music]').checked = store.setting('music');
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-sound-toggle]')) { setSound(!store.setting('sound')); paintSound(); sfx.click(); }
}, true);
$('[data-volume]').addEventListener('input', e => setVolume(Number(e.target.value)));
$('[data-volume]').addEventListener('change', () => sfx.pick());
$('[data-music]').addEventListener('change', e => { unlock(); setMusic(e.target.checked); });
document.addEventListener('pointerdown', unlock, { once: true });
document.addEventListener('keydown', unlock, { once: true });

/* ---------- Apodo ---------- */
const nickDialog = $('[data-nick-dialog]');
const nickForm = $('[data-nick-form]');
$('[data-edit-nick]').addEventListener('click', () => { nickForm.nick.value = store.get().nick; $('#nick-err').textContent = ''; nickDialog.showModal(); });
nickForm.addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  const v = validateNick(nickForm.nick.value);
  if (!v.ok) { e.preventDefault(); $('#nick-err').textContent = v.msg; nickForm.nick.focus(); return; }
  store.get().nick = v.nick; store.save(); paintProfile(); sfx.point();
});

/* ---------- Borrar progreso ---------- */
$('[data-reset]').addEventListener('click', () => {
  if (confirm('¿Borrar apodo, récords y logros de este dispositivo? No se puede deshacer.')) { store.reset(); paintSound(); paintProfile(); }
});

/* ---------- Toasts de logros ---------- */
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
async function openGame(id) {
  const game = byId(id); if (!game) return;
  unlock(); sfx.click();
  $('[data-stage-title]').textContent = game.title;
  hud({});
  body.innerHTML = `<div class="intro">
      <div class="intro__icon" aria-hidden="true">${candySVG(game.icon)}</div>
      <h3>Cómo se juega</h3>
      <ul>${game.how.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
      <button class="btn btn--banana" type="button" data-start>¡A jugar!</button>
    </div>`;
  if (!stage.open) stage.showModal();
  document.documentElement.classList.add('is-playing');
  const modP = game.load();
  $('[data-start]', body).focus();
  $('[data-start]', body).addEventListener('click', async () => {
    const mod = await modP;
    startGame(game, mod.default);
  }, { once: true });
}

function startGame(game, impl) {
  body.innerHTML = '';
  const root = document.createElement('div');
  root.className = `game game--${game.id}`;
  body.append(root);
  markPlayed(game.id);
  track('game_start', { label: game.id });
  music.sync();
  const ctx = {
    sfx, hud, reduceMotion, confetti, shake,
    float: (x, y, text, color) => floatText(root, x, y, text, color),
    best: store.game(game.id).best,
    extra: store.game(game.id).extra,
    end: result => finish(game, result)
  };
  active = { game, startedAt: performance.now(), instance: impl.mount(root, ctx) };
}

function finish(game, result) {
  if (!active || active.game !== game) return;
  const ms = performance.now() - active.startedAt;
  active.instance?.destroy?.();
  active = null;
  music.stop();
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
    if (!c.state.achievements[a.id] && a.test(c)) { c.state.achievements[a.id] = today(); unlocked.push(a); }
  }
  store.save();
  track('game_end', { label: game.id, score: result.score, record: info.isRecord });
  if (info.isRecord && info.prevBest > 0) track('game_record', { label: game.id, score: result.score });
  unlocked.forEach(a => track('achievement_unlock', { label: a.id }));

  showResults(game, result, info, xp, unlocked, dailyDone);
  paintProfile();
}

function showResults(game, result, info, xp, unlocked, dailyDone) {
  const record = info.isRecord && result.score > 0;
  const headline = record ? (info.prevBest ? '¡Nuevo récord!' : '¡Primer récord!') : result.title || '¡Partida terminada!';
  body.innerHTML = `<div class="results${record ? ' is-record' : ''}">
    ${record ? '<p class="results__ribbon">Récord</p>' : ''}
    <h3>${esc(headline)}</h3>
    <p class="results__score"><span data-count>0</span><small>puntos</small></p>
    ${result.summary ? `<p class="results__summary">${esc(result.summary)}</p>` : ''}
    <ul class="results__facts">
      <li><small>Tu récord</small><b>${fmt(Math.max(info.prevBest, result.score))}</b></li>
      <li><small>Experiencia</small><b>+${fmt(xp)}</b></li>
      <li><small>Nivel</small><b>${info.level.level}</b></li>
    </ul>
    ${info.levelUp ? `<p class="results__note">¡Subiste a nivel ${info.level.level}: ${esc(info.level.name)}!</p>` : ''}
    ${dailyDone ? '<p class="results__note">¡Cumpliste el desafío de hoy! +50 de experiencia.</p>' : ''}
    ${unlocked.length ? `<div class="results__badges"><p>Logros desbloqueados</p><ul>${unlocked.map(a => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/brand/iconos.svg#trophy"/></svg>${esc(a.name)}</li>`).join('')}</ul></div>` : ''}
    <div class="row results__actions">
      <button class="btn btn--banana" type="button" data-again>Jugar de nuevo</button>
      <button class="btn btn--light" type="button" data-other>Elegir otro juego</button>
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
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if (record) { sfx.record(); confetti({ count: 180 }); }
  else if (result.won !== false) sfx.win(); else sfx.lose();
  unlocked.forEach((a, i) => setTimeout(() => { sfx.achievement(); toast(`<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/brand/iconos.svg#trophy"/></svg><span><b>Logro desbloqueado</b>${esc(a.name)}</span>`); }, 900 + i * 700));
  $('[data-again]', body).focus();
  $('[data-again]', body).addEventListener('click', () => openGame(game.id));
  $('[data-other]', body).addEventListener('click', closeStage);
  $('[data-share]', body).addEventListener('click', async () => {
    const text = `¡Hice ${fmt(result.score)} puntos en ${game.title} de Bongi Juegos! ¿Me superás?`;
    const url = `https://bongibombon.com.ar/juegos#${game.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Bongi Juegos', text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); toast('<span><b>¡Copiado!</b>Pegalo donde quieras.</span>'); }
    } catch { /* cancelado */ }
  });
}

function closeStage() {
  active?.instance?.destroy?.();
  active = null;
  music.stop();
  body.innerHTML = '';
  if (stage.open) stage.close();
}
stage.addEventListener('close', () => {
  active?.instance?.destroy?.(); active = null; music.stop(); body.innerHTML = '';
  document.documentElement.classList.remove('is-playing');
  lastTrigger?.focus();
});
$('[data-close]').addEventListener('click', closeStage);

document.addEventListener('visibilitychange', () => {
  if (!active) return;
  if (document.hidden) { active.instance?.pause?.(); music.stop(); }
  else { active.instance?.resume?.(); music.sync(); }
});

let lastTrigger = null;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-play]');
  if (b) { lastTrigger = b; openGame(b.dataset.play); }
});

/* ---------- Inicio ---------- */
paintSound();
paintProfile();
const hash = location.hash.slice(1);
if (byId(hash)) document.getElementById(hash)?.classList.add('is-highlight');
