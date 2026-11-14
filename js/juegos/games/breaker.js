// BONGI BREAKER — Rompé el dulce.
// Barra de regaliz, bombón que rebota con física en pasos pequeños (no atraviesa bloques),
// 10 niveles originales, bloques de varias resistencias, dorados, explosivos, poderes y combos.
import { arcade, FONT, roundRect } from '../core/arcade.js?v=cfab42284a';

const W = 300, H = 420, COLS = 10, BW = 27, BH = 12, GAP = 2, OX = (W - COLS * (BW + GAP) + GAP) / 2, OY = 54, PY = 392, R = 5;
const COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#7ae0ff', '#ff8fb1', '#ff6b35', '#c9a0ff'];
// Leyenda: . vacío · 1/2/3 golpes · G dorado irrompible · P trae poder · X explosivo
const LEVELS = [
  ['..........', '.11111111.', '.12222221.', '.11111111.', '..........', '1P1.11.1P1'],
  ['...1..1...', '..121121..', '.12222221.', '.1222P221.', '..122221..', '...1221...', '....11....'],
  ['1111111111', '2222222222', 'G........G', '.P.1111.P.', '..333333..', '1111111111'],
  ['..XX..XX..', '.1111111..', '..1111111.', '.1111111..', '..1111111.', 'P2222222P.'],
  ['....11....', '...1221...', '..123321..', '.12333321.', '..123321..', '...1221...', '....11....', '....GG....'],
  ['1.1.1.1.1.', '.2.2.2.2.2', '1.1.X.1.1.', '.2.2.2.2.2', '1.P.1.1.P.', 'GGG....GGG'],
  ['2222222222', '1........1', '1.333333.1', '1.3XPPX3.1', '1.333333.1', '1........1', '2222222222'],
  ['G1G1G1G1G1', '1111111111', '.22222222.', '..P3333P..', '...3XX3...', '....33....'],
  ['3.......3.', '.3.....3..', '..3XXX3...', '..3PPP3...', '.3.....3..', '3.......3.', '1111111111'],
  ['GGGG..GGGG', '3333..3333', '2222XX2222', '1111PP1111', '2222XX2222', '3333..3333', '1111111111']
];
const POWERS = [
  { id: 'multi', label: '3', name: '¡Más pelotas!', color: '#7ae0ff' },
  { id: 'long', label: '↔', name: 'Barra larga', color: '#06d6a0' },
  { id: 'fire', label: '✹', name: 'Bola de chocolate', color: '#7a3e2b' },
  { id: 'sticky', label: '◉', name: 'Barra pegajosa', color: '#ff8fb1' },
  { id: 'row', label: '≡', name: 'Rompefilas', color: '#ffd166' },
  { id: 'points', label: '+', name: '+500 puntos', color: '#ff6b35' },
  { id: 'slow', label: '≈', name: 'Bombón lento', color: '#c9a0ff' },
  { id: 'life', label: '♥', name: '¡Vida extra!', color: '#ef476f' }
];

export default {
  mount(root, ctx) {
    let level = 0, lives = 3, score = 0, cleared = 0, bricksBroken = 0, combo = 0;
    let bricks = [], balls = [], caps = [], pad = { x: W / 2, w: 56, tx: W / 2 }, long = 0, fire = 0, sticky = 0, slow = 0, phase = 'serve';

    function loadLevel() {
      const L = LEVELS[level % LEVELS.length];
      bricks = [];
      L.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === '.') return;
        const hp = ch === 'G' ? Infinity : ch === 'X' || ch === 'P' ? 1 : Number(ch);
        bricks.push({ x: OX + c * (BW + GAP), y: OY + r * (BH + GAP), hp, max: hp, kind: ch === 'G' ? 'gold' : ch === 'X' ? 'bomb' : ch === 'P' ? 'power' : 'n', color: COLORS[(r + Math.floor(c / 2)) % COLORS.length], hit: 0 });
      }));
      caps = []; long = 0; fire = 0; sticky = 0; slow = 0; pad.w = 56;
      serve();
      a.banner(`Nivel ${level + 1}`, level >= LEVELS.length ? '¡Vuelta extra, más rápido!' : 'Rompé todas las golosinas', 1.6);
      ctx.music(level % 2 ? 'fabrica' : 'bloques');
    }
    const baseSpeed = () => Math.min(420, 230 + level * 16) * (slow > 0 ? .7 : 1);
    function serve() { balls = [{ x: pad.x, y: PY - R - 4, vx: 0, vy: 0, stuck: true, off: 0 }]; phase = 'serve'; combo = 0; }
    function launch(b) {
      const ang = (b.off / (pad.w / 2)) * 1.0 + (Math.random() - .5) * .2;
      const sp = baseSpeed();
      b.vx = Math.sin(ang) * sp; b.vy = -Math.cos(ang) * sp; b.stuck = false; phase = 'play';
      ctx.sfx.bounce(2);
    }

    function hitBrick(br, ball) {
      if (br.kind === 'gold') { br.hit = .15; ctx.sfx.bounce(4); return; }
      br.hp--; br.hit = .15;
      combo++;
      if (br.hp > 0) { ctx.sfx.brick(combo); score += 5; return; }
      destroy(br);
    }
    function destroy(br) {
      if (br.dead) return;
      br.dead = true; bricksBroken++;
      const pts = Math.round(10 * br.max * (1 + Math.min(combo, 20) * .2));
      score += pts; ctx.sfx.brick(combo);
      if (combo >= 5 && combo % 5 === 0) { a.fx.text(br.x + BW / 2, br.y, `Combo x${combo}`, '#06d6a0', 12); ctx.sfx.combo(combo / 5); }
      a.fx.burst(br.x + BW / 2, br.y + BH / 2, { n: 9, colors: [br.color, '#fff', '#ffd166'], speed: 120, size: 2.6 });
      if (br.kind === 'bomb') {
        ctx.sfx.explode(.8); a.fx.shake(4, .25);
        for (const o of bricks) if (!o.dead && o.kind !== 'gold' && Math.abs(o.x - br.x) <= BW + GAP + 1 && Math.abs(o.y - br.y) <= BH + GAP + 1) { o.hp = 0; destroy(o); }
      }
      if (br.kind === 'power' || Math.random() < .11) {
        let p = POWERS[Math.floor(Math.random() * (POWERS.length - 1))];
        if (Math.random() < .04) p = POWERS[POWERS.length - 1];
        caps.push({ x: br.x + BW / 2, y: br.y + BH / 2, p });
      }
    }

    function applyPower(p) {
      ctx.sfx.powerup(); a.fx.text(pad.x, PY - 18, p.name, p.color, 12);
      if (p.id === 'multi') { const src = balls.find(b => !b.stuck) || balls[0]; for (const k of [-1, 1]) { const sp = Math.hypot(src.vx, src.vy) || baseSpeed(); const ang = Math.atan2(src.vx, -src.vy) + k * .45; balls.push({ x: src.x, y: src.y, vx: Math.sin(ang) * sp, vy: -Math.abs(Math.cos(ang) * sp), stuck: false, off: 0 }); } if (phase === 'serve') launch(balls[0]); }
      if (p.id === 'long') { long = 15; pad.w = 84; }
      if (p.id === 'fire') fire = 8;
      if (p.id === 'sticky') sticky = 12;
      if (p.id === 'slow') { slow = 10; for (const b of balls) { const k = .7; b.vx *= k; b.vy *= k; } }
      if (p.id === 'points') score += 500;
      if (p.id === 'life') lives++;
      if (p.id === 'row') {
        const alive = bricks.filter(b => !b.dead && b.kind !== 'gold');
        if (alive.length) { const y = Math.max(...alive.map(b => b.y)); for (const b of alive) if (b.y === y) { b.hp = 0; destroy(b); } a.fx.shake(3, .2); }
      }
    }

    function stepBall(b, dt) {
      if (b.stuck) { b.x = pad.x + b.off; b.y = PY - R - 4; return; }
      const sp = Math.hypot(b.vx, b.vy), n = Math.ceil((sp * dt) / 3);
      for (let i = 0; i < n; i++) {
        b.x += b.vx * dt / n; b.y += b.vy * dt / n;
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); ctx.sfx.bounce(0); }
        if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); ctx.sfx.bounce(0); }
        if (b.y < 34 + R) { b.y = 34 + R; b.vy = Math.abs(b.vy); ctx.sfx.bounce(0); }
        // barra
        if (b.vy > 0 && b.y + R >= PY - 4 && b.y + R <= PY + 8 && Math.abs(b.x - pad.x) <= pad.w / 2 + R) {
          const off = Math.max(-1, Math.min(1, (b.x - pad.x) / (pad.w / 2)));
          const ang = off * 1.05; const s = Math.min(baseSpeed() * 1.25, Math.hypot(b.vx, b.vy) * 1.012);
          b.vx = Math.sin(ang) * s; b.vy = -Math.abs(Math.cos(ang) * s); b.y = PY - 4 - R;
          combo = 0; ctx.sfx.bounce(1); a.fx.burst(b.x, PY - 4, { n: 4, colors: ['#ffd166', '#fff'], speed: 60, life: .3 });
          if (sticky > 0) { b.stuck = true; b.off = b.x - pad.x; phase = 'serve'; }
          return;
        }
        // bloques
        for (const br of bricks) {
          if (br.dead) continue;
          const cx = Math.max(br.x, Math.min(b.x, br.x + BW)), cy = Math.max(br.y, Math.min(b.y, br.y + BH));
          const dx = b.x - cx, dy = b.y - cy;
          if (dx * dx + dy * dy > R * R) continue;
          if (fire > 0 && br.kind !== 'gold') { combo++; br.hp = 0; destroy(br); continue; }
          // rebote por el eje de menor penetración
          const penX = dx === 0 ? Infinity : R - Math.abs(dx), penY = dy === 0 ? Infinity : R - Math.abs(dy);
          if (dx !== 0 && (dy === 0 || penX < penY)) { b.vx = Math.sign(dx) * Math.abs(b.vx); b.x = cx + Math.sign(dx) * R; }
          else { b.vy = (dy === 0 ? -Math.sign(b.vy) : Math.sign(dy)) * Math.abs(b.vy); b.y = cy + (dy === 0 ? -Math.sign(b.vy) : Math.sign(dy)) * R; }
          // evitar trayectorias casi horizontales
          if (Math.abs(b.vy) < 60) b.vy = 60 * Math.sign(b.vy || -1);
          hitBrick(br, b);
          break;
        }
        if (b.y > H + 20) { b.lost = true; return; }
      }
    }

    function update(dt) {
      // barra
      const kdir = (a.down('right') ? 1 : 0) - (a.down('left') ? 1 : 0);
      if (kdir) pad.tx = pad.x + kdir * 420 * dt;
      pad.tx = Math.max(pad.w / 2, Math.min(W - pad.w / 2, pad.tx));
      pad.x += (pad.tx - pad.x) * Math.min(1, dt * 22);
      if (a.hit('a') || a.hit('up')) balls.filter(b => b.stuck).forEach(launch);
      if (long > 0 && (long -= dt) <= 0) pad.w = 56;
      if (fire > 0) fire -= dt; if (sticky > 0) sticky -= dt; if (slow > 0) slow -= dt;
      for (const b of balls) stepBall(b, dt);
      balls = balls.filter(b => !b.lost);
      if (!balls.length) {
        lives--; ctx.sfx.hurt(); a.fx.shake(3, .25);
        if (lives <= 0) return gameOver();
        a.banner('¡Se cayó el bombón!', `${lives} ${lives === 1 ? 'vida' : 'vidas'}`, 1.2);
        serve(); long = 0; fire = 0; sticky = 0; pad.w = 56;
      }
      for (const c of caps) {
        c.y += 80 * dt;
        if (c.y > PY - 6 && c.y < PY + 10 && Math.abs(c.x - pad.x) < pad.w / 2 + 8) { c.got = true; applyPower(c.p); }
      }
      caps = caps.filter(c => !c.got && c.y < H + 20);
      for (const br of bricks) if (br.hit > 0) br.hit -= dt;
      if (!bricks.some(b => !b.dead && b.kind !== 'gold')) {
        cleared++; level++; score += 1000 + lives * 100; ctx.sfx.fanfare();
        a.fx.burst(W / 2, H / 2, { n: 40, speed: 220 });
        loadLevel();
      }
      ctx.hud({ Nivel: level + 1, Vidas: lives, Puntos: score });
    }
    function gameOver() {
      phase = 'over';
      a.end({ score, won: cleared > 0, title: cleared >= 5 ? '¡Rompebloques profesional!' : cleared ? '¡Muy buena rotura!' : '¡Fin del juego!', extra: { cleared, candies: bricksBroken }, summary: `Superaste ${cleared} ${cleared === 1 ? 'nivel' : 'niveles'} y rompiste ${bricksBroken} golosinas.` });
    }

    function onPointer(type, x) {
      if (type === 'down' || type === 'move') pad.tx = x;
      if (type === 'up') balls.filter(b => b.stuck).forEach(launch);
    }

    function draw(g) {
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#4a2134'); grd.addColorStop(1, '#25101b');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.03)'; for (let i = 0; i < 12; i++) g.fillRect(0, 40 + i * 32, W, 14);
      // marcador
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, 32);
      g.textBaseline = 'middle'; g.font = `700 12px ${FONT}`; g.textAlign = 'left'; g.fillStyle = '#ffd166'; g.fillText(`Puntos ${score}`, 10, 16);
      g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(`Nivel ${level + 1}`, W / 2, 16);
      g.textAlign = 'right'; g.fillStyle = '#ff8fb1'; g.fillText('♥'.repeat(Math.min(lives, 6)), W - 10, 16);
      // estados activos
      const act = [fire > 0 && ['✹', fire, '#c98b6b'], sticky > 0 && ['◉', sticky, '#ff8fb1'], long > 0 && ['↔', long, '#06d6a0'], slow > 0 && ['≈', slow, '#c9a0ff']].filter(Boolean);
      act.forEach(([s, t, c], i) => { g.fillStyle = c; g.font = `700 11px ${FONT}`; g.textAlign = 'left'; g.fillText(`${s} ${Math.ceil(t)}`, 10 + i * 40, 42); });
      // bloques
      for (const br of bricks) {
        if (br.dead) continue;
        const k = br.hit > 0 ? 2 : 0;
        roundRect(g, br.x - k / 2, br.y - k / 2, BW + k, BH + k, 4);
        if (br.kind === 'gold') { const gg = g.createLinearGradient(br.x, br.y, br.x + BW, br.y + BH); gg.addColorStop(0, '#ffe08a'); gg.addColorStop(1, '#c98a00'); g.fillStyle = gg; }
        else if (br.kind === 'bomb') g.fillStyle = '#3b1f2b';
        else g.fillStyle = br.color;
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(br.x + 3, br.y + 2, BW - 6, 2);
        if (br.max > 1 && br.max !== Infinity) { g.fillStyle = 'rgba(59,31,43,.45)'; for (let i = 0; i < br.max - br.hp; i++) g.fillRect(br.x + 5 + i * 7, br.y + 6, 4, 3); g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < br.hp; i++) g.fillRect(br.x + BW - 6 - i * 5, br.y + BH - 4, 3, 2); }
        if (br.kind === 'bomb') { g.fillStyle = '#ffd166'; g.font = `700 9px ${FONT}`; g.textAlign = 'center'; g.fillText('✸', br.x + BW / 2, br.y + BH / 2 + 1); }
        if (br.kind === 'power') { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.setLineDash([3, 2]); roundRect(g, br.x + 1.5, br.y + 1.5, BW - 3, BH - 3, 3); g.stroke(); g.setLineDash([]); }
      }
      // cápsulas de poder (caramelos envueltos)
      for (const c of caps) {
        g.save(); g.translate(c.x, c.y);
        g.fillStyle = c.p.color; g.beginPath(); g.moveTo(-14, -5); g.lineTo(-9, 0); g.lineTo(-14, 5); g.fill(); g.beginPath(); g.moveTo(14, -5); g.lineTo(9, 0); g.lineTo(14, 5); g.fill();
        roundRect(g, -10, -6, 20, 12, 6); g.fill();
        g.fillStyle = '#fff'; g.font = `700 9px ${FONT}`; g.textAlign = 'center'; g.fillText(c.p.label, 0, 1);
        g.restore();
      }
      // barra de regaliz
      const px = pad.x - pad.w / 2;
      roundRect(g, px, PY - 4, pad.w, 10, 5); g.fillStyle = sticky > 0 ? '#ff8fb1' : '#d62839'; g.fill();
      g.strokeStyle = '#9e1b2b'; g.lineWidth = 2; for (let x = px + 6; x < px + pad.w - 4; x += 7) { g.beginPath(); g.moveTo(x, PY - 3); g.lineTo(x + 4, PY + 5); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px + 4, PY - 3, pad.w - 8, 2);
      // bombones
      for (const b of balls) {
        if (fire > 0) { g.fillStyle = 'rgba(255,140,60,.35)'; g.beginPath(); g.arc(b.x - b.vx * .02, b.y - b.vy * .02, R + 3, 0, 7); g.fill(); }
        g.fillStyle = fire > 0 ? '#c94c1a' : '#4a2318'; g.beginPath(); g.arc(b.x, b.y, R, 0, 7); g.fill();
        g.fillStyle = '#ffd166'; g.beginPath(); g.arc(b.x + 1, b.y - 4, 1.8, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(b.x - 1.6, b.y - 1.6, 1.4, 0, 7); g.fill();
      }
      if (phase === 'serve') { g.fillStyle = '#fff'; g.font = `600 12px ${FONT}`; g.textAlign = 'center'; g.fillText('Tocá o apretá Espacio para lanzar', W / 2, PY - 40); }
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Pantalla de Bongi Breaker', update, draw, onPointer,
      controls: { dirs: ['left', 'right'], buttons: [{ id: 'a', label: 'Lanzar' }] },
      help: ['Arrastrá el dedo o el mouse para mover la barra (también ◀ ▶).', 'Tocá o apretá Espacio para lanzar el bombón.', 'Donde pega en la barra cambia el ángulo del rebote.']
    });
    root._debug = {
      get state() { return { level, lives, score, cleared, bricks: bricks.filter(b => !b.dead && b.kind !== 'gold').length, balls: balls.length }; },
      clear() { for (const b of bricks) if (b.kind !== 'gold') b.dead = true; },
      power: id => applyPower(POWERS.find(p => p.id === id))
    };
    loadLevel();
    a.start();
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
