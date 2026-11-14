// BOMBI BONGI — Aventura explosiva.
// Laberinto de bloques, bombas de caramelo en cruz con reacciones en cadena, poderes ocultos,
// golosinas escondidas, tres tipos de enemigos, portal que se abre al vencerlos, vidas y reloj.
import { arcade, FONT, roundRect, drawBongi } from '../core/arcade.js?v=cfab42284a';

const C = 15, R = 13, T = 20, TOP = 24, W = C * T, H = R * T + TOP;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const THEMES = [
  { name: 'Fábrica de Chocolates', floor: '#c98b6b', alt: '#bf8060', wall: '#4a2318', soft: '#ff8fb1', softLine: '#fff' },
  { name: 'Cavernas de Caramelo', floor: '#f2c27a', alt: '#e9b56a', wall: '#7a4a1f', soft: '#ffd166', softLine: '#c98a00' },
  { name: 'Laberinto de Gomitas', floor: '#a9e4c8', alt: '#9adbbd', wall: '#2f6b4f', soft: '#06d6a0', softLine: '#e6fff5' }
];
const POWERS = {
  rango: { label: '✚', color: '#ff6b35', name: 'Explosión más larga' },
  bomba: { label: '●', color: '#3b1f2b', name: 'Bomba adicional' },
  veloz: { label: '»', color: '#06d6a0', name: 'Más velocidad' },
  escudo: { label: '◈', color: '#7ae0ff', name: 'Escudo protector' },
  especial: { label: '✦', color: '#c9a0ff', name: 'Bomba especial: atraviesa bloques' },
  remoto: { label: '⚡', color: '#ef476f', name: 'Caramelo explosivo: Boom detona' }
};

export default {
  mount(root, ctx) {
    let level = 1, lives = 3, score = 0, cleared = 0, candies = 0;
    let map, under, bombs = [], flames = [], foes = [], items = [], P, timeLeft, phase = 'play', phaseT = 0, exit, theme;
    let stats = { range: 1, max: 1, speed: 0, pierce: false, remote: false };

    function buildLevel() {
      theme = THEMES[(level - 1) % THEMES.length];
      map = []; under = {};
      for (let y = 0; y < R; y++) { map[y] = []; for (let x = 0; x < C; x++) map[y][x] = (x === 0 || y === 0 || x === C - 1 || y === R - 1 || (x % 2 === 0 && y % 2 === 0)) ? '#' : ' '; }
      const safe = (x, y) => (x <= 2 && y <= 2);
      const density = Math.min(.68, .48 + level * .03);
      const softs = [];
      for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++) if (map[y][x] === ' ' && !safe(x, y) && Math.random() < density) { map[y][x] = 'S'; softs.push([x, y]); }
      softs.sort(() => Math.random() - .5);
      const far = softs.filter(([x, y]) => x + y > 10);
      exit = { x: far[0][0], y: far[0][1], open: false, found: false };
      under[`${exit.x},${exit.y}`] = 'exit';
      const pool = ['rango', 'bomba', 'veloz', 'rango', 'bomba', 'escudo', 'especial', 'remoto'];
      let k = 1;
      for (let i = 0; i < 3 + Math.min(3, level); i++) under[`${softs[k][0]},${softs[k][1]}`] = pool[(level + i) % pool.length], k++;
      for (let i = 0; i < 6; i++) under[`${softs[k][0]},${softs[k][1]}`] = 'candy', k++;
      // enemigos
      foes = [];
      const free = []; for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++) if (map[y][x] === ' ' && x + y > 8) free.push([x, y]);
      free.sort(() => Math.random() - .5);
      const n = Math.min(8, 2 + level);
      for (let i = 0; i < n && i < free.length; i++) {
        const type = i < 2 ? 'gomita' : level >= 2 && i === 2 ? 'acido' : level >= 3 && i % 3 === 0 ? 'fantasma' : i % 2 ? 'acido' : 'gomita';
        foes.push({ type, x: free[i][0], y: free[i][1], dir: DIRS[Math.floor(Math.random() * 4)], t: Math.random() * 6, dead: 0 });
      }
      bombs = []; flames = []; items = [];
      P = { x: 1 * T + T / 2, y: 1 * T + T / 2, dir: 1, walk: 0, inv: 2, shield: false, dead: 0 };
      timeLeft = 180; phase = 'play';
      a.banner(`Nivel ${level}`, theme.name, 1.8);
      ctx.music(level % 2 ? 'fabrica' : 'bloques');
    }

    const tileOf = v => Math.floor(v / T);
    const blockedFor = (x, y, who) => {
      const c = map[y]?.[x];
      if (c === undefined || c === '#') return true;
      if (c === 'S') return who !== 'fantasma';
      const b = bombs.find(b => b.x === x && b.y === y);
      if (b) return !(who === 'player' && b.passable);
      return false;
    };

    /* ---------- Jugador ---------- */
    function movePlayer(dt) {
      let dx = 0, dy = 0;
      if (a.down('left')) dx = -1; else if (a.down('right')) dx = 1;
      if (a.down('up')) dy = -1; else if (a.down('down')) dy = 1;
      if (dx && dy) { if (Math.abs((P.y % T) - T / 2) > 2) dx = 0; else dy = 0; }
      const sp = (78 + stats.speed * 16) * dt, half = 7;
      const tryMove = (mx, my) => {
        const nx = P.x + mx, ny = P.y + my;
        const x0 = tileOf(nx - half), x1 = tileOf(nx + half - .01), y0 = tileOf(ny - half), y1 = tileOf(ny + half - .01);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (blockedFor(x, y, 'player')) return false;
        P.x = nx; P.y = ny; return true;
      };
      if (dx) {
        if (!tryMove(dx * sp, 0)) {
          // asistencia de esquina: alinear al centro de la fila si está cerca
          const cy = tileOf(P.y) * T + T / 2, off = cy - P.y;
          if (Math.abs(off) < 9 && !blockedFor(tileOf(P.x) + dx, tileOf(P.y), 'player')) tryMove(0, Math.sign(off) * Math.min(Math.abs(off), sp));
        } else { const cy = tileOf(P.y) * T + T / 2; P.y += Math.sign(cy - P.y) * Math.min(Math.abs(cy - P.y), sp * .5); }
        P.dir = dx;
      }
      if (dy) {
        if (!tryMove(0, dy * sp)) {
          const cx = tileOf(P.x) * T + T / 2, off = cx - P.x;
          if (Math.abs(off) < 9 && !blockedFor(tileOf(P.x), tileOf(P.y) + dy, 'player')) tryMove(Math.sign(off) * Math.min(Math.abs(off), sp), 0);
        } else { const cx = tileOf(P.x) * T + T / 2; P.x += Math.sign(cx - P.x) * Math.min(Math.abs(cx - P.x), sp * .5); }
      }
      if (dx || dy) P.walk += dt * 14;
      // las bombas dejan de ser atravesables cuando salís de su casilla
      for (const b of bombs) if (b.passable && (tileOf(P.x - 7) > b.x || tileOf(P.x + 6.9) < b.x || tileOf(P.y - 7) > b.y || tileOf(P.y + 6.9) < b.y)) b.passable = false;
    }

    function placeBomb() {
      const x = tileOf(P.x), y = tileOf(P.y);
      if (bombs.length >= stats.max || bombs.some(b => b.x === x && b.y === y) || map[y][x] !== ' ') return;
      bombs.push({ x, y, t: stats.remote ? Infinity : 2.4, passable: true, range: stats.range, pierce: stats.pierce });
      ctx.sfx.drop();
    }
    function explode(b) {
      bombs = bombs.filter(o => o !== b);
      ctx.sfx.explode(1); a.fx.shake(3, .18);
      const cells = [[b.x, b.y]];
      for (const [dx, dy] of DIRS) {
        for (let i = 1; i <= b.range; i++) {
          const x = b.x + dx * i, y = b.y + dy * i, c = map[y]?.[x];
          if (c === undefined || c === '#') break;
          cells.push([x, y]);
          if (c === 'S') { breakSoft(x, y); if (!b.pierce) break; }
          const other = bombs.find(o => o.x === x && o.y === y); if (other) { other.t = Math.min(other.t, .08); }
          const it = items.find(o => o.x === x && o.y === y && o.kind !== 'exit'); if (it) { it.dead = true; }
        }
      }
      for (const [x, y] of cells) {
        flames.push({ x, y, t: .55, center: x === b.x && y === b.y });
        a.fx.burst(x * T + T / 2, TOP + y * T + T / 2, { n: 4, colors: ['#ffd166', '#ef476f', '#ff8fb1', '#fff'], speed: 90, life: .5 });
      }
    }
    function breakSoft(x, y) {
      map[y][x] = ' '; score += 10;
      a.fx.burst(x * T + T / 2, TOP + y * T + T / 2, { n: 8, colors: [theme.soft, theme.softLine], speed: 110, shape: 'square', size: 2.6 });
      const u = under[`${x},${y}`];
      if (u === 'exit') { exit.found = true; }
      else if (u) items.push({ kind: u, x, y, t: 0, born: .6 });
    }

    function hurt() {
      if (P.inv > 0 || phase !== 'play') return;
      if (P.shield) { P.shield = false; P.inv = 1.6; ctx.sfx.hurt(); return; }
      phase = 'dying'; phaseT = 1.6; lives--; ctx.sfx.hurt(); a.fx.shake(4, .3);
    }

    /* ---------- Enemigos ---------- */
    function bfsStep(fx, fy, tx, ty, maxD = 9) {
      const q = [[fx, fy, null]], seen = new Set([fx + ',' + fy]);
      while (q.length) {
        const [x, y, first] = q.shift();
        if (x === tx && y === ty) return first;
        for (const d of DIRS) {
          const nx = x + d[0], ny = y + d[1];
          if (seen.has(nx + ',' + ny) || blockedFor(nx, ny, 'acido') || Math.abs(nx - fx) + Math.abs(ny - fy) > maxD) continue;
          seen.add(nx + ',' + ny); q.push([nx, ny, first || d]);
        }
      }
      return null;
    }
    function updateFoe(f, dt) {
      f.t += dt;
      if (f.dead) { f.dead += dt; return; }
      const sp = (f.type === 'acido' ? 2.6 : f.type === 'fantasma' ? 1.6 : 1.9) + level * .12;
      // movimiento de casilla en casilla
      if (f.moving) {
        f.p += sp * dt;
        if (f.p >= 1) { f.x += f.dir[0]; f.y += f.dir[1]; f.moving = false; f.p = 0; }
        return;
      }
      let opts = DIRS.filter(d => !blockedFor(f.x + d[0], f.y + d[1], f.type));
      if (!opts.length) return;
      let next = null;
      if (f.type === 'acido') { const px = tileOf(P.x), py = tileOf(P.y); if (Math.abs(px - f.x) + Math.abs(py - f.y) < 8) next = bfsStep(f.x, f.y, px, py); }
      if (!next) {
        const keep = opts.find(d => d === f.dir);
        const noBack = opts.filter(d => !(d[0] === -f.dir[0] && d[1] === -f.dir[1]));
        next = keep && Math.random() < .75 ? keep : (noBack.length ? noBack : opts)[Math.floor(Math.random() * (noBack.length ? noBack.length : opts.length))];
      }
      f.dir = next; f.moving = true; f.p = 0;
    }
    const foePos = f => ({ x: (f.x + (f.moving ? f.dir[0] * f.p : 0)) * T + T / 2, y: (f.y + (f.moving ? f.dir[1] * f.p : 0)) * T + T / 2 });

    /* ---------- Actualización ---------- */
    function update(dt) {
      ctx.hud({ Nivel: level, Vidas: lives, Puntos: score, Tiempo: Math.ceil(timeLeft) });
      if (phase === 'dying') { phaseT -= dt; P.dead += dt; if (phaseT <= 0) { if (lives <= 0) return gameOver(); respawn(); } return; }
      if (phase === 'clear') { phaseT -= dt; if (phaseT <= 0) { level++; cleared++; buildLevel(); } return; }
      timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; P.inv = 0; P.shield = false; hurt(); return; }
      if (P.inv > 0) P.inv -= dt;
      movePlayer(dt);
      if (a.hit('a')) placeBomb();
      if (a.hit('b') && stats.remote && bombs.length) explode(bombs[0]);
      for (const b of [...bombs]) { b.t -= dt; if (b.t <= 0) explode(b); }
      for (const f of flames) f.t -= dt;
      flames = flames.filter(f => f.t > 0);
      const inFlame = (x, y) => flames.some(f => f.x === x && f.y === y);
      if (inFlame(tileOf(P.x), tileOf(P.y))) hurt();
      for (const f of foes) {
        updateFoe(f, dt);
        if (f.dead) continue;
        const p = foePos(f);
        if (inFlame(Math.round((p.x - T / 2) / T), Math.round((p.y - T / 2) / T))) {
          f.dead = .01; const pts = { gomita: 100, acido: 200, fantasma: 400 }[f.type]; score += pts;
          ctx.sfx.stomp(); a.fx.text(p.x, TOP + p.y, `+${pts}`, '#ffd166', 12); a.fx.burst(p.x, TOP + p.y, { n: 14, speed: 120 });
          continue;
        }
        if (Math.hypot(p.x - P.x, p.y - P.y) < 13) hurt();
      }
      foes = foes.filter(f => !f.dead || f.dead < .6);
      // portal
      const alive = foes.filter(f => !f.dead).length;
      if (exit.found && !alive && !exit.open) { exit.open = true; ctx.sfx.powerup(); a.banner('¡El portal se abrió!', 'Llegá hasta él', 1.4); }
      // objetos
      for (const it of items) {
        it.t += dt; if (it.born > 0) it.born -= dt;
        if (it.dead || it.born > 0) continue;
        if (tileOf(P.x) === it.x && tileOf(P.y) === it.y) {
          it.dead = true;
          if (it.kind === 'candy') { score += 50; candies++; ctx.sfx.coin(); a.fx.text(P.x, TOP + P.y - 10, '+50', '#ffd166', 11); continue; }
          ctx.sfx.powerup(); a.banner(POWERS[it.kind].name, '', 1.1);
          if (it.kind === 'rango') stats.range = Math.min(6, stats.range + 1);
          if (it.kind === 'bomba') stats.max = Math.min(6, stats.max + 1);
          if (it.kind === 'veloz') stats.speed = Math.min(4, stats.speed + 1);
          if (it.kind === 'escudo') P.shield = true;
          if (it.kind === 'especial') stats.pierce = true;
          if (it.kind === 'remoto') stats.remote = true;
        }
      }
      items = items.filter(i => !i.dead);
      if (exit.open && tileOf(P.x) === exit.x && tileOf(P.y) === exit.y) {
        phase = 'clear'; phaseT = 2; const bonus = 1000 + Math.ceil(timeLeft) * 5; score += bonus;
        ctx.sfx.fanfare(); a.banner(`¡Nivel ${level} superado!`, `+${bonus} puntos`, 1.8); a.fx.burst(P.x, TOP + P.y, { n: 40, speed: 200 });
      }
    }
    function respawn() {
      P = { x: T * 1.5, y: T * 1.5, dir: 1, walk: 0, inv: 2.5, shield: false, dead: 0 };
      bombs = []; flames = []; phase = 'play'; timeLeft = Math.max(timeLeft, 60);
      // despejar enemigos cerca del inicio
      for (const f of foes) if (f.x + f.y < 5) { f.x = C - 2; f.y = R - 2; f.moving = false; }
    }
    function gameOver() {
      phase = 'over';
      a.end({ score, won: cleared > 0, title: cleared >= 3 ? '¡Dinamita de caramelo!' : cleared ? '¡Bien explotado!' : '¡Kaboom!', extra: { cleared, candies }, summary: `Superaste ${cleared} ${cleared === 1 ? 'nivel' : 'niveles'} y encontraste ${candies} golosinas escondidas.` });
    }

    /* ---------- Dibujo ---------- */
    function drawFoe(g, f) {
      const p = foePos(f), x = p.x, y = TOP + p.y, wob = Math.sin(f.t * 8) * 1.2;
      g.save(); g.translate(x, y);
      if (f.dead) { g.globalAlpha = 1 - f.dead / .6; g.scale(1 + f.dead, 1 - f.dead); }
      if (f.type === 'gomita') { g.fillStyle = '#e63946'; g.beginPath(); g.arc(-4, -7, 3, 0, 7); g.arc(4, -7, 3, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 1, 7.5, 7 + wob * .3, 0, 0, 7); g.fill(); }
      else if (f.type === 'acido') { g.fillStyle = '#d4e157'; g.beginPath(); for (let k = 0; k < 10; k++) { const an = k / 10 * Math.PI * 2, rr = k % 2 ? 6 : 9; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr + wob * .3); } g.fill(); }
      else { g.globalAlpha *= .8; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -2, 7, Math.PI, 0); g.lineTo(7, 6); g.quadraticCurveTo(3.5, 3 + wob, 0, 6); g.quadraticCurveTo(-3.5, 3 - wob, -7, 6); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-3, -1, 2.4, 0, 7); g.arc(3, -1, 2.4, 0, 7); g.fill();
      g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(-3 + f.dir[0], -1 + f.dir[1], 1.2, 0, 7); g.arc(3 + f.dir[0], -1 + f.dir[1], 1.2, 0, 7); g.fill();
      g.restore();
    }
    function draw(g) {
      g.fillStyle = '#2b1420'; g.fillRect(0, 0, W, H);
      g.textBaseline = 'middle'; g.font = `700 11px ${FONT}`; g.textAlign = 'left'; g.fillStyle = '#ffd166'; g.fillText(`Puntos ${score}`, 6, 12);
      g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(`${Math.ceil(timeLeft)} s`, W / 2, 12);
      g.textAlign = 'right'; g.fillStyle = '#ff8fb1'; g.fillText(`${'♥'.repeat(Math.max(0, lives))}  ✚${stats.range} ●${stats.max}${stats.remote ? ' ⚡' : ''}${stats.pierce ? ' ✦' : ''}`, W - 6, 12);
      g.save(); g.translate(0, TOP);
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const c = map[y][x], px = x * T, py = y * T;
        g.fillStyle = (x + y) % 2 ? theme.floor : theme.alt; g.fillRect(px, py, T, T);
        if (c === '#') { roundRect(g, px + 1, py + 1, T - 2, T - 2, 4); g.fillStyle = theme.wall; g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px + 3, py + 3, T - 6, 3); }
        if (c === 'S') { roundRect(g, px + 1.5, py + 1.5, T - 3, T - 3, 6); g.fillStyle = theme.soft; g.fill(); g.strokeStyle = theme.softLine; g.globalAlpha = .6; g.lineWidth = 2; g.beginPath(); g.moveTo(px + 5, py + 7); g.lineTo(px + 15, py + 7); g.moveTo(px + 5, py + 13); g.lineTo(px + 15, py + 13); g.stroke(); g.globalAlpha = 1; }
      }
      // portal
      if (exit.found) {
        const cx = exit.x * T + T / 2, cy = exit.y * T + T / 2;
        g.save(); g.translate(cx, cy); g.rotate(a.time * (exit.open ? 3 : .6));
        for (let k = 0; k < 6; k++) { g.fillStyle = exit.open ? ['#ef476f', '#ffd166', '#06d6a0'][k % 3] : 'rgba(59,31,43,.5)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 8, k * Math.PI / 3, (k + 1) * Math.PI / 3); g.fill(); }
        g.restore(); if (!exit.open) { g.fillStyle = '#fff'; g.font = `700 8px ${FONT}`; g.textAlign = 'center'; g.fillText('🔒', cx, cy + 1); }
      }
      // objetos
      for (const it of items) {
        const cx = it.x * T + T / 2, cy = it.y * T + T / 2 + Math.sin(it.t * 5) * 1.5;
        if (it.kind === 'candy') { g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(cx - 9, cy - 4); g.lineTo(cx - 5, cy); g.lineTo(cx - 9, cy + 4); g.fill(); g.beginPath(); g.moveTo(cx + 9, cy - 4); g.lineTo(cx + 5, cy); g.lineTo(cx + 9, cy + 4); g.fill(); g.fillStyle = '#ef476f'; g.beginPath(); g.ellipse(cx, cy, 6, 5, 0, 0, 7); g.fill(); continue; }
        const pw = POWERS[it.kind]; roundRect(g, cx - 8, cy - 8, 16, 16, 5); g.fillStyle = pw.color; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#fff'; g.font = `700 10px ${FONT}`; g.textAlign = 'center'; g.fillText(pw.label, cx, cy + 1);
      }
      // bombas de caramelo
      for (const b of bombs) {
        const cx = b.x * T + T / 2, cy = b.y * T + T / 2, pulse = 1 + Math.sin(a.time * (b.t < .8 ? 30 : 10)) * .08;
        g.save(); g.translate(cx, cy); g.scale(pulse, pulse);
        g.fillStyle = b.pierce ? '#7a3eb0' : '#3b1f2b'; g.beginPath(); g.arc(0, 1, 7.5, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-2.5, -1.5, 2.2, 0, 7); g.fill();
        g.strokeStyle = '#ffd166'; g.lineWidth = 2; g.beginPath(); g.moveTo(1, -6); g.quadraticCurveTo(4, -10, 7, -9); g.stroke();
        g.fillStyle = Math.random() < .5 ? '#ff6b35' : '#ffd166'; g.beginPath(); g.arc(7, -9, 2, 0, 7); g.fill();
        if (b.t === Infinity) { g.fillStyle = '#ef476f'; g.font = `700 7px ${FONT}`; g.textAlign = 'center'; g.fillText('⚡', 0, 2); }
        g.restore();
      }
      // llamas de confites
      for (const f of flames) {
        const k = f.t / .55, px = f.x * T, py = f.y * T;
        g.globalAlpha = Math.min(1, k * 1.6);
        roundRect(g, px + 2, py + 2, T - 4, T - 4, 7); g.fillStyle = f.center ? '#fff3c4' : '#ffd166'; g.fill();
        g.fillStyle = '#ef476f'; g.beginPath(); g.arc(px + T / 2, py + T / 2, 5 * k + 2, 0, 7); g.fill();
        g.globalAlpha = 1;
      }
      g.restore();
      for (const f of foes) drawFoe(g, f);
      // Bongi
      if (!(P.inv > 0 && phase === 'play' && Math.floor(P.inv * 12) % 2)) {
        if (phase === 'dying') { g.save(); g.translate(P.x, TOP + P.y); g.rotate(P.dead * 7); const s = Math.max(.05, 1 - P.dead / 1.5); g.scale(s, s); drawBongi(g, 0, 0, 14, { mood: 'hurt' }); g.restore(); }
        else {
          if (P.shield) { g.strokeStyle = 'rgba(122,224,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(P.x, TOP + P.y - 1, 12, 0, 7); g.stroke(); }
          drawBongi(g, P.x, TOP + P.y - 2, 13, { dir: P.dir, walk: P.walk, mood: phase === 'clear' ? 'happy' : 'ok' });
        }
      }
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Laberinto de Bombi Bongi', update, draw,
      controls: { dirs: 'all', buttons: [{ id: 'b', label: 'Boom' }, { id: 'a', label: 'Bomba' }] },
      help: ['Flechas o la cruz para moverte. Bomba (Espacio) pone una bomba de caramelo.', 'La explosión va en cruz: alejate y esperá a que estalle.', 'Con el Caramelo explosivo, las bombas no explotan solas: tocá Boom (X).', 'El portal se abre cuando no queda ningún enemigo.']
    });
    root._debug = {
      get state() { return { level, lives, score, cleared, foes: foes.filter(f => !f.dead).length, exit: { ...exit }, phase, bombs: bombs.length }; },
      bomb: () => placeBomb(),
      win() { foes.forEach(f => (f.dead = .01)); exit.found = true; map[exit.y][exit.x] = ' '; P.x = exit.x * T + T / 2; P.y = exit.y * T + T / 2; }
    };
    buildLevel();
    a.start();
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
