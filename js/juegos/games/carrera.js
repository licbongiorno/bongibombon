// Carrera de Chocolates: corredor de 3 carriles. Juntá chocolates, esquivá obstáculos.
import { canvasGame } from '../core/loop.js';
import { candyImage, preload } from '../../candies.js';

const OBST = ['piedra', 'brocoli', 'aji'];
const LANES = 3;

export default {
  mount(root, ctx) {
    const s = { lane: 1, x: 0, lives: 3, inv: 0, meters: 0, chocs: 0, speed: 0, objs: [], gap: 0, offset: 0, over: false, t: 0 };
    let ready = false;
    const laneX = (W, l) => { const road = Math.min(W * .92, 520), left = (W - road) / 2; return left + road * (l + .5) / LANES; };
    const roadBounds = W => { const road = Math.min(W * .92, 520); return [(W - road) / 2, (W + road) / 2]; };

    const hud = () => ctx.hud({ Metros: Math.floor(s.meters), Chocolates: s.chocs, Vidas: '❤'.repeat(s.lives) || '—' });

    function spawnRow(W, H) {
      const size = Math.min(70, (Math.min(W * .92, 520) / LANES) * .62);
      const lanes = [0, 1, 2].sort(() => Math.random() - .5);
      const nObs = Math.random() < Math.min(.65, .25 + s.meters / 2500) ? 2 : 1; // siempre queda un carril libre
      lanes.slice(0, nObs).forEach(l => s.objs.push({ kind: 'obs', type: OBST[(Math.random() * 3) | 0], lane: l, y: -size, size }));
      if (Math.random() < .7) s.objs.push({ kind: 'choc', type: 'chocolate', lane: lanes[nObs], y: -size - (Math.random() < .5 ? 0 : size * 1.4), size: size * .9 });
    }

    function update(dt, W, H) {
      if (!ready || s.over) return;
      s.t += dt;
      s.speed = H * .5 * Math.min(2.4, 1 + s.meters / 700);
      s.meters += s.speed * dt / 45;
      s.offset = (s.offset + s.speed * dt) % 80;
      s.gap -= s.speed * dt;
      if (s.gap <= 0) { spawnRow(W, H); s.gap = H * (0.42 + Math.random() * .25) / Math.min(1.6, 1 + s.meters / 1500); }
      const tx = laneX(W, s.lane);
      s.x += (tx - s.x) * Math.min(1, dt * 16);
      if (s.inv > 0) s.inv -= dt;
      const py = H - 110, pr = Math.min(36, W / 12);
      for (const o of s.objs) {
        o.y += s.speed * dt;
        if (o.done) continue;
        const ox = laneX(W, o.lane);
        if (Math.abs(o.y - py) < (o.size / 2 + pr) * .72 && Math.abs(ox - s.x) < (o.size / 2 + pr) * .7) {
          o.done = true;
          if (o.kind === 'choc') { s.chocs++; ctx.sfx.pick(Math.min(s.chocs % 10, 10)); ctx.float(ox, py - 30, '+25'); }
          else if (s.inv <= 0) {
            s.lives--; s.inv = 1.2; ctx.sfx.bonk(); ctx.shake(api.wrap); navigator.vibrate?.(80);
            if (s.lives <= 0) { hud(); return finish(); }
          } else o.done = false;
          hud();
        }
      }
      s.objs = s.objs.filter(o => o.y < H + 100 && !(o.done && o.kind === 'choc'));
      if (Math.floor(s.meters) % 25 === 0) hud();
    }

    function draw(g, W, H) {
      g.fillStyle = '#3b1f2b'; g.fillRect(0, 0, W, H);
      const [L, R] = roadBounds(W);
      // camino de caramelo
      g.fillStyle = '#ffd9a8'; g.fillRect(L, 0, R - L, H);
      // bordes bastón de caramelo
      for (let y = -80 + s.offset; y < H; y += 40) {
        g.fillStyle = (Math.floor((y - s.offset) / 40) % 2) ? '#ef476f' : '#fff';
        g.fillRect(L - 14, y, 14, 40); g.fillRect(R, y, 14, 40);
      }
      // líneas de carril
      g.strokeStyle = 'rgba(122,62,43,.35)'; g.lineWidth = 4; g.setLineDash([26, 26]); g.lineDashOffset = -s.offset;
      for (let l = 1; l < LANES; l++) { const x = L + (R - L) * l / LANES; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      g.setLineDash([]);
      // chispas de chocolate decorativas a los costados
      g.fillStyle = 'rgba(255,255,255,.07)';
      for (let i = 0; i < 12; i++) { const y = (i * 97 + s.offset * 1.5) % H; g.beginPath(); g.arc(i % 2 ? L / 2 : (R + W) / 2, y, 6, 0, 7); g.fill(); }
      for (const o of s.objs) {
        if (o.done) continue;
        const { img } = candyImage(o.type);
        const x = laneX(W, o.lane);
        g.fillStyle = 'rgba(59,31,43,.2)'; g.beginPath(); g.ellipse(x, o.y + o.size * .42, o.size * .36, o.size * .1, 0, 0, 7); g.fill();
        g.drawImage(img, x - o.size / 2, o.y - o.size / 2, o.size, o.size);
      }
      // jugador: Bongi, el bombón corredor
      if (!s.x) s.x = laneX(W, s.lane);
      const py = H - 110, pr = Math.min(36, W / 12);
      if (!(s.inv > 0 && Math.floor(s.inv * 10) % 2)) {
        const step = Math.sin(s.t * 18) * 6;
        g.strokeStyle = '#3b1f2b'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(s.x - 10, py + pr * .7); g.lineTo(s.x - 12, py + pr + 8 + step);
        g.moveTo(s.x + 10, py + pr * .7); g.lineTo(s.x + 12, py + pr + 8 - step); g.stroke();
        const { img } = candyImage('bombon');
        g.drawImage(img, s.x - pr * 1.1, py - pr * 1.2, pr * 2.2, pr * 2.2);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x - 8, py - 2, 5, 0, 7); g.arc(s.x + 8, py - 2, 5, 0, 7); g.fill();
        g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(s.x - 7, py - 3, 2.4, 0, 7); g.arc(s.x + 9, py - 3, 2.4, 0, 7); g.fill();
      }
      if (!ready) { g.fillStyle = '#fff'; g.font = '600 22px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('¡En sus marcas…!', W / 2, H / 2); }
    }

    const api = canvasGame(root, { update, draw });
    api.canvas.setAttribute('aria-label', 'Pista de Carrera de Chocolates');
    const help = document.createElement('p'); help.className = 'touch-help'; help.textContent = 'Deslizá o tocá a los costados · ← → en teclado';
    api.wrap.append(help); setTimeout(() => help.remove(), 4000);

    const move = d => { const n = Math.max(0, Math.min(LANES - 1, s.lane + d)); if (n !== s.lane) { s.lane = n; ctx.sfx.flip(); } };
    let start = null;
    api.wrap.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    api.wrap.addEventListener('pointerup', e => {
      if (!start) return;
      const dx = e.clientX - start.x;
      if (Math.abs(dx) > 30) move(Math.sign(dx));
      else { const r = api.wrap.getBoundingClientRect(); move(e.clientX - r.left < s.x ? -1 : 1); }
      start = null;
    });
    const kd = e => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { move(-1); e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { move(1); e.preventDefault(); }
    };
    addEventListener('keydown', kd);

    function finish() {
      if (s.over) return; s.over = true; api.stop();
      const meters = Math.floor(s.meters);
      ctx.end({ score: meters + s.chocs * 25, extra: { meters, chocs: s.chocs }, summary: `Recorriste ${meters} m y juntaste ${s.chocs} chocolates.` });
    }

    preload([...OBST, 'chocolate', 'bombon']).then(() => { ready = true; hud(); api.start(); });
    return { pause: () => api.pause(), resume() {}, destroy() { api.destroy(); removeEventListener('keydown', kd); } };
  }
};
