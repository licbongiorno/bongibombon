// Utilidad para juegos en canvas: crea el lienzo, ajusta resolución (DPR ≤ 2),
// corre el bucle con delta de tiempo y permite pausar, reanudar y destruir.
export function canvasGame(root, { update, draw, onResize }) {
  const wrap = document.createElement('div');
  wrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  wrap.append(canvas);
  root.append(wrap);
  const g = canvas.getContext('2d');
  let W = 0, H = 0, raf = 0, last = 0, running = false, dead = false;
  let pauseEl = null;

  const resize = () => {
    const r = wrap.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize?.(W, H);
    if (!running) draw(g, W, H);
  };
  const ro = new ResizeObserver(resize); ro.observe(wrap);

  const frame = t => {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    update(dt, W, H);
    if (dead) return;
    draw(g, W, H);
    raf = requestAnimationFrame(frame);
  };
  const api = {
    wrap, canvas, g,
    size: () => ({ W, H }),
    start() { if (running || dead) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); pauseEl?.remove(); pauseEl = null; },
    pause(showNote = true) {
      if (!running) return; running = false; cancelAnimationFrame(raf);
      if (showNote && !pauseEl) { pauseEl = document.createElement('button'); pauseEl.type = 'button'; pauseEl.className = 'pause-note'; pauseEl.textContent = 'Pausa · tocá para seguir'; pauseEl.onclick = () => api.start(); wrap.append(pauseEl); }
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    destroy() { dead = true; running = false; cancelAnimationFrame(raf); ro.disconnect(); }
  };
  resize();
  return api;
}
