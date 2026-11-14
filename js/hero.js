// Hero interactivo: una "lluvia" de confites y golosinas que el cursor o el dedo
// empuja, y que estalla en más confites con un toque.
// Rendimiento: canvas único, DPR ≤ 2, cantidad según superficie,
// pausa fuera de pantalla o con la pestaña oculta. Con movimiento reducido se dibuja un cuadro fijo.
import { candyImage, preload } from './candies.js';

const COLORS = ['#ffd166', '#06d6a0', '#ff6b35', '#ffffff', '#3b1f2b', '#ff8fb1', '#7ae0ff'];
const SPRITES = ['caramelo', 'chupetin', 'gomita', 'chocolate', 'alfajor', 'bombon', 'paleta', 'chicle'];

export async function startHero(canvas, { reduceMotion }) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, items = [], running = false, raf = 0, last = 0;
  const pointer = { x: -999, y: -999, active: false };
  // Zona del texto: ahí las golosinas se vuelven translúcidas para no restar contraste.
  let zone = { l: 0, t: 0, r: 0, b: 0 };
  await preload(SPRITES);

  const rand = (a, b) => a + Math.random() * (b - a);
  function make(x, y, burst = false) {
    const sprite = !burst && Math.random() < 0.22;
    return {
      x: x ?? rand(0, W), y: y ?? rand(-H, H),
      vx: burst ? rand(-5, 5) : rand(-.25, .25), vy: burst ? rand(-7, -2) : rand(.35, 1.1),
      r: sprite ? rand(26, 44) : rand(7, 13), rot: rand(0, Math.PI * 2), vr: rand(-.03, .03),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      sprite: sprite ? SPRITES[(Math.random() * SPRITES.length) | 0] : null,
      life: burst ? 240 : Infinity
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(Math.min(90, (W * H) / 9000));
    items = items.filter(i => i.life === Infinity).slice(0, target);
    while (items.length < target) items.push(make());
    const inner = canvas.parentElement.querySelector('.hero__inner');
    if (inner) {
      const cr = canvas.getBoundingClientRect();
      const kids = [...inner.children].map(k => k.getBoundingClientRect()).filter(r => r.width);
      zone = { l: Math.min(...kids.map(r => r.left)) - cr.left - 16, t: Math.min(...kids.map(r => r.top)) - cr.top - 16,
               r: Math.max(...kids.map(r => r.right)) - cr.left + 16, b: Math.max(...kids.map(r => r.bottom)) - cr.top + 16 };
    }
    if (reduceMotion) draw();
  }

  function drawItem(p) {
    ctx.save();
    const inZone = p.x > zone.l && p.x < zone.r && p.y > zone.t && p.y < zone.b;
    ctx.globalAlpha = inZone ? (p.sprite ? .22 : .45) : 1;
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.sprite) {
      const { img } = candyImage(p.sprite);
      ctx.drawImage(img, -p.r, -p.r, p.r * 2, p.r * 2);
    } else {
      // Confite: lenteja con brillo
      ctx.fillStyle = 'rgba(59,31,43,.18)';
      ctx.beginPath(); ctx.ellipse(1.5, 2.5, p.r, p.r * .78, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .78, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(-p.r * .35, -p.r * .3, p.r * .32, p.r * .16, -.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of items) drawItem(p);
  }

  function step(t) {
    const dt = Math.min(2.5, (t - last) / 16.67 || 1); last = t;
    for (const p of items) {
      if (pointer.active) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy, R = 130;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2), f = (1 - d / R) * 1.6;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f; p.vr += (dx > 0 ? .004 : -.004);
        }
      }
      if (p.life !== Infinity) { p.vy += .22 * dt; p.life -= dt; }
      else { p.vx *= .96; p.vy += (Math.max(.35, Math.min(p.vy, 1.1)) - p.vy) * .04; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.vr *= .995;
      if (p.life === Infinity) {
        if (p.y - p.r > H) { p.y = -p.r - rand(0, 80); p.x = rand(0, W); }
        if (p.x < -60) p.x = W + 50; else if (p.x > W + 60) p.x = -50;
      }
    }
    items = items.filter(p => p.life > 0 && p.y < H + 200);
    draw();
    raf = requestAnimationFrame(step);
  }

  const play = () => { if (!running && !reduceMotion) { running = true; last = performance.now(); raf = requestAnimationFrame(step); } };
  const pause = () => { running = false; cancelAnimationFrame(raf); };

  const hero = canvas.parentElement;
  const toLocal = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  hero.addEventListener('pointermove', e => { Object.assign(pointer, toLocal(e), { active: true }); }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.active = false; });
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button')) return;
    const { x, y } = toLocal(e);
    const n = reduceMotion ? 0 : 26;
    for (let i = 0; i < n; i++) items.push(make(x, y, true));
  });

  new ResizeObserver(resize).observe(canvas);
  resize();
  if (reduceMotion) { draw(); return; }
  new IntersectionObserver(([en]) => (en.isIntersecting ? play() : pause())).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
}
