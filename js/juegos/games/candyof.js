// CANDY OF BONGI — Operación Dulce.
// Parodia caricaturesca y no violenta: los Ácidos quieren robar la receta secreta del chocolate.
// Lanzadores de golosinas, bombas de chocolate, 4 tipos de enemigos, jefe Gran Limón Ácido
// y tres modos: Oleadas (misión), Supervivencia y Contrarreloj. Los ácidos derrotados se vuelven caramelos.
import { arcade, FONT, roundRect, drawBongi } from '../core/arcade.js';

const W = 360, H = 300, FX = W / 2, FY = H - 30;
const WEAPONS = {
  gomitas: { name: 'Lanzador de gomitas', rate: 8, color: '#06d6a0' },
  confites: { name: 'Cañón de confites', rate: 3.2, color: '#ffd166' },
  burbujas: { name: 'Pistola de burbujas', rate: 2.6, color: '#7ae0ff' },
  chupetines: { name: 'Disparador de chupetines', rate: 3, color: '#ff6b35' },
  crema: { name: 'Lanzador de crema', rate: 7, color: '#fff3e0' }
};
const FOES = {
  limon: { hp: 2, sp: 26, r: 9, pts: 50, color: '#f1e05a', target: 'fabrica' },
  gotita: { hp: 1, sp: 62, r: 6, pts: 30, color: '#b5e655', target: 'jugador' },
  pomelo: { hp: 7, sp: 15, r: 14, pts: 150, color: '#ff8a65', target: 'fabrica' },
  agrio: { hp: 3, sp: 30, r: 10, pts: 100, color: '#c0ca33', target: 'distancia' }
};
const MODES = [
  { id: 'oleadas', label: 'Misión: Oleadas', sub: '10 oleadas y jefes. ¡Salvá la receta!' },
  { id: 'supervivencia', label: 'Supervivencia', sub: 'Oleadas sin fin, cada vez más ácidas' },
  { id: 'contrarreloj', label: 'Contrarreloj', sub: '90 segundos para sumar todo lo posible' }
];

export default {
  mount(root, ctx) {
    const data = ctx.data;
    let screen = 'menu', sel = data.lastMode ?? 0, mode = null;
    let P, foes = [], shots = [], acid = [], drops = [], wave = 0, waveQueue = [], spawnT = 0, score = 0, candies = 0, bosses = 0;
    let factory = 20, timeLeft = 0, weapon = 'gomitas', weaponT = 0, bombs = 2, fireT = 0, boss = null, betweenT = 0, flash = 0, over = false;
    const sticks = new Map(); let mouse = null;

    function start(id) {
      mode = id; screen = 'play'; data.lastMode = MODES.findIndex(m => m.id === id); ctx.save();
      P = { x: FX, y: H / 2 + 40, hp: 5, inv: 1, dir: 1, walk: 0, aimX: 0, aimY: -1 };
      foes = []; shots = []; acid = []; drops = []; wave = 0; waveQueue = []; score = 0; candies = 0; bosses = 0; boss = null;
      factory = 20; weapon = 'gomitas'; weaponT = 0; bombs = 2; over = false; timeLeft = id === 'contrarreloj' ? 90 : 0;
      nextWave();
      ctx.sfx.click();
    }
    function nextWave() {
      wave++;
      const isBoss = mode !== 'contrarreloj' && wave % 5 === 0;
      waveQueue = [];
      if (isBoss) { spawnBoss(); a.banner(`Oleada ${wave}: ¡Gran Limón Ácido!`, 'Quiere la receta secreta', 2); }
      else {
        const n = 6 + wave * 3;
        for (let i = 0; i < n; i++) {
          const r = Math.random();
          waveQueue.push(wave >= 3 && r < .12 ? 'pomelo' : wave >= 2 && r < .3 ? 'agrio' : r < .55 ? 'gotita' : 'limon');
        }
        if (mode !== 'contrarreloj') a.banner(`Oleada ${wave}`, wave === 1 ? 'Defendé la fábrica de golosinas' : 'Llegan más ácidos', 1.6);
      }
      spawnT = 1.2;
      if (wave > 1 && Math.random() < .7) drops.push({ kind: 'caja', weapon: Object.keys(WEAPONS)[1 + Math.floor(Math.random() * 4)], x: 40 + Math.random() * (W - 80), y: 60 + Math.random() * 120, t: 0 });
    }
    function spawnFoe(type) {
      const f = FOES[type], side = Math.random();
      const x = side < .5 ? Math.random() * W : (side < .75 ? -12 : W + 12), y = side < .5 ? -12 : Math.random() * (H * .6);
      const hpMul = 1 + (mode === 'supervivencia' ? wave * .08 : wave * .04);
      foes.push({ type, x, y, hp: f.hp * hpMul, max: f.hp * hpMul, r: f.r, sp: f.sp * (1 + wave * .03), t: Math.random() * 6, slow: 0, shootT: 2 + Math.random() * 2, kb: { x: 0, y: 0 } });
    }
    function spawnBoss() {
      boss = { x: FX, y: -40, r: 28, hp: 60 + wave * 12, max: 60 + wave * 12, t: 0, phase: 0, shootT: 2, summonT: 5, enter: true, kb: { x: 0, y: 0 } };
      ctx.music('castillo');
    }

    /* ---------- Disparo ---------- */
    function fire(dx, dy) {
      const w = WEAPONS[weapon];
      if (fireT > 0) return; fireT = 1 / w.rate;
      const ang = Math.atan2(dy, dx), sx = P.x + Math.cos(ang) * 12, sy = P.y + Math.sin(ang) * 12;
      const shot = (a2, sp, extra) => shots.push({ x: sx, y: sy, vx: Math.cos(a2) * sp, vy: Math.sin(a2) * sp, life: 1.2, dmg: 1, r: 3, kind: weapon, ...extra });
      if (weapon === 'gomitas') shot(ang + (Math.random() - .5) * .08, 300, {});
      if (weapon === 'confites') for (let k = -2; k <= 2; k++) shot(ang + k * .17, 280, { r: 2.6, color: ['#ef476f', '#ffd166', '#06d6a0', '#7ae0ff', '#ff8fb1'][k + 2] });
      if (weapon === 'burbujas') shot(ang, 150, { r: 8, life: 1.8, dmg: 1, trap: true });
      if (weapon === 'chupetines') shot(ang, 360, { r: 4, dmg: 2, pierce: 3 });
      if (weapon === 'crema') for (let k = 0; k < 3; k++) shot(ang + (Math.random() - .5) * .6, 170 + Math.random() * 40, { r: 6, life: .45, dmg: .7, push: 60 });
      ctx.sfx.shoot(Object.keys(WEAPONS).indexOf(weapon));
    }
    function chocoBomb() {
      if (bombs <= 0) return; bombs--;
      ctx.sfx.explode(1.6); a.fx.shake(7, .5); flash = .35;
      a.fx.burst(P.x, P.y, { n: 60, colors: ['#5b2d1f', '#7a3e2b', '#ffd166', '#fff'], speed: 260, life: 1 });
      for (const f of foes) if (Math.hypot(f.x - P.x, f.y - P.y) < 150) hit(f, 6);
      acid = [];
      if (boss) hitBoss(Math.hypot(boss.x - P.x, boss.y - P.y) < 170 ? 10 : 0);
    }
    function hit(f, dmg) {
      f.hp -= dmg;
      if (f.hp <= 0 && !f.dead) {
        f.dead = true; const pts = FOES[f.type].pts; score += pts; ctx.sfx.pop();
        a.fx.burst(f.x, f.y, { n: 12, colors: ['#ffd166', '#ef476f', '#06d6a0', '#fff'], speed: 110 });
        // se convierten en caramelos
        const n = f.type === 'pomelo' ? 3 : 1;
        for (let i = 0; i < n; i++) drops.push({ kind: 'caramelo', x: f.x + (Math.random() - .5) * 14, y: f.y + (Math.random() - .5) * 14, t: 0 });
        if (Math.random() < .06) drops.push({ kind: Math.random() < .5 ? 'bomba' : 'caja', weapon: Object.keys(WEAPONS)[1 + Math.floor(Math.random() * 4)], x: f.x, y: f.y, t: 0 });
        if (Math.random() < .05) drops.push({ kind: 'corazon', x: f.x, y: f.y, t: 0 });
      }
    }
    function hitBoss(dmg) {
      if (!boss || !dmg) return;
      boss.hp -= dmg; boss.flash = .08;
      if (boss.hp <= 0) {
        score += 3000; bosses++; ctx.sfx.explode(2); a.fx.shake(8, .6);
        for (let i = 0; i < 14; i++) drops.push({ kind: 'caramelo', x: boss.x + (Math.random() - .5) * 60, y: boss.y + (Math.random() - .5) * 40, t: 0 });
        a.fx.burst(boss.x, boss.y, { n: 80, speed: 300, life: 1.2 });
        a.banner('¡Gran Limón derrotado!', 'Se convirtió en caramelos', 2);
        boss = null; ctx.music('accion'); betweenT = 2.5;
        if (mode === 'oleadas' && wave >= 10) { over = 'winning'; setTimeout(() => over !== true && finish(true), 1800); }
      }
    }
    function hurtPlayer(n = 1) {
      if (P.inv > 0) return;
      P.hp -= n; P.inv = 1.1; ctx.sfx.hurt(); a.fx.shake(4, .25);
      a.fx.burst(P.x, P.y, { n: 10, colors: ['#d4e157', '#fff'], speed: 100 });
      if (P.hp <= 0) finish(false);
    }
    function finish(won) {
      if (over === true) return; over = true;
      const title = won ? '¡Receta a salvo!' : mode === 'contrarreloj' ? '¡Tiempo!' : factory <= 0 ? '¡Se robaron la receta!' : '¡Te empalagaron!';
      a.end({ score, won: won || mode === 'contrarreloj', title, extra: { bosses, candies, wave }, summary: `${MODES.find(m => m.id === mode).label}: llegaste a la oleada ${wave} y juntaste ${candies} caramelos.` });
    }

    /* ---------- Actualización ---------- */
    function update(dt) {
      if (screen === 'menu') {
        if (a.hit('up')) { sel = (sel + 2) % 3; ctx.sfx.tick(); }
        if (a.hit('down')) { sel = (sel + 1) % 3; ctx.sfx.tick(); }
        if (a.hit('a')) start(MODES[sel].id);
        return;
      }
      if (over === true) return;
      ctx.hud({ Oleada: wave, Puntos: score, Fábrica: `${Math.max(0, Math.round(factory / 20 * 100))}%`, ...(mode === 'contrarreloj' ? { Tiempo: Math.ceil(timeLeft) } : { Salud: P.hp }) });
      if (mode === 'contrarreloj') { timeLeft -= dt; if (timeLeft <= 0) return finish(false); }
      if (flash > 0) flash -= dt;
      // movimiento
      let mx = (a.down('right') ? 1 : 0) - (a.down('left') ? 1 : 0), my = (a.down('down') ? 1 : 0) - (a.down('up') ? 1 : 0);
      let aim = null;
      for (const s of sticks.values()) {
        const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy);
        if (s.role === 'move' && d > 4) { mx = dx / Math.max(d, 26); my = dy / Math.max(d, 26); }
        if (s.role === 'aim' && d > 6) aim = [dx, dy];
      }
      const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
      P.x = Math.max(10, Math.min(W - 10, P.x + mx * 120 * dt)); P.y = Math.max(30, Math.min(H - 54, P.y + my * 120 * dt));
      if (mx || my) P.walk += dt * 12;
      if (P.inv > 0) P.inv -= dt;
      // apuntar y lanzar
      fireT -= dt;
      if (mouse?.down) aim = [mouse.x - P.x, mouse.y - P.y];
      if (!aim && a.down('a')) { const t = nearest(); if (t) aim = [t.x - P.x, t.y - P.y]; }
      if (aim) { P.aimX = aim[0]; P.aimY = aim[1]; P.dir = aim[0] < 0 ? -1 : 1; fire(aim[0], aim[1]); }
      else if (mouse) { P.aimX = mouse.x - P.x; P.aimY = mouse.y - P.y; P.dir = P.aimX < 0 ? -1 : 1; }
      else if (mx) P.dir = mx < 0 ? -1 : 1;
      if (a.hit('b')) chocoBomb();
      if (weaponT > 0 && (weaponT -= dt) <= 0) { weapon = 'gomitas'; a.fx.text(P.x, P.y - 18, 'Lanzador de gomitas', '#06d6a0', 10); }

      // oleadas
      if (betweenT > 0) { betweenT -= dt; if (betweenT <= 0) nextWave(); }
      else if (waveQueue.length) { spawnT -= dt; if (spawnT <= 0) { spawnFoe(waveQueue.shift()); spawnT = Math.max(.25, 1.1 - wave * .06); } }
      else if (!foes.length && !boss) {
        if (mode === 'oleadas' && wave >= 10) { if (!over) { over = 'winning'; setTimeout(() => finish(true), 600); } }
        else { betweenT = 2; score += 200 * wave; ctx.sfx.fanfare(); if (mode !== 'contrarreloj') a.banner(`¡Oleada ${wave} superada!`, `+${200 * wave}`, 1.4); }
      }
      if (mode === 'contrarreloj' && waveQueue.length < 3) for (let i = 0; i < 4; i++) waveQueue.push(['limon', 'gotita', 'agrio', 'gotita', 'pomelo'][Math.floor(Math.random() * (wave > 2 ? 5 : 3))]);

      // proyectiles propios
      for (const s of shots) {
        s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) s.life = 0;
        for (const f of foes) {
          if (f.dead || s.life <= 0 || s.hitSet?.has(f)) continue;
          if (Math.hypot(f.x - s.x, f.y - s.y) < f.r + s.r) {
            hit(f, s.dmg);
            if (s.trap) f.slow = 2.5;
            if (s.push) { const d = Math.hypot(s.vx, s.vy); f.kb.x += s.vx / d * s.push; f.kb.y += s.vy / d * s.push; }
            if (s.pierce) { (s.hitSet ||= new Set()).add(f); if (--s.pierce <= 0) s.life = 0; } else s.life = 0;
            a.fx.burst(s.x, s.y, { n: 3, colors: [WEAPONS[s.kind].color, '#fff'], speed: 60, life: .3 });
          }
        }
        if (boss && s.life > 0 && !boss.enter && Math.hypot(boss.x - s.x, boss.y - s.y) < boss.r + s.r) { hitBoss(s.dmg); s.life = 0; }
      }
      shots = shots.filter(s => s.life > 0);

      // enemigos
      for (const f of foes) {
        if (f.dead) continue;
        f.t += dt; if (f.slow > 0) f.slow -= dt;
        const def = FOES[f.type];
        let tx = FX, ty = FY;
        if (def.target === 'jugador' || (def.target === 'distancia')) { tx = P.x; ty = P.y; }
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
        let sp = f.sp * (f.slow > 0 ? .35 : 1);
        if (def.target === 'distancia' && d < 110) sp = -sp * .6;
        f.x += (dx / d * sp + f.kb.x) * dt; f.y += (dy / d * sp + f.kb.y) * dt;
        f.kb.x *= .9; f.kb.y *= .9;
        if (f.type === 'agrio') { f.shootT -= dt; if (f.shootT <= 0) { f.shootT = 2.4 - Math.min(1.2, wave * .08); const ang = Math.atan2(P.y - f.y, P.x - f.x); acid.push({ x: f.x, y: f.y, vx: Math.cos(ang) * 90, vy: Math.sin(ang) * 90, life: 4 }); ctx.sfx.shoot(5); } }
        if (Math.hypot(f.x - P.x, f.y - P.y) < f.r + 8) { hurtPlayer(); f.kb.x -= dx / d * 120; f.kb.y -= dy / d * 120; }
        if (Math.hypot(f.x - FX, f.y - FY) < f.r + 22) {
          f.dead = true; factory -= f.type === 'pomelo' ? 4 : 2; ctx.sfx.bonk(); a.fx.shake(3, .2);
          a.fx.text(FX, FY - 30, '¡Están robando la receta!', '#ff8fa8', 11);
          if (factory <= 0) { factory = 0; return finish(false); }
        }
      }
      foes = foes.filter(f => !f.dead);
      // jefe
      if (boss) updateBoss(dt);
      // ácido enemigo
      for (const p of acid) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (Math.hypot(p.x - P.x, p.y - P.y) < 9) { hurtPlayer(); p.life = 0; } }
      acid = acid.filter(p => p.life > 0 && p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20);
      // objetos
      for (const o of drops) {
        o.t += dt;
        const d = Math.hypot(o.x - P.x, o.y - P.y);
        if (o.kind === 'caramelo' && d < 46) { o.x += (P.x - o.x) * dt * 6; o.y += (P.y - o.y) * dt * 6; }
        if (d < 14) {
          o.got = true;
          if (o.kind === 'caramelo') { candies++; score += 10; ctx.sfx.coin(); }
          if (o.kind === 'caja') { weapon = o.weapon; weaponT = 20; ctx.sfx.powerup(); a.banner(WEAPONS[o.weapon].name, '20 segundos', 1.1); }
          if (o.kind === 'bomba') { bombs = Math.min(5, bombs + 1); ctx.sfx.powerup(); a.fx.text(P.x, P.y - 16, '+1 bomba de chocolate', '#ffd166', 10); }
          if (o.kind === 'corazon') { P.hp = Math.min(5, P.hp + 1); ctx.sfx.powerup(); }
        }
        if (o.kind !== 'caramelo' && o.t > 12) o.got = true;
      }
      drops = drops.filter(o => !o.got);
    }
    function nearest() {
      let best = null, bd = 1e9;
      for (const f of foes) { const d = Math.hypot(f.x - P.x, f.y - P.y); if (d < bd) { bd = d; best = f; } }
      if (boss && !boss.enter) { const d = Math.hypot(boss.x - P.x, boss.y - P.y); if (d < bd) best = boss; }
      return best;
    }
    function updateBoss(dt) {
      const b = boss; b.t += dt; if (b.flash > 0) b.flash -= dt;
      if (b.enter) { b.y += 40 * dt; if (b.y >= 70) b.enter = false; return; }
      const rage = b.hp < b.max / 2;
      b.x = FX + Math.sin(b.t * (rage ? .9 : .6)) * 120; b.y = 70 + Math.sin(b.t * 1.3) * 18;
      b.shootT -= dt;
      if (b.shootT <= 0) {
        b.shootT = rage ? 1.1 : 1.7;
        const n = rage ? 14 : 10, off = b.t;
        for (let k = 0; k < n; k++) { const an = off + k / n * Math.PI * 2; acid.push({ x: b.x, y: b.y, vx: Math.cos(an) * 80, vy: Math.sin(an) * 80, life: 4 }); }
        ctx.sfx.shoot(6);
      }
      b.summonT -= dt;
      if (b.summonT <= 0) { b.summonT = rage ? 4 : 6; for (let k = 0; k < 3; k++) { spawnFoe('gotita'); const f = foes[foes.length - 1]; f.x = b.x; f.y = b.y + 20; } }
      if (Math.hypot(b.x - P.x, b.y - P.y) < b.r + 8) hurtPlayer();
    }

    /* ---------- Entrada táctil y mouse ---------- */
    function onPointer(type, x, y, e) {
      if (screen === 'menu') {
        if (type !== 'down') return;
        MODES.forEach((m, i) => { const by = 96 + i * 52; if (y > by && y < by + 44 && x > 50 && x < W - 50) { sel = i; start(m.id); } });
        return;
      }
      if (e.pointerType === 'mouse') {
        mouse = mouse || { x, y, down: false };
        mouse.x = x; mouse.y = y;
        if (type === 'down') mouse.down = true; if (type === 'up' || type === 'cancel') mouse.down = false;
        return;
      }
      if (type === 'down') sticks.set(e.pointerId, { role: x < W / 2 ? 'move' : 'aim', ox: x, oy: y, x, y });
      else if (type === 'move') { const s = sticks.get(e.pointerId); if (s) { s.x = x; s.y = y; } }
      else sticks.delete(e.pointerId);
    }

    /* ---------- Dibujo ---------- */
    function drawFoe(g, f) {
      const def = FOES[f.type], wob = Math.sin(f.t * 8) * 1.2;
      g.save(); g.translate(f.x, f.y);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, f.r * .9, f.r * .9, 3, 0, 0, 7); g.fill();
      g.fillStyle = f.slow > 0 ? '#bfe9ff' : def.color;
      if (f.type === 'limon') { g.beginPath(); g.ellipse(0, 0, f.r + 1, f.r - 1 + wob * .3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(f.r, 0, 3, 2, 0, 0, 7); g.ellipse(-f.r, 0, 3, 2, 0, 0, 7); g.fill(); }
      else if (f.type === 'gotita') { g.beginPath(); g.moveTo(0, -f.r - 4); g.quadraticCurveTo(f.r, 0, 0, f.r); g.quadraticCurveTo(-f.r, 0, 0, -f.r - 4); g.fill(); }
      else if (f.type === 'pomelo') { g.beginPath(); g.arc(0, 0, f.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(k) * f.r * .8, Math.sin(k) * f.r * .8); g.stroke(); } }
      else { g.beginPath(); g.arc(0, 0, f.r, 0, 7); g.fill(); g.fillStyle = '#7a8a1f'; g.fillRect(-3, -f.r - 5, 6, 6); }
      if (f.slow > 0) { g.strokeStyle = 'rgba(122,224,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, f.r + 4, 0, 7); g.stroke(); }
      // cara agria
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-3, -2, 2.6, 0, 7); g.arc(3, -2, 2.6, 0, 7); g.fill();
      g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(-3, -1.5, 1.2, 0, 7); g.arc(3, -1.5, 1.2, 0, 7); g.fill();
      g.strokeStyle = '#3b1f2b'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-6, -6); g.lineTo(-1.5, -4.5); g.moveTo(6, -6); g.lineTo(1.5, -4.5); g.stroke();
      g.beginPath(); g.moveTo(-3, 4); g.quadraticCurveTo(0, 2, 3, 4); g.stroke();
      if (f.hp < f.max) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-8, -f.r - 8, 16, 2.5); g.fillStyle = '#06d6a0'; g.fillRect(-8, -f.r - 8, 16 * Math.max(0, f.hp / f.max), 2.5); }
      g.restore();
    }
    function drawBoss(g, b) {
      g.save(); g.translate(b.x, b.y);
      const sq = 1 + Math.sin(b.t * 6) * .04;
      g.scale(sq, 1 / sq);
      g.fillStyle = b.flash > 0 ? '#fff' : '#f1e05a';
      g.beginPath(); g.ellipse(0, 0, b.r + 6, b.r, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(b.r + 6, 0, 6, 4, 0, 0, 7); g.ellipse(-b.r - 6, 0, 6, 4, 0, 0, 7); g.fill();
      g.fillStyle = '#2d9b46'; g.beginPath(); g.ellipse(4, -b.r - 4, 9, 4, -.4, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-10, -4, 7, 0, 7); g.arc(10, -4, 7, 0, 7); g.fill();
      g.fillStyle = '#3b1f2b'; const lx = Math.sign(P.x - b.x) * 2; g.beginPath(); g.arc(-10 + lx, -3, 3.4, 0, 7); g.arc(10 + lx, -3, 3.4, 0, 7); g.fill();
      g.strokeStyle = '#3b1f2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-18, -14); g.lineTo(-5, -10); g.moveTo(18, -14); g.lineTo(5, -10); g.stroke();
      g.beginPath(); g.moveTo(-10, 12); g.quadraticCurveTo(0, 6, 10, 12); g.stroke();
      g.restore();
      roundRect(g, W / 2 - 80, 8, 160, 8, 4); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      roundRect(g, W / 2 - 80, 8, 160 * Math.max(0, b.hp / b.max), 8, 4); g.fillStyle = '#d4e157'; g.fill();
      g.fillStyle = '#fff'; g.font = `700 9px ${FONT}`; g.textAlign = 'center'; g.fillText('Gran Limón Ácido', W / 2, 24);
    }
    function draw(g) {
      if (screen === 'menu') {
        const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#3b4a2a'); grd.addColorStop(1, '#1f2a14'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#ffd166'; g.font = `700 24px ${FONT}`; g.fillText('Candy of Bongi', W / 2, 36);
        g.fillStyle = '#f6dbe3'; g.font = `600 12px ${FONT}`; g.fillText('Operación Dulce: los Ácidos quieren la receta del chocolate', W / 2, 62);
        MODES.forEach((m, i) => {
          const by = 96 + i * 52; roundRect(g, 50, by, W - 100, 44, 12); g.fillStyle = i === sel ? '#ffd166' : 'rgba(255,255,255,.1)'; g.fill();
          g.fillStyle = i === sel ? '#3b1f2b' : '#fff'; g.font = `700 14px ${FONT}`; g.fillText(m.label, W / 2, by + 16);
          g.font = `600 10px ${FONT}`; g.fillStyle = i === sel ? '#5b2d1f' : '#f6dbe3'; g.fillText(m.sub, W / 2, by + 32);
        });
        drawBongi(g, 30, 270, 16, { t: a.time, walk: a.time * 4, mood: 'happy' });
        return;
      }
      // piso de la fábrica
      g.fillStyle = '#e9d5c4'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 24) for (let x = (y / 24) % 2 * 24; x < W; x += 48) { g.fillStyle = '#e0c7b3'; g.fillRect(x, y, 24, 24); }
      g.fillStyle = 'rgba(122,62,43,.12)'; g.fillRect(0, FY - 50, W, 6);
      // fábrica con la receta
      g.save(); g.translate(FX, FY);
      roundRect(g, -40, -24, 80, 40, 8); g.fillStyle = '#ef476f'; g.fill();
      g.fillStyle = '#c41e4a'; g.beginPath(); g.moveTo(-46, -22); g.lineTo(0, -46); g.lineTo(46, -22); g.fill();
      g.fillStyle = '#ffd166'; g.fillRect(-9, -6, 18, 22); g.fillStyle = '#fff'; g.font = `700 8px ${FONT}`; g.textAlign = 'center'; g.fillText('RECETA', 0, -30);
      g.restore();
      roundRect(g, FX - 40, FY + 20, 80, 5, 2.5); g.fillStyle = 'rgba(0,0,0,.2)'; g.fill();
      roundRect(g, FX - 40, FY + 20, 80 * factory / 20, 5, 2.5); g.fillStyle = factory > 8 ? '#06d6a0' : '#ef476f'; g.fill();
      // objetos
      for (const o of drops) {
        const bob = Math.sin(o.t * 5) * 1.5;
        if (o.kind === 'caramelo') { g.fillStyle = ['#ef476f', '#ffd166', '#06d6a0', '#7ae0ff'][Math.floor(o.x) % 4]; g.beginPath(); g.ellipse(o.x, o.y + bob, 4, 3.2, 0, 0, 7); g.fill(); continue; }
        if (o.kind === 'corazon') { g.fillStyle = '#ef476f'; g.font = `700 14px ${FONT}`; g.textAlign = 'center'; g.fillText('♥', o.x, o.y + bob); continue; }
        roundRect(g, o.x - 8, o.y - 8 + bob, 16, 16, 4); g.fillStyle = o.kind === 'bomba' ? '#5b2d1f' : WEAPONS[o.weapon].color; g.fill(); g.strokeStyle = '#3b1f2b'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = o.kind === 'bomba' ? '#ffd166' : '#3b1f2b'; g.font = `700 9px ${FONT}`; g.textAlign = 'center'; g.fillText(o.kind === 'bomba' ? '✸' : '★', o.x, o.y + 1 + bob);
      }
      for (const f of foes) drawFoe(g, f);
      if (boss) drawBoss(g, boss);
      // ácido enemigo
      for (const p of acid) { g.fillStyle = '#c0ca33'; g.beginPath(); g.arc(p.x, p.y, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(p.x - 1, p.y - 1, 1.3, 0, 7); g.fill(); }
      // golosinas lanzadas
      for (const s of shots) {
        if (s.kind === 'burbujas') { g.strokeStyle = 'rgba(122,224,255,.95)'; g.lineWidth = 1.5; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(s.x - 2, s.y - 2, 2, 0, 7); g.fill(); continue; }
        if (s.kind === 'chupetines') { g.save(); g.translate(s.x, s.y); g.rotate(Math.atan2(s.vy, s.vx)); g.fillStyle = '#f3e6d8'; g.fillRect(-10, -1, 8, 2); g.fillStyle = '#ff6b35'; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fill(); g.strokeStyle = '#ffd166'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 2.4, 0, 5); g.stroke(); g.restore(); continue; }
        if (s.kind === 'crema') { g.globalAlpha = Math.min(1, s.life * 3); g.fillStyle = '#fff3e0'; g.beginPath(); g.arc(s.x, s.y, s.r * (1.3 - s.life), 0, 7); g.fill(); g.globalAlpha = 1; continue; }
        g.fillStyle = s.color || WEAPONS[s.kind].color; g.beginPath(); g.ellipse(s.x, s.y, s.r + 1, s.r, Math.atan2(s.vy, s.vx), 0, 7); g.fill();
      }
      // Bongi con su lanzador
      if (!(P.inv > 0 && Math.floor(P.inv * 12) % 2)) {
        drawBongi(g, P.x, P.y, 15, { dir: P.dir, walk: P.walk, mood: P.hp <= 1 ? 'hurt' : 'ok' });
        const ang = Math.atan2(P.aimY, P.aimX); g.save(); g.translate(P.x, P.y + 2); g.rotate(ang);
        roundRect(g, 4, -3, 14, 6, 3); g.fillStyle = WEAPONS[weapon].color; g.fill(); g.strokeStyle = '#3b1f2b'; g.lineWidth = 1.2; g.stroke(); g.restore();
      }
      // palancas táctiles
      for (const s of sticks.values()) {
        g.globalAlpha = .35; g.strokeStyle = '#3b1f2b'; g.lineWidth = 2; g.beginPath(); g.arc(s.ox, s.oy, 26, 0, 7); g.stroke();
        g.fillStyle = s.role === 'aim' ? '#ef476f' : '#06d6a0'; const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.min(26, Math.hypot(dx, dy)), an = Math.atan2(dy, dx);
        g.beginPath(); g.arc(s.ox + Math.cos(an) * d, s.oy + Math.sin(an) * d, 11, 0, 7); g.fill(); g.globalAlpha = 1;
      }
      // marcador
      g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `700 11px ${FONT}`;
      g.fillStyle = '#3b1f2b'; g.fillText(`${'♥'.repeat(Math.max(0, P.hp))}   ✸${bombs}   ${WEAPONS[weapon].name}${weaponT > 0 ? ` ${Math.ceil(weaponT)} s` : ''}`, 8, H - 10);
      g.textAlign = 'right'; g.fillText(mode === 'contrarreloj' ? `${Math.ceil(timeLeft)} s · ${score}` : `Oleada ${wave} · ${score}`, W - 8, H - 10);
      if (!sticks.size && !mouse && a.time < 6) { g.textAlign = 'center'; g.fillStyle = 'rgba(59,31,43,.7)'; g.font = `600 10px ${FONT}`; g.fillText('Celular: palanca izquierda para moverte, derecha para lanzar', W / 2, 40); }
      if (flash > 0) { g.globalAlpha = flash; g.fillStyle = '#7a3e2b'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Arena de Candy of Bongi', update, draw, onPointer,
      controls: { buttons: [{ id: 'a', label: 'Auto' }, { id: 'b', label: 'Bomba' }] },
      help: ['Celular: tocá la mitad izquierda para moverte y la derecha para apuntar y lanzar.', 'Teclado y mouse: WASD o flechas para moverte, apuntá con el mouse y hacé clic para lanzar.', 'Espacio o Auto: lanza al ácido más cercano. X o Bomba: bomba de chocolate.']
    });
    root._debug = {
      get state() { return { screen, mode, wave, score, hp: P?.hp, factory, foes: foes.length, boss: !!boss, weapon, candies, over }; },
      start, skipTo(w) { wave = w - 1; foes = []; waveQueue = []; boss = null; betweenT = 0; nextWave(); },
      killAll() { for (const f of foes) hit(f, 999); if (boss) hitBoss(9999); waveQueue = []; },
      god() { P.hp = 999; }
    };
    if (ctx.again && data.lastMode != null) start(MODES[data.lastMode].id);
    a.start();
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
