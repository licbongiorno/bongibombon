// BONGI MAZE — El laberinto dulce.
// Laberintos originales generados por nivel (simétricos, sin callejones sin salida),
// cuatro enemigos con personalidades distintas, Bombón dorado, pasadizos laterales y bonus.
import { arcade, FONT, roundRect, drawBongi } from '../core/arcade.js?v=cfab42284a';
import { candyImage, preload } from '../../candies.js?v=cfab42284a';

const C = 19, R = 21, T = 16, TOP = 26, W = C * T, H = R * T + TOP;
const TUNNEL = 10, DOOR = { x: 9, y: 8 }, HOUSE = { x: 9, y: 10 }, EXIT = { x: 9, y: 7 }, START = { x: 9, y: 15 };
const DIRS = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }];
const KEYDIR = { up: DIRS[0], left: DIRS[1], down: DIRS[2], right: DIRS[3] };
const WALLS = ['#7ae0ff', '#ff8fb1', '#06d6a0', '#ffd166', '#c9a0ff'];
const BONUS = ['alfajor', 'chocolate', 'chupetin', 'malvavisco', 'paleta'];
const ENEMIES = [
  { name: 'Choco', color: '#7a3e2b', corner: { x: 17, y: -2 }, release: 0 },
  { name: 'Gomi', color: '#06d6a0', corner: { x: 1, y: -2 }, release: 2.5 },
  { name: 'Ácido', color: '#d4e157', corner: { x: 1, y: 22 }, release: 6 },
  { name: 'Azuquita', color: '#ffffff', corner: { x: 17, y: 22 }, release: 9 }
];

function generate(seed) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = Array.from({ length: R }, () => Array(C).fill('#'));
  // DFS en la mitad izquierda (celdas impares) y espejo
  const cells = []; for (let y = 1; y < R - 1; y += 2) for (let x = 1; x <= 9; x += 2) cells.push([x, y]);
  const seen = new Set(), stack = [[1, 1]]; seen.add('1,1'); g[1][1] = ' ';
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([nx, ny]) => nx >= 1 && nx <= 9 && ny >= 1 && ny < R - 1 && !seen.has(nx + ',' + ny));
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[Math.floor(rnd() * nb.length)];
    g[y + dy / 2][x + dx / 2] = ' '; g[ny][nx] = ' '; seen.add(nx + ',' + ny); stack.push([nx, ny]);
  }
  // abrir callejones sin salida y sumar algunos atajos
  for (let pass = 0; pass < 2; pass++) for (const [x, y] of cells) {
    const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => g[y + dy]?.[x + dx] === ' ');
    if (open.length <= 1 || (pass === 1 && rnd() < .12)) {
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const nx = x + dx * 2, ny = y + dy * 2; return nx >= 1 && nx <= 9 && ny >= 1 && ny < R - 1 && g[y + dy][x + dx] === '#'; });
      if (opts.length) { const [dx, dy] = opts[Math.floor(rnd() * opts.length)]; g[y + dy][x + dx] = ' '; }
    }
  }
  // espejo horizontal
  for (let y = 0; y < R; y++) for (let x = 10; x < C; x++) g[y][x] = g[y][C - 1 - x];
  // zona central: anillo exterior, anillo interior con la casa y pasadizos laterales
  for (let y = 5; y <= 15; y++) for (let x = 3; x <= 15; x++) g[y][x] = '#';
  for (let y = 5; y <= 15; y++) for (let x = 3; x <= 15; x++) {
    if (y === 5 || y === 15 || x === 3 || x === 15) g[y][x] = ' ';
    if ((y === 7 || y === 13) && x >= 5 && x <= 13) g[y][x] = ' ';
    if ((x === 5 || x === 13) && y >= 7 && y <= 13) g[y][x] = ' ';
  }
  for (const [x, y] of [[5, 6], [13, 6], [5, 14], [13, 14], [9, 6], [4, TUNNEL], [14, TUNNEL]]) g[y][x] = ' ';
  for (let y = 9; y <= 11; y++) for (let x = 7; x <= 11; x++) g[y][x] = 'h';
  g[DOOR.y][DOOR.x] = '=';
  for (let x = 0; x <= 3; x++) g[TUNNEL][x] = ' ';
  for (let x = 15; x < C; x++) g[TUNNEL][x] = ' ';
  // golosinas
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    if (g[y][x] !== ' ') continue;
    const nearHouse = (y === 7 && x >= 8 && x <= 10) || (y === 6 && x === 9);
    const tunnelEnd = y === TUNNEL && (x <= 2 || x >= C - 3);
    if (!nearHouse && !tunnelEnd && !(x === START.x && y === START.y)) g[y][x] = '.';
  }
  for (const [x, y] of [[1, 3], [17, 3], [1, 17], [17, 17]]) { const yy = g[y][x] === '#' ? y - 2 : y; if (g[yy][x] !== '#') g[yy][x] = 'o'; }
  return g;
}

export default {
  mount(root, ctx) {
    let grid, dots = 0, eatenDots = 0, level = 1, lives = 3, score = 0, mazes = 0, candiesTotal = 0;
    let P, foes = [], queued = null, phase = 'ready', phaseT = 0, modeIdx = 0, modeT = 0, fright = 0, chain = 0, bonus = null, bonusShown = 0, wallColor = WALLS[0], swipe = null;
    const MODES = [7, 20, 7, 20, 5, 1e9]; // dispersión / persecución

    function newMaze() {
      for (let tries = 0; tries < 40; tries++) { grid = generate(level * 7 + Math.floor(Math.random() * 100000)); if (!unreachable()) break; }
      dots = grid.flat().filter(c => c === '.' || c === 'o').length; eatenDots = 0; bonusShown = 0; bonus = null;
      wallColor = WALLS[(level - 1) % WALLS.length];
      resetActors();
      a.banner(`Laberinto ${level}`, level === 1 ? 'Juntá todos los confites' : '¡Más rápido!', 1.8);
    }
    function resetActors() {
      P = { x: START.x, y: START.y, dir: { x: -1, y: 0 }, walk: 0, dead: 0 };
      queued = null;
      foes = ENEMIES.map((e, i) => ({ ...e, i, x: i === 0 ? EXIT.x : HOUSE.x + [0, 0, -2, 2][i], y: i === 0 ? EXIT.y : HOUSE.y, dir: { x: -1, y: 0 }, state: i === 0 ? 'active' : 'house', t: 0, release: e.release / Math.min(2, 1 + (level - 1) * .2), fright: false }));
      phase = 'ready'; phaseT = 1.6; modeIdx = 0; modeT = MODES[0]; fright = 0;
    }

    const speedP = () => Math.min(8.2, 6 + level * .3);
    const speedE = f => f.state === 'eaten' ? 13 : f.fright ? 3.6 : grid[Math.round(f.y)]?.[Math.round(f.x)] === undefined || (Math.round(f.y) === TUNNEL && (f.x < 4 || f.x > 14)) ? 3.5 : Math.min(7.9, 5.4 + level * .35);

    function open(x, y, ent) {
      if (y === TUNNEL && (x < 0 || x >= C)) return true;
      const c = grid[y]?.[x];
      if (c === undefined || c === '#') return false;
      if (c === '=' || c === 'h') return !!ent && (ent.state === 'leave' || ent.state === 'eaten' || ent.state === 'house');
      return true;
    }

    function step(e, speed, dt, choose) {
      let remain = speed * dt, guard = 0;
      while (remain > 1e-6 && guard++ < 6) {
        const cx = Math.round(e.x), cy = Math.round(e.y);
        if (Math.abs(e.x - cx) < 1e-6 && Math.abs(e.y - cy) < 1e-6) {
          e.x = cx; e.y = cy; choose(e, cx, cy);
          if (!e.dir.x && !e.dir.y) return;
          if (!open(cx + e.dir.x, cy + e.dir.y, e)) { if (e === P) e.dir = { x: 0, y: 0 }; return; }
        }
        let tx, ty;
        if (e.dir.x) { tx = e.dir.x > 0 ? Math.floor(e.x + 1e-6) + 1 : Math.ceil(e.x - 1e-6) - 1; ty = e.y; }
        else { ty = e.dir.y > 0 ? Math.floor(e.y + 1e-6) + 1 : Math.ceil(e.y - 1e-6) - 1; tx = e.x; }
        const d = Math.abs(tx - e.x) + Math.abs(ty - e.y), m = Math.min(remain, d);
        e.x += e.dir.x * m; e.y += e.dir.y * m; remain -= m;
        if (e.x < -.5) e.x += C; else if (e.x > C - .5) e.x -= C;
      }
    }

    function choosePlayer(e, cx, cy) {
      if (queued && open(cx + queued.x, cy + queued.y, e)) { e.dir = queued; }
      const c = grid[cy]?.[cx];
      if (c === '.' || c === 'o') eat(cx, cy, c);
      if (bonus && cx === bonus.x && cy === bonus.y) { const pts = 200 * level; score += pts; ctx.sfx.powerup(); a.fx.text(cx * T + 8, TOP + cy * T, `+${pts}`, '#ffd166', 12); a.fx.burst(cx * T + 8, TOP + cy * T + 8, { n: 16 }); candiesTotal++; bonus = null; }
    }
    function eat(x, y, c) {
      grid[y][x] = ' '; dots--; eatenDots++; candiesTotal++;
      if (c === '.') { score += 10; ctx.sfx.chomp(eatenDots % 2); }
      else {
        score += 50; ctx.sfx.power(); fright = Math.max(2, 7.5 - level * .6); chain = 0;
        for (const f of foes) if (f.state === 'active') { f.fright = true; f.dir = { x: -f.dir.x, y: -f.dir.y }; }
        a.fx.burst(x * T + 8, TOP + y * T + 8, { n: 14, colors: ['#ffd166', '#fff'], speed: 90 });
      }
      if ((eatenDots === 60 || eatenDots === 150) && !bonus) { bonus = { x: START.x, y: START.y, t: 9, kind: BONUS[bonusShown++ % BONUS.length] }; }
      if (dots === 0) { phase = 'clear'; phaseT = 2.2; mazes++; ctx.sfx.fanfare(); a.banner('¡Laberinto limpio!', `+${500 * level} de bonus`, 2); score += 500 * level; }
    }

    function targetOf(f) {
      if (f.state === 'eaten') return HOUSE;
      if (f.state === 'leave' || f.state === 'house') return EXIT;
      const scatter = modeIdx % 2 === 0;
      if (scatter) return f.corner;
      const px = Math.round(P.x), py = Math.round(P.y);
      switch (f.i) {
        case 0: return { x: px, y: py };                                           // Choco: directo
        case 1: return { x: px + P.dir.x * 4, y: py + P.dir.y * 4 };               // Gomi: adelante
        case 2: return Math.hypot(f.x - px, f.y - py) > 7 ? { x: px, y: py } : f.corner; // Ácido: se espanta de cerca
        default: { const ch = foes[0]; return { x: px * 2 - Math.round(ch.x), y: py * 2 - Math.round(ch.y) }; } // Azuquita: flanquea
      }
    }
    function chooseFoe(f, cx, cy) {
      if (f.state === 'eaten' && cx === HOUSE.x && cy === HOUSE.y) { f.state = 'leave'; f.fright = false; }
      if (f.state === 'leave' && cx === EXIT.x && cy === EXIT.y) { f.state = 'active'; f.dir = { x: -1, y: 0 }; }
      const back = { x: -f.dir.x, y: -f.dir.y };
      let opts = DIRS.filter(d => open(cx + d.x, cy + d.y, f) && !(d.x === back.x && d.y === back.y));
      if (f.state === 'active') opts = opts.filter(d => grid[cy + d.y]?.[cx + d.x] !== '=');
      if (!opts.length) opts = DIRS.filter(d => open(cx + d.x, cy + d.y, f));
      if (!opts.length) { f.dir = { x: 0, y: 0 }; return; }
      if (f.fright && f.state === 'active') { f.dir = opts[Math.floor(Math.random() * opts.length)]; return; }
      const t = targetOf(f);
      opts.sort((p, q) => Math.hypot(cx + p.x - t.x, cy + p.y - t.y) - Math.hypot(cx + q.x - t.x, cy + q.y - t.y));
      f.dir = opts[0];
    }

    function update(dt) {
      // entrada
      for (const k of ['up', 'down', 'left', 'right']) if (a.hit(k) || (a.down(k) && !queued)) queued = KEYDIR[k];
      if (phase === 'ready') { phaseT -= dt; if (phaseT <= 0) phase = 'play'; return; }
      if (phase === 'clear') { phaseT -= dt; if (phaseT <= 0) { level++; newMaze(); } return; }
      if (phase === 'dying') {
        phaseT -= dt; P.dead += dt;
        if (phaseT <= 0) { if (lives <= 0) return gameOver(); resetActors(); }
        return;
      }
      // modo dispersión/persecución
      if (fright > 0) { fright -= dt; if (fright <= 0) foes.forEach(f => (f.fright = false)); }
      else if ((modeT -= dt) <= 0) { modeIdx++; modeT = MODES[Math.min(modeIdx, MODES.length - 1)]; foes.forEach(f => { if (f.state === 'active') f.dir = { x: -f.dir.x, y: -f.dir.y }; }); }
      // jugador: dar vuelta en el acto
      if (queued && queued.x === -P.dir.x && queued.y === -P.dir.y) P.dir = queued;
      if (!P.dir.x && !P.dir.y && queued) P.dir = queued;
      step(P, speedP(), dt, choosePlayer);
      if (P.dir.x || P.dir.y) P.walk += dt * 14;
      // enemigos
      for (const f of foes) {
        f.t += dt;
        if (f.state === 'house') { f.y = HOUSE.y + Math.sin(f.t * 5) * .25; if (f.t >= f.release) { f.state = 'leave'; f.x = Math.round(f.x); f.y = HOUSE.y; } continue; }
        step(f, speedE(f), dt, chooseFoe);
        const d = Math.hypot(f.x - P.x, f.y - P.y);
        if (d < .7 && f.state === 'active') {
          if (f.fright) {
            f.state = 'eaten'; f.fright = false; chain++;
            const pts = 200 * Math.pow(2, chain - 1); score += pts; ctx.sfx.stomp(); a.fx.shake(2, .12);
            a.fx.text(f.x * T + 8, TOP + f.y * T, `+${pts}`, '#7ae0ff', 13);
            a.fx.burst(f.x * T + 8, TOP + f.y * T + 8, { n: 16, colors: [f.color, '#fff', '#ffd166'], speed: 120 });
          } else { die(); return; }
        }
      }
      if (bonus && (bonus.t -= dt) <= 0) bonus = null;
      ctx.hud({ Laberinto: level, Vidas: lives, Puntos: score, Confites: dots });
    }
    function die() { phase = 'dying'; phaseT = 1.6; lives--; P.dead = 0; ctx.sfx.hurt(); a.fx.shake(4, .3); }
    function gameOver() {
      phase = 'over';
      a.end({ score, won: mazes > 0, title: mazes >= 3 ? '¡Rey del laberinto!' : mazes ? '¡Buena recorrida!' : '¡Te atraparon!', extra: { mazes, candies: candiesTotal }, summary: `Limpiaste ${mazes} ${mazes === 1 ? 'laberinto' : 'laberintos'} y juntaste ${candiesTotal} golosinas.` });
    }

    function onPointer(type, x, y) {
      if (type === 'down') swipe = { x, y };
      else if (type === 'move' && swipe) {
        const dx = x - swipe.x, dy = y - swipe.y;
        if (Math.hypot(dx, dy) > 14) { queued = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? KEYDIR.right : KEYDIR.left) : (dy > 0 ? KEYDIR.down : KEYDIR.up); swipe = { x, y }; }
      } else swipe = null;
    }

    /* ---------- Dibujo ---------- */
    function drawFoe(g, f) {
      const x = f.x * T + 8, y = TOP + f.y * T + 8;
      if (f.state === 'eaten') { g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 3, y, 2.6, 0, 7); g.arc(x + 3, y, 2.6, 0, 7); g.fill(); g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(x - 3 + f.dir.x, y + f.dir.y, 1.3, 0, 7); g.arc(x + 3 + f.dir.x, y + f.dir.y, 1.3, 0, 7); g.fill(); return; }
      const wob = Math.sin(f.t * 10) * .8;
      if (f.fright) {
        const flash = fright < 2 && Math.floor(fright * 6) % 2;
        g.fillStyle = flash ? '#ffffff' : '#9ec9ff';
        g.beginPath(); g.ellipse(x, y + 2, 7.5 + wob, 5.5 - wob * .4, 0, 0, 7); g.fill();
        g.fillStyle = '#3b1f2b'; g.fillRect(x - 3.5, y - 1, 2, 2); g.fillRect(x + 1.5, y - 1, 2, 2);
        g.strokeStyle = '#3b1f2b'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 3, y + 4); g.lineTo(x - 1, y + 3); g.lineTo(x + 1, y + 4); g.lineTo(x + 3, y + 3); g.stroke();
        return;
      }
      g.save(); g.translate(x, y);
      if (f.i === 0) { // monstruo de chocolate con chorreado
        g.fillStyle = f.color; g.beginPath(); g.arc(0, -1, 7, Math.PI, 0); g.lineTo(7, 4); for (let k = 0; k < 4; k++) g.quadraticCurveTo(5 - k * 3.5, 9 + (k % 2) * 2 + wob, 3.5 - k * 3.5, 4); g.lineTo(-7, 4); g.fill();
      } else if (f.i === 1) { // gomita traviesa
        g.fillStyle = f.color; g.beginPath(); g.arc(-4, -6, 2.6, 0, 7); g.arc(4, -6, 2.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 1, 7, 7 + wob * .3, 0, 0, 7); g.fill();
      } else if (f.i === 2) { // caramelo ácido
        g.fillStyle = '#f1f582'; g.beginPath(); g.moveTo(-10, -3); g.lineTo(-6, 0); g.lineTo(-10, 3); g.fill(); g.beginPath(); g.moveTo(10, -3); g.lineTo(6, 0); g.lineTo(10, 3); g.fill();
        g.fillStyle = f.color; g.beginPath(); g.ellipse(0, 0, 7, 6.5, 0, 0, 7); g.fill();
      } else { // terrón de azúcar
        g.rotate(wob * .05); roundRect(g, -7, -7, 14, 14, 3); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#e0d4dc'; g.lineWidth = 1; g.stroke();
        g.fillStyle = '#ffd166'; g.fillRect(-5, -6, 1.5, 1.5); g.fillRect(4, 4, 1.5, 1.5);
      }
      // ojos que miran hacia donde van
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-2.8, -1.5, 2.4, 0, 7); g.arc(2.8, -1.5, 2.4, 0, 7); g.fill();
      g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(-2.8 + f.dir.x * 1.1, -1.5 + f.dir.y * 1.1, 1.2, 0, 7); g.arc(2.8 + f.dir.x * 1.1, -1.5 + f.dir.y * 1.1, 1.2, 0, 7); g.fill();
      if (f.i === 2) { g.strokeStyle = '#3b1f2b'; g.lineWidth = 1; g.beginPath(); g.moveTo(-5, -5); g.lineTo(-1, -4); g.moveTo(5, -5); g.lineTo(1, -4); g.stroke(); }
      g.restore();
    }
    function draw(g) {
      g.fillStyle = '#1d1030'; g.fillRect(0, 0, W, H);
      // marcador
      g.textBaseline = 'middle'; g.font = `700 12px ${FONT}`; g.textAlign = 'left'; g.fillStyle = '#ffd166';
      g.fillText(`Puntos ${score}`, 8, 13); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(`Laberinto ${level}`, W / 2, 13);
      g.textAlign = 'right'; g.fillStyle = '#ff8fb1'; g.fillText('♥'.repeat(Math.max(0, lives)), W - 8, 13);
      // progreso
      const total = eatenDots + dots; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(8, 22, W - 16, 2); g.fillStyle = '#06d6a0'; g.fillRect(8, 22, (W - 16) * (total ? eatenDots / total : 0), 2);
      // paredes como tubos de caramelo
      g.save(); g.translate(0, TOP);
      g.fillStyle = wallColor;
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        if (grid[y][x] !== '#') continue;
        const px = x * T, py = y * T;
        roundRect(g, px + 4, py + 4, 8, 8, 4); g.fill();
        if (grid[y][x + 1] === '#') g.fillRect(px + 8, py + 4, 16, 8);
        if (grid[y + 1]?.[x] === '#') g.fillRect(px + 4, py + 8, 8, 16);
      }
      g.fillStyle = 'rgba(255,255,255,.35)';
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (grid[y][x] === '#' && grid[y][x + 1] === '#') g.fillRect(x * T + 8, y * T + 5, 16, 2);
      g.fillStyle = '#ff8fb1'; g.fillRect(DOOR.x * T + 2, DOOR.y * T + 6, 12, 3);
      // confites y bombones dorados
      const pal = ['#ef476f', '#ffd166', '#06d6a0', '#7ae0ff', '#ff8fb1'];
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const c = grid[y][x];
        if (c === '.') { g.fillStyle = pal[(x * 3 + y) % 5]; g.beginPath(); g.ellipse(x * T + 8, y * T + 8, 2.4, 2, 0, 0, 7); g.fill(); }
        else if (c === 'o') { const s = 5 + Math.sin(a.time * 6) * 1.2; g.fillStyle = '#ffd166'; g.beginPath(); g.arc(x * T + 8, y * T + 8, s, 0, 7); g.fill(); g.fillStyle = '#7a3e2b'; g.beginPath(); g.arc(x * T + 8, y * T + 8, s * .55, 0, 7); g.fill(); }
      }
      if (bonus) g.drawImage(candyImage(bonus.kind).img, bonus.x * T - 2, bonus.y * T - 2, 20, 20);
      g.restore();
      for (const f of foes) drawFoe(g, f);
      // Bongi
      const px = P.x * T + 8, py = TOP + P.y * T + 8;
      if (phase === 'dying') { g.save(); g.translate(px, py); g.rotate(P.dead * 8); g.scale(Math.max(.05, 1 - P.dead / 1.4), Math.max(.05, 1 - P.dead / 1.4)); drawBongi(g, 0, 0, 13, { mood: 'hurt' }); g.restore(); }
      else drawBongi(g, px, py - 1, 12, { dir: P.dir.x < 0 ? -1 : 1, walk: P.walk, mood: fright > 0 ? 'happy' : 'ok' });
      if (phase === 'ready') { g.fillStyle = '#ffd166'; g.font = `700 16px ${FONT}`; g.textAlign = 'center'; g.fillText('¡Listos!', W / 2, TOP + 12.5 * T); }
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Laberinto de Bongi Maze', update, draw, onPointer,
      controls: { dirs: 'all' },
      help: ['Flechas, WASD, deslizar o la cruz para moverte.', 'Juntá todos los confites. El Bombón dorado asusta a los enemigos: ahí los podés atrapar.', 'Los pasadizos del medio te llevan al otro lado del laberinto.']
    });
    function unreachable() {
      const seen = new Set([START.x + ',' + START.y]), q = [START];
      while (q.length) { const p = q.shift(); for (const d of DIRS) { let nx = p.x + d.x; const ny = p.y + d.y; if (ny === TUNNEL) nx = (nx + C) % C; const c = grid[ny]?.[nx]; if (c === undefined || c === '#' || c === '=' || c === 'h' || seen.has(nx + ',' + ny)) continue; seen.add(nx + ',' + ny); q.push({ x: nx, y: ny }); } }
      let missing = 0; for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if ((grid[y][x] === '.' || grid[y][x] === 'o') && !seen.has(x + ',' + y)) missing++;
      return missing;
    }
    root._debug = {
      get state() { return { level, lives, score, dots, phase, mazes }; },
      clear() { for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (grid[y][x] === '.' || grid[y][x] === 'o') { grid[y][x] = ' '; } dots = 1; grid[Math.round(P.y)][Math.round(P.x)] = '.'; eat(Math.round(P.x), Math.round(P.y), '.'); },
      reachable: () => unreachable()
    };
    preload(BONUS).then(() => { newMaze(); a.start(); });
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
