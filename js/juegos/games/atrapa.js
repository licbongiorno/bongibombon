// Atrapa Golosinas: mover la bolsa, atrapar lo dulce, esquivar lo que no.
import { canvasGame } from '../core/loop.js';
import { candyImage, preload, SWEET_IDS } from '../../candies.js';

const BAD = ['brocoli', 'aji', 'piedra'];
const DURATION = 60;

export default {
  mount(root, ctx) {
    const s = {
      time: DURATION, elapsed: 0, score: 0, combo: 0, bestCombo: 0, caught: 0,
      items: [], spawnIn: 0.4, mood: 0, moodT: 0, over: false,
      bag: { x: 0, tx: 0, w: 96, h: 86, vx: 0 }, keys: { l: false, r: false }
    };
    let ready = false;

    function spawn(W) {
      const r = Math.random();
      const type = r < 0.035 ? 'reloj' : r < 0.075 ? 'estrella' : r < 0.075 + Math.min(0.26, 0.12 + s.elapsed / 400) ? BAD[(Math.random() * BAD.length) | 0] : SWEET_IDS[(Math.random() * SWEET_IDS.length) | 0];
      const size = Math.max(40, Math.min(64, W / 9));
      s.items.push({ type, x: size / 2 + Math.random() * (W - size), y: -size, size, rot: Math.random() * 6, vr: (Math.random() - .5) * 3, vy: 0, wob: Math.random() * 6 });
    }

    function hudUpdate() {
      ctx.hud({ Puntos: s.score, Tiempo: `${Math.ceil(s.time)} s`, Combo: s.combo >= 5 ? `x${mult()}` : s.combo });
    }
    const mult = () => (s.combo >= 15 ? 3 : s.combo >= 5 ? 2 : 1);

    function catchItem(it, W, H) {
      const px = it.x, py = H - s.bag.h - 20;
      if (it.type === 'reloj') { s.time += 5; ctx.sfx.point(); ctx.float(px, py, '+5 s', '#06d6a0'); }
      else if (it.type === 'estrella') { s.combo++; s.score += 50 * mult(); ctx.sfx.combo(4); ctx.float(px, py, `+${50 * mult()}`, '#ffd166'); s.mood = 1; s.moodT = .6; }
      else if (BAD.includes(it.type)) {
        s.score = Math.max(0, s.score - 20); s.combo = 0; ctx.sfx.bonk(); ctx.float(px, py, '−20', '#ff8fa8'); s.mood = -1; s.moodT = .8;
        ctx.shake(api.wrap); navigator.vibrate?.(60);
      } else {
        s.combo++; s.caught++; const p = 10 * mult(); s.score += p;
        ctx.sfx.pick(Math.min(s.combo, 12)); ctx.float(px, py, `+${p}`); s.mood = 1; s.moodT = .35;
        if (s.combo === 5 || s.combo === 15) ctx.sfx.combo(s.combo / 3);
      }
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      hudUpdate();
    }

    function update(dt, W, H) {
      if (!ready || s.over) return;
      s.elapsed += dt; s.time -= dt;
      const prevSec = Math.ceil(s.time + dt);
      if (Math.ceil(s.time) !== prevSec) { hudUpdate(); if (s.time <= 5 && s.time > 0) ctx.sfx.tick(); }
      if (s.time <= 0) return finish();

      // Bolsa: sigue al dedo/cursor o a las flechas
      const b = s.bag;
      b.w = Math.max(84, Math.min(130, W / 4.2)); b.h = b.w * .88;
      if (s.keys.l || s.keys.r) b.tx = b.x + (s.keys.r - s.keys.l) * W * 1.25 * dt;
      b.tx = Math.max(b.w / 2, Math.min(W - b.w / 2, b.tx));
      const nx = b.x + (b.tx - b.x) * Math.min(1, dt * 18);
      b.vx = (nx - b.x) / Math.max(dt, .001); b.x = nx;
      if (s.moodT > 0) s.moodT -= dt; else s.mood = 0;

      // Aparición y caída: la dificultad sube con el tiempo
      const level = s.elapsed / DURATION;
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) { spawn(W); s.spawnIn = Math.max(0.26, 0.78 - level * 0.5) * (0.7 + Math.random() * 0.6); }
      const g = H * (0.42 + level * 0.55);
      const mouthY = H - b.h - 14, mouthL = b.x - b.w * .46, mouthR = b.x + b.w * .46;
      for (const it of s.items) {
        it.vy = g; it.y += it.vy * dt; it.rot += it.vr * dt; it.wob += dt * 3;
        it.x += Math.sin(it.wob) * 12 * dt;
        if (!it.done && it.y + it.size * .3 >= mouthY && it.y - it.size * .3 <= mouthY + b.h * .4 && it.x > mouthL && it.x < mouthR) {
          it.done = true; catchItem(it, W, H);
        }
        if (!it.done && it.y - it.size > H) {
          it.done = true;
          if (SWEET_IDS.includes(it.type) && s.combo) { s.combo = 0; hudUpdate(); }
        }
      }
      s.items = s.items.filter(i => !i.done);
    }

    function drawBag(g, W, H) {
      const b = s.bag, x = b.x, y = H - b.h - 10, w = b.w, h = b.h;
      g.save();
      g.translate(x, y + h / 2); g.rotate(Math.max(-.18, Math.min(.18, b.vx / 4000))); g.translate(-x, -(y + h / 2));
      // sombra
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y + h + 4, w * .5, 7, 0, 0, 7); g.fill();
      // cuerpo de la bolsa con rayas
      g.fillStyle = '#fff3f5';
      g.beginPath(); g.moveTo(x - w * .5, y + 6); g.lineTo(x + w * .5, y + 6); g.lineTo(x + w * .44, y + h); g.lineTo(x - w * .44, y + h); g.closePath(); g.fill();
      g.save(); g.clip();
      g.fillStyle = '#ef476f';
      for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(x - w / 2 + i * 22, y); g.lineTo(x - w / 2 + i * 22 + 11, y); g.lineTo(x - w / 2 + i * 22 + 11 + h * .4, y + h); g.lineTo(x - w / 2 + i * 22 + h * .4, y + h); g.fill(); }
      g.restore();
      // borde superior doblado
      g.fillStyle = '#ffd166'; g.fillRect(x - w * .52, y, w * 1.04, 14);
      // carita de Bongi
      const fy = y + h * .58;
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, fy, w * .3, h * .22, 0, 0, 7); g.fill();
      g.fillStyle = '#3b1f2b';
      if (s.mood < 0) { g.lineWidth = 3; g.strokeStyle = '#3b1f2b'; g.beginPath(); g.moveTo(x - 14, fy - 8); g.lineTo(x - 6, fy - 3); g.moveTo(x + 14, fy - 8); g.lineTo(x + 6, fy - 3); g.stroke(); }
      else { g.beginPath(); g.arc(x - 10, fy - 4, 3.5, 0, 7); g.arc(x + 10, fy - 4, 3.5, 0, 7); g.fill(); }
      g.lineWidth = 3; g.strokeStyle = '#3b1f2b'; g.lineCap = 'round'; g.beginPath();
      if (s.mood > 0) g.arc(x, fy + 2, 9, .15 * Math.PI, .85 * Math.PI); else if (s.mood < 0) g.arc(x, fy + 12, 7, 1.15 * Math.PI, 1.85 * Math.PI); else { g.moveTo(x - 6, fy + 7); g.lineTo(x + 6, fy + 7); }
      g.stroke();
      g.fillStyle = 'rgba(239,71,111,.35)'; g.beginPath(); g.arc(x - 20, fy + 4, 5, 0, 7); g.arc(x + 20, fy + 4, 5, 0, 7); g.fill();
      g.restore();
    }

    function draw(g, W, H) {
      // fondo: estantería de golosinería
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#5a2d3e'); grd.addColorStop(1, '#3b1f2b');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.04)';
      for (let y = 60; y < H; y += 120) g.fillRect(0, y, W, 10);
      for (const it of s.items) {
        const { img } = candyImage(it.type);
        g.save(); g.translate(it.x, it.y); g.rotate(BAD.includes(it.type) ? it.rot * .3 : it.rot);
        if (it.type === 'estrella') { g.shadowColor = '#ffd166'; g.shadowBlur = 18; }
        g.drawImage(img, -it.size / 2, -it.size / 2, it.size, it.size); g.restore();
      }
      if (s.bag.x === 0) s.bag.x = s.bag.tx = W / 2;
      drawBag(g, W, H);
      if (!ready) { g.fillStyle = '#fff'; g.font = '600 22px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('Preparando golosinas…', W / 2, H / 2); }
    }

    const api = canvasGame(root, { update, draw });
    api.canvas.setAttribute('aria-label', 'Área de juego de Atrapa Golosinas');
    const help = document.createElement('p'); help.className = 'touch-help'; help.textContent = 'Arrastrá para mover la bolsa · ← → en teclado';
    api.wrap.append(help); setTimeout(() => help.remove(), 4000);

    const toX = e => e.clientX - api.wrap.getBoundingClientRect().left;
    const onPointer = e => { s.bag.tx = toX(e); };
    api.wrap.addEventListener('pointerdown', e => { api.wrap.setPointerCapture?.(e.pointerId); onPointer(e); });
    api.wrap.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) onPointer(e); });
    const keyH = down => e => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { s.keys.l = down; e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { s.keys.r = down; e.preventDefault(); }
    };
    const kd = keyH(true), ku = keyH(false);
    addEventListener('keydown', kd); addEventListener('keyup', ku);

    function finish() {
      if (s.over) return; s.over = true; api.stop();
      ctx.end({ score: s.score, extra: { combo: s.bestCombo, caught: s.caught }, summary: `Atrapaste ${s.caught} golosinas. Mejor combo: ${s.bestCombo} seguidas.` });
    }

    preload([...SWEET_IDS, ...BAD, 'estrella', 'reloj']).then(() => { ready = true; hudUpdate(); api.start(); });

    return {
      pause: () => api.pause(), resume: () => {},
      destroy() { api.destroy(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); }
    };
  }
};
