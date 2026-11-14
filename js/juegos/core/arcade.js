// Motor de Bongi Arcade. Lo comparten todos los juegos arcade:
// - Resolución lógica fija escalada al contenedor (sin deformar) y DPR ≤ 2.
// - Lazo con paso fijo de 1/60 s (física estable en cualquier pantalla).
// - Entrada unificada: teclado + controles táctiles en pantalla + puntero.
// - Partículas, textos flotantes, sacudón de cámara (opcional), carteles y menú de pausa.
import { store } from './storage.js';

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'a', KeyZ: 'a', KeyK: 'a', Enter: 'a',
  KeyX: 'b', KeyJ: 'b', ShiftLeft: 'b', ShiftRight: 'b', KeyC: 'c', KeyL: 'c',
  KeyP: 'pause'
};
const ICONS = { left: '◀', right: '▶', up: '▲', down: '▼' };
export const FONT = '"Fredoka", "Trebuchet MS", system-ui, sans-serif';

export function arcade(root, ctx, opts) {
  const { width: LW, height: LH, controls = {}, update, draw, onPointer, onPause } = opts;
  const reduce = ctx.reduceMotion;

  root.classList.add('arcade-game');
  root.innerHTML = `<div class="arc-screen"><canvas role="img" aria-label="${opts.label || 'Pantalla de juego'}"></canvas></div><div class="arc-pad" aria-hidden="true"></div>`;
  const screen = root.querySelector('.arc-screen');
  const canvas = root.querySelector('canvas');
  const pad = root.querySelector('.arc-pad');
  const g = canvas.getContext('2d');

  /* ---------- Escalado ---------- */
  let scale = 1, dpr = 1;
  function fit() {
    const r = screen.getBoundingClientRect();
    if (!r.width || !r.height) return;
    scale = Math.min(r.width / LW, r.height / LH);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = `${LW * scale}px`; canvas.style.height = `${LH * scale}px`;
    canvas.width = Math.round(LW * scale * dpr); canvas.height = Math.round(LH * scale * dpr);
    g.imageSmoothingEnabled = true;
    if (ready) render();
  }
  let ready = false;
  const ro = new ResizeObserver(fit); ro.observe(screen);

  /* ---------- Entrada ---------- */
  const down = new Set(), hits = new Set();
  const press = n => { if (!down.has(n)) hits.add(n); down.add(n); };
  const release = n => down.delete(n);
  const kd = e => {
    const n = KEYMAP[e.code]; if (!n) return;
    if (e.target.closest?.('input, textarea, select')) return;
    e.preventDefault();
    if (n === 'pause') { if (!e.repeat) api.togglePause(); return; }
    if (!e.repeat) press(n);
  };
  const ku = e => { const n = KEYMAP[e.code]; if (n) release(n); };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  const blur = () => down.clear();
  addEventListener('blur', blur);

  // Controles táctiles: { dirs: ['left','right'] | 'all', buttons: [{ id:'a', label:'Saltar' }] }
  const dirs = controls.dirs === 'all' ? ['up', 'left', 'right', 'down'] : (controls.dirs || []);
  pad.innerHTML = `<div class="arc-pad__dirs arc-pad__dirs--${dirs.length}">${dirs.map(d => `<button type="button" class="arc-btn arc-btn--${d}" data-k="${d}">${ICONS[d]}</button>`).join('')}</div>
    <div class="arc-pad__acts">${(controls.buttons || []).map(b => `<button type="button" class="arc-btn arc-btn--act" data-k="${b.id}">${b.label}</button>`).join('')}</div>`;
  if (!dirs.length && !(controls.buttons || []).length) pad.remove();
  pad.querySelectorAll('[data-k]').forEach(btn => {
    const k = btn.dataset.k;
    const on = e => { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch { /* sin captura */ } btn.classList.add('is-down'); press(k); };
    const off = () => { btn.classList.remove('is-down'); release(k); };
    btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off); btn.addEventListener('lostpointercapture', off);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  const toLogical = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; };
  if (onPointer) {
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      canvas.addEventListener(type, e => {
        if (type === 'pointerdown') { try { canvas.setPointerCapture(e.pointerId); } catch { /* sin captura */ } e.preventDefault(); }
        if (paused || over) return;
        const p = toLogical(e); onPointer(type.replace('pointer', ''), p.x, p.y, e);
      });
    }
  }

  /* ---------- Partículas y textos ---------- */
  const parts = [], texts = [];
  const fx = {
    burst(x, y, { n = 14, colors = ['#ffd166', '#ef476f', '#06d6a0', '#fff'], speed = 120, life = .7, size = 3, gravity = 260, shape = 'dot' } = {}) {
      if (reduce) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (.35 + Math.random() * .8);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * .3, life, max: life, size: size * (.6 + Math.random() * .8), color: colors[(Math.random() * colors.length) | 0], gravity, shape, rot: Math.random() * 6 });
      }
    },
    text(x, y, str, color = '#ffd166', size = 12) { texts.push({ x, y, str, color, size, life: .9 }); },
    shake(amount = 4, time = .25) { if (reduce || !store.setting('shake')) return; shakeT = Math.max(shakeT, time); shakeA = Math.max(shakeA, amount); }
  };
  let shakeT = 0, shakeA = 0;

  /* ---------- Carteles ---------- */
  let banner = null;
  const showBanner = (title, sub = '', secs = 1.6) => { banner = { title, sub, t: secs, max: secs }; };

  /* ---------- Lazo ---------- */
  const STEP = 1 / 60;
  let raf = 0, last = 0, acc = 0, running = false, paused = false, over = false, dead = false, time = 0;
  function frame(t) {
    if (!running) return;
    acc += Math.min(.1, (t - last) / 1000 || 0); last = t;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      time += STEP;
      update(STEP, api);
      hits.clear();
      stepFx(STEP);
      acc -= STEP; steps++;
      if (!running) break;
    }
    render();
    if (running) raf = requestAnimationFrame(frame);
  }
  function stepFx(dt) {
    for (const p of parts) { p.life -= dt; p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 6; }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    for (const t of texts) { t.life -= dt; t.y -= 28 * dt; }
    for (let i = texts.length - 1; i >= 0; i--) if (texts[i].life <= 0) texts.splice(i, 1);
    if (shakeT > 0) { shakeT -= dt; if (shakeT <= 0) shakeA = 0; }
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  }
  function render() {
    if (dead) return;
    g.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    g.save();
    if (shakeA) g.translate((Math.random() - .5) * shakeA * 2, (Math.random() - .5) * shakeA * 2);
    draw(g, api);
    for (const p of parts) {
      g.globalAlpha = Math.max(0, p.life / p.max); g.fillStyle = p.color;
      if (p.shape === 'square') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); g.restore(); }
      else { g.beginPath(); g.ellipse(p.x, p.y, p.size, p.size * .8, 0, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const t of texts) {
      g.globalAlpha = Math.min(1, t.life * 2); g.font = `700 ${t.size}px ${FONT}`;
      g.lineWidth = 3; g.strokeStyle = 'rgba(59,31,43,.85)'; g.strokeText(t.str, t.x, t.y); g.fillStyle = t.color; g.fillText(t.str, t.x, t.y);
    }
    g.globalAlpha = 1;
    g.restore();
    if (banner) {
      const k = Math.min(1, (banner.max - banner.t) * 5, banner.t * 4);
      g.globalAlpha = Math.max(0, k);
      g.fillStyle = 'rgba(59,31,43,.78)'; g.fillRect(0, LH / 2 - 34, LW, 68);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const fitFont = (txt, size, weight) => { g.font = `${weight} ${size}px ${FONT}`; const w = g.measureText(txt).width; if (w > LW - 24) g.font = `${weight} ${Math.floor(size * (LW - 24) / w)}px ${FONT}`; };
      fitFont(banner.title, Math.min(30, LW / 12), 700); g.fillStyle = '#ffd166'; g.fillText(banner.title, LW / 2, LH / 2 - (banner.sub ? 9 : 0));
      if (banner.sub) { fitFont(banner.sub, Math.min(14, LW / 26), 600); g.fillStyle = '#fff'; g.fillText(banner.sub, LW / 2, LH / 2 + 18); }
      g.globalAlpha = 1;
    }
  }

  /* ---------- Pausa ---------- */
  let pauseEl = null;
  function showPause() {
    pauseEl = document.createElement('div');
    pauseEl.className = 'arc-pause'; pauseEl.setAttribute('role', 'dialog'); pauseEl.setAttribute('aria-label', 'Pausa');
    pauseEl.innerHTML = `<div class="arc-pause__box"><h3>Pausa</h3>
      ${opts.help ? `<ul class="arc-pause__help">${opts.help.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}
      <div class="arc-pause__btns"><button type="button" class="btn btn--banana" data-p="go">Continuar</button>
      <button type="button" class="btn btn--light" data-p="restart">Reiniciar</button>
      <button type="button" class="btn btn--light" data-p="exit">Salir al menú</button></div></div>`;
    pauseEl.addEventListener('click', e => {
      const a = e.target.closest('[data-p]')?.dataset.p;
      if (a === 'go') api.resume(); else if (a === 'restart') ctx.restart(); else if (a === 'exit') ctx.exit();
    });
    root.append(pauseEl);
    pauseEl.querySelector('button').focus();
  }

  const api = {
    W: LW, H: LH, g, fx, canvas,
    get time() { return time; },
    down: n => down.has(n),
    hit: n => hits.has(n),
    banner: showBanner,
    start() { if (running || dead) return; running = true; last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); },
    pause() {
      if (paused || over || dead) return;
      paused = true; running = false; cancelAnimationFrame(raf); down.clear(); onPause?.(true); showPause();
    },
    resume() {
      if (!paused || dead) return;
      paused = false; pauseEl?.remove(); pauseEl = null; onPause?.(false); api.start();
    },
    togglePause() { if (paused) api.resume(); else api.pause(); },
    get paused() { return paused; },
    end(result) {
      if (over) return; over = true; running = false; cancelAnimationFrame(raf);
      setTimeout(() => !dead && ctx.end(result), 650);
    },
    destroy() {
      dead = true; running = false; cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('blur', blur);
    },
    render
  };
  fit();
  requestAnimationFrame(() => { ready = true; if (!dead) render(); });
  return api;
}

/* ---------- Utilidades de dibujo compartidas ---------- */
export function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** Bongi, la mascota: un bombón con ojos, cachetes y patitas. Lo usan varios juegos. */
export function drawBongi(g, x, y, s, { t = 0, dir = 1, walk = 0, mood = 'ok', blink = false, squash = 1 } = {}) {
  g.save(); g.translate(x, y); g.scale(dir * s / 16, s / 16 / squash);
  // patitas
  const k = Math.sin(walk) * 4;
  g.strokeStyle = '#3b1f2b'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-5, 10); g.lineTo(-6 - k, 17); g.moveTo(5, 10); g.lineTo(6 + k, 17); g.stroke();
  // cuerpo
  g.fillStyle = '#5b2d1f'; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill();
  g.fillStyle = '#7a3e2b'; g.beginPath(); g.arc(-3, -3, 9, 0, 7); g.fill();
  g.fillStyle = '#ef476f'; g.beginPath(); g.moveTo(-13, 3); g.quadraticCurveTo(0, 16, 13, 3); g.lineTo(13, 6); g.quadraticCurveTo(0, 19, -13, 6); g.fill();
  // brillo y cereza
  g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-6, -7, 4, 2, -.5, 0, 7); g.fill();
  g.fillStyle = '#ffd166'; g.beginPath(); g.arc(1, -14, 3, 0, 7); g.fill();
  // cara
  g.fillStyle = '#fff';
  if (blink || mood === 'hurt') { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(1, -2); g.lineTo(6, -2); g.moveTo(-7, -2); g.lineTo(-2, -2); g.stroke(); }
  else { g.beginPath(); g.arc(4, -2, 3.4, 0, 7); g.arc(-4, -2, 3.4, 0, 7); g.fill(); g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(5, -2, 1.7, 0, 7); g.arc(-3, -2, 1.7, 0, 7); g.fill(); }
  g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath();
  if (mood === 'happy') g.arc(1, 3, 4, .15 * Math.PI, .85 * Math.PI); else if (mood === 'hurt') g.arc(1, 7, 3, 1.15 * Math.PI, 1.85 * Math.PI); else { g.moveTo(-1, 5); g.lineTo(4, 5); }
  g.stroke();
  g.fillStyle = 'rgba(255,143,177,.6)'; g.beginPath(); g.arc(9, 2, 2.2, 0, 7); g.arc(-8, 2, 2.2, 0, 7); g.fill();
  g.restore();
}
