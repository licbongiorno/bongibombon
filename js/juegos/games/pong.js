// BONGI PONG — Duelo de golosinas.
// Contra el Bongi Bot (3 dificultades), dos jugadores en el mismo dispositivo o modo desafío.
// Efecto según el movimiento de la barra, velocidad progresiva y tres escenarios.
import { arcade, FONT, roundRect } from '../core/arcade.js?v=cfab42284a';

const W = 400, H = 225, PW = 8, PH = 40, BR = 6, WIN = 7;
const ARENAS = [
  { name: 'Mesa de chocolate', bg: '#5b2d1f', table: '#7a3e2b', line: '#ffd9a8' },
  { name: 'Mundo de gomitas', bg: '#1f6b4a', table: '#2f8f5b', line: '#b8f2c8' },
  { name: 'Fábrica de golosinas', bg: '#3a3f63', table: '#4b4f72', line: '#ffd166' }
];
const DIFFS = { facil: { sp: 150, react: .22, err: 26, label: 'Fácil' }, media: { sp: 210, react: .14, err: 14, label: 'Media' }, dificil: { sp: 290, react: .07, err: 6, label: 'Difícil' } };
const MENU = [
  { id: 'facil', label: '1 jugador · Fácil', sub: 'Contra el Bongi Bot, tranqui' },
  { id: 'media', label: '1 jugador · Media', sub: 'El bot se pone serio' },
  { id: 'dificil', label: '1 jugador · Difícil', sub: 'Solo para campeones' },
  { id: '2p', label: '2 jugadores', sub: 'Mismo celular: cada uno en su mitad' },
  { id: 'desafio', label: 'Desafío', sub: '3 vidas: cada punto acelera el juego' }
];

export default {
  mount(root, ctx) {
    const data = ctx.data;
    let mode = 'menu', sel = data.lastMode ?? 0, kind = null, arena = ARENAS[0];
    let p1, p2, ball, s1 = 0, s2 = 0, serveT = 0, hits = 0, lives = 3, challengeScore = 0, speedUp = 1, over = false;
    const keys = new Set();
    const kd = e => { if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(e.code)) keys.add(e.code); };
    const ku = e => keys.delete(e.code);
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const touches = new Map();

    function start(id) {
      kind = id; mode = 'play'; data.lastMode = MENU.findIndex(m => m.id === id); ctx.save();
      arena = ARENAS[(data.arena = ((data.arena ?? -1) + 1) % ARENAS.length)];
      p1 = { y: H / 2, ty: H / 2, vy: 0 }; p2 = { y: H / 2, ty: H / 2, vy: 0, think: 0, aim: H / 2 };
      s1 = 0; s2 = 0; hits = 0; lives = 3; challengeScore = 0; speedUp = 1; over = false;
      newServe(Math.random() < .5 ? 1 : -1);
      a.banner(id === '2p' ? '¡Duelo de golosinas!' : id === 'desafio' ? 'Modo desafío' : `Bongi Bot · ${DIFFS[id].label}`, arena.name, 1.6);
      ctx.sfx.click();
    }
    function newServe(dir) {
      ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, spin: 0, trail: [] };
      serveT = 1; ball.dir = dir;
    }
    const baseSpeed = () => 190 * speedUp;

    function aiUpdate(dt) {
      const d = DIFFS[kind === 'desafio' ? 'media' : kind];
      p2.think -= dt;
      if (p2.think <= 0) {
        p2.think = d.react;
        if (ball.vx > 0) {
          // predecir dónde llega el bombón (con rebotes en los bordes)
          let t = (W - 20 - ball.x) / ball.vx, y = ball.y + ball.vy * t;
          const span = H - 2 * BR; y -= BR; y = ((y % (2 * span)) + 2 * span) % (2 * span); if (y > span) y = 2 * span - y; y += BR;
          p2.aim = y + (Math.random() - .5) * d.err * 2;
        } else p2.aim = H / 2 + (ball.y - H / 2) * .3;
      }
      const diff = p2.aim - p2.y, mv = Math.sign(diff) * Math.min(Math.abs(diff), d.sp * (kind === 'desafio' ? speedUp : 1) * dt);
      p2.vy = mv / dt; p2.y += mv;
    }

    function paddleHit(p, side) {
      const off = (ball.y - p.y) / (PH / 2);
      const sp = Math.min(520, Math.hypot(ball.vx, ball.vy) * 1.05);
      const ang = off * .9;
      ball.vx = side * Math.cos(ang) * sp; ball.vy = Math.sin(ang) * sp + p.vy * .25;
      ball.spin = p.vy * .004;
      hits++; ctx.sfx.bounce(Math.min(hits, 10));
      a.fx.burst(ball.x, ball.y, { n: 6, colors: ['#ffd166', '#fff', side > 0 ? '#06d6a0' : '#ef476f'], speed: 90, life: .4 });
      if (kind === 'desafio') challengeScore += 10;
    }

    function point(winner) {
      a.fx.shake(3, .2);
      if (kind === 'desafio') {
        if (winner === 1) { challengeScore += 200; speedUp *= 1.12; ctx.sfx.coin(); a.banner('¡Punto!', 'Más rápido…', .9); }
        else { lives--; ctx.sfx.hurt(); if (lives <= 0) return finish(); a.banner('¡Uy!', `${lives} ${lives === 1 ? 'vida' : 'vidas'}`, .9); }
        s1 += winner === 1 ? 1 : 0; s2 += winner === 2 ? 1 : 0;
        return newServe(winner === 1 ? 1 : -1);
      }
      if (winner === 1) s1++; else s2++;
      ctx.sfx[winner === 1 || kind === '2p' ? 'coin' : 'error']();
      if (s1 >= WIN || s2 >= WIN) return finish();
      newServe(winner === 1 ? 1 : -1);
    }
    function finish() {
      over = true; mode = 'over';
      if (kind === 'desafio') return a.end({ score: challengeScore, won: s1 > 0, title: '¡Fin del desafío!', extra: { candies: s1 }, summary: `Hiciste ${s1} puntos y devolviste ${hits} bombones.` });
      if (kind === '2p') return a.end({ score: hits * 5, won: true, title: s1 > s2 ? '¡Ganó el jugador verde!' : '¡Ganó el jugador rosa!', extra: {}, summary: `Resultado: ${s1} a ${s2}, con ${hits} golpes en total.` });
      const won = s1 > s2, mult = { facil: 1, media: 2, dificil: 3 }[kind];
      a.end({ score: s1 * 100 * mult + (won ? 500 * mult : 0), won, title: won ? `¡Le ganaste al Bongi Bot!` : 'Ganó el Bongi Bot', extra: { hardWin: won && kind === 'dificil' ? 1 : 0, candies: s1 }, summary: `Resultado: ${s1} a ${s2} en dificultad ${DIFFS[kind].label.toLowerCase()}.` });
    }

    function update(dt) {
      if (mode === 'menu') {
        if (a.hit('up')) { sel = (sel + MENU.length - 1) % MENU.length; ctx.sfx.tick(); }
        if (a.hit('down')) { sel = (sel + 1) % MENU.length; ctx.sfx.tick(); }
        if (a.hit('a')) start(MENU[sel].id);
        return;
      }
      if (over) return;
      ctx.hud(kind === 'desafio' ? { Puntos: challengeScore, Vidas: lives, Velocidad: `x${speedUp.toFixed(2)}` } : { Verde: s1, Rosa: s2, Golpes: hits });
      // jugador 1 (W/S; en 1 jugador también flechas y botones)
      const two = kind === '2p';
      const up1 = keys.has('KeyW') || (!two && (keys.has('ArrowUp') || a.down('up'))), dn1 = keys.has('KeyS') || (!two && (keys.has('ArrowDown') || a.down('down')));
      if (up1 || dn1) p1.ty = p1.y + ((dn1 ? 1 : 0) - (up1 ? 1 : 0)) * 260 * dt;
      const prev1 = p1.y; p1.ty = Math.max(PH / 2, Math.min(H - PH / 2, p1.ty)); p1.y += (p1.ty - p1.y) * Math.min(1, dt * 20); p1.vy = (p1.y - prev1) / dt;
      if (two) {
        const up2 = keys.has('ArrowUp'), dn2 = keys.has('ArrowDown');
        if (up2 || dn2) p2.ty = p2.y + ((dn2 ? 1 : 0) - (up2 ? 1 : 0)) * 260 * dt;
        const prev2 = p2.y; p2.ty = Math.max(PH / 2, Math.min(H - PH / 2, p2.ty)); p2.y += (p2.ty - p2.y) * Math.min(1, dt * 20); p2.vy = (p2.y - prev2) / dt;
      } else aiUpdate(dt);
      p2.y = Math.max(PH / 2, Math.min(H - PH / 2, p2.y));
      // saque
      if (serveT > 0) { serveT -= dt; if (serveT <= 0) { const ang = (Math.random() - .5) * .8; ball.vx = Math.cos(ang) * baseSpeed() * ball.dir; ball.vy = Math.sin(ang) * baseSpeed(); } return; }
      // bombón
      ball.vy += ball.spin * Math.abs(ball.vx) * dt * 60; ball.spin *= .985;
      const steps = Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 4);
      for (let i = 0; i < steps; i++) {
        ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
        if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); ctx.sfx.bounce(0); }
        if (ball.y > H - BR) { ball.y = H - BR; ball.vy = -Math.abs(ball.vy); ctx.sfx.bounce(0); }
        if (ball.vx < 0 && ball.x - BR <= 20 + PW && ball.x > 14 && Math.abs(ball.y - p1.y) <= PH / 2 + BR) { ball.x = 20 + PW + BR; paddleHit(p1, 1); }
        if (ball.vx > 0 && ball.x + BR >= W - 20 - PW && ball.x < W - 14 && Math.abs(ball.y - p2.y) <= PH / 2 + BR) { ball.x = W - 20 - PW - BR; paddleHit(p2, -1); }
        if (ball.x < -BR * 2) return point(2);
        if (ball.x > W + BR * 2) return point(1);
      }
      ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 8) ball.trail.shift();
    }

    function onPointer(type, x, y, e) {
      if (mode === 'menu') {
        if (type !== 'down') return;
        MENU.forEach((m, i) => { const by = 52 + i * 32; if (y > by && y < by + 28 && x > 90 && x < 310) { if (i === sel) start(m.id); else { sel = i; ctx.sfx.tick(); start(m.id); } } });
        return;
      }
      if (type === 'up' || type === 'cancel') { touches.delete(e.pointerId); return; }
      const side = kind === '2p' ? (touches.get(e.pointerId) ?? (x < W / 2 ? 1 : 2)) : 1;
      touches.set(e.pointerId, side);
      if (side === 1) p1.ty = y; else p2.ty = y;
    }

    function paddle(g, x, y, color) {
      roundRect(g, x, y - PH / 2, PW, PH, 4); g.fillStyle = color; g.fill();
      g.fillStyle = 'rgba(255,255,255,.75)'; for (let k = -PH / 2 + 4; k < PH / 2 - 4; k += 8) g.fillRect(x + 1, y + k, PW - 2, 3);
    }
    function draw(g) {
      if (mode === 'menu') {
        const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#5b2d1f'); grd.addColorStop(1, '#2a140e'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd166'; g.font = `700 20px ${FONT}`; g.fillText('Bongi Pong', W / 2, 24);
        MENU.forEach((m, i) => {
          const by = 52 + i * 32; roundRect(g, 90, by, 220, 28, 10); g.fillStyle = i === sel ? '#ffd166' : 'rgba(255,255,255,.1)'; g.fill();
          g.fillStyle = i === sel ? '#3b1f2b' : '#fff'; g.font = `700 12px ${FONT}`; g.fillText(m.label, W / 2, by + 10);
          g.font = `600 9px ${FONT}`; g.fillStyle = i === sel ? '#5b2d1f' : '#f6dbe3'; g.fillText(m.sub, W / 2, by + 21);
        });
        return;
      }
      g.fillStyle = arena.bg; g.fillRect(0, 0, W, H);
      roundRect(g, 6, 6, W - 12, H - 12, 14); g.fillStyle = arena.table; g.fill();
      g.strokeStyle = arena.line; g.globalAlpha = .5; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(W / 2, 12); g.lineTo(W / 2, H - 12); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.arc(W / 2, H / 2, 26, 0, 7); g.stroke(); g.globalAlpha = 1;
      // marcador
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 34px ${FONT}`; g.fillStyle = arena.line; g.globalAlpha = .75;
      if (kind === 'desafio') { g.font = `700 22px ${FONT}`; g.fillText(`${challengeScore}`, W / 2 - 60, 34); g.fillText('♥'.repeat(lives), W / 2 + 60, 34); }
      else { g.fillText(String(s1), W / 2 - 46, 34); g.fillText(String(s2), W / 2 + 46, 34); }
      g.globalAlpha = 1;
      paddle(g, 20, p1.y, '#06d6a0'); paddle(g, W - 20 - PW, p2.y, '#ef476f');
      // estela y bombón
      ball.trail.forEach(([x, y], i) => { g.globalAlpha = i / ball.trail.length * .35; g.fillStyle = '#ffd166'; g.beginPath(); g.arc(x, y, BR * .8, 0, 7); g.fill(); });
      g.globalAlpha = 1;
      g.fillStyle = '#3b1a12'; g.beginPath(); g.arc(ball.x, ball.y, BR, 0, 7); g.fill();
      g.strokeStyle = '#ffd166'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(ball.x - 2, ball.y - 2, 1.6, 0, 7); g.fill();
      if (serveT > 0) { g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText('¡Listos!', W / 2, H / 2 + 44); }
      if (kind === '2p') { g.font = `600 9px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('W / S', 40, H - 16); g.fillText('▲ / ▼', W - 40, H - 16); }
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Mesa de Bongi Pong', update, draw, onPointer,
      controls: { dirs: ['up', 'down'], buttons: [{ id: 'a', label: 'Elegir' }] },
      help: ['Arrastrá el dedo para mover tu barra (verde). En teclado: W y S, o las flechas.', 'En 2 jugadores, cada uno arrastra en su mitad: verde con W/S y rosa con ▲/▼.', 'Pegale con la barra en movimiento para darle efecto al bombón.']
    });
    root._debug = { get state() { return { mode, kind, s1, s2, hits, lives, over }; }, start, point: w => point(w) };
    if (ctx.again && data.lastMode != null) start(MENU[data.lastMode].id);
    a.start();
    return { destroy() { a.destroy(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); }, togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
