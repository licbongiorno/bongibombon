// Efectos visuales reutilizables: confeti de golosinas y textos flotantes.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#ff6b35', '#ff8fb1', '#7ae0ff', '#fff'];

export function confetti({ count = 140, origin } = {}) {
  if (reduce()) return;
  const c = document.createElement('canvas');
  c.className = 'fx-confetti'; c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const ox = origin?.x ?? W / 2, oy = origin?.y ?? H * 0.35;
  const parts = Array.from({ length: count }, () => ({
    x: ox, y: oy, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 4,
    r: 4 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
    color: COLORS[(Math.random() * COLORS.length) | 0], shape: Math.random() < .5 ? 0 : 1
  }));
  const t0 = performance.now();
  (function frame(t) {
    g.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += .42; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.color;
      if (p.shape) { g.beginPath(); g.ellipse(0, 0, p.r, p.r * .75, 0, 0, 7); g.fill(); }
      else g.fillRect(-p.r, -p.r / 3, p.r * 2, p.r / 1.5);
      g.restore();
    }
    if (t - t0 < 3200) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

/** Texto flotante (“+10”) sobre un elemento contenedor con position: relative. */
export function floatText(container, x, y, text, color = '#ffd166') {
  const el = document.createElement('span');
  el.className = 'fx-float'; el.textContent = text; el.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
  el.setAttribute('aria-hidden', 'true');
  container.append(el);
  setTimeout(() => el.remove(), 900);
}

export function shake(el) {
  if (reduce() || !el.animate) return;
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 320 });
}
