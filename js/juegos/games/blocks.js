// BONGI BLOCKS — El desafío de los dulces.
// Piezas de golosina, rotación con correcciones contra paredes, pieza fantasma, guardar pieza,
// tres próximas, retardo de fijación, combos, multiplicador por cuádruples seguidos y niveles.
import { arcade, FONT, roundRect } from '../core/arcade.js';

const COLS = 10, ROWS = 20, S = 16, BX = 68, BY = 10, W = 296, H = 344;
const PIECES = {
  I: { name: 'Regaliz', color: '#e63946', cells: [[0, 1], [1, 1], [2, 1], [3, 1]], size: 4, deco: 'stripes' },
  O: { name: 'Bombón doble', color: '#7a3e2b', cells: [[1, 0], [2, 0], [1, 1], [2, 1]], size: 4, deco: 'dot' },
  T: { name: 'Chupetín', color: '#ff6b35', cells: [[1, 0], [0, 1], [1, 1], [2, 1]], size: 3, deco: 'swirl' },
  S: { name: 'Gomita verde', color: '#06d6a0', cells: [[1, 0], [2, 0], [0, 1], [1, 1]], size: 3, deco: 'gum' },
  Z: { name: 'Gomita rosa', color: '#ff8fb1', cells: [[0, 0], [1, 0], [1, 1], [2, 1]], size: 3, deco: 'gum' },
  J: { name: 'Alfajor', color: '#c98a5a', cells: [[0, 0], [0, 1], [1, 1], [2, 1]], size: 3, deco: 'layer' },
  L: { name: 'Caramelo', color: '#ffd166', cells: [[2, 0], [0, 1], [1, 1], [2, 1]], size: 3, deco: 'stripes' }
};
// correcciones de rotación (sistema estándar de giro con "patadas")
const KICKS = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};
const KICKS_I = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]], '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]], '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

function cellsOf(type, rot) {
  const p = PIECES[type], n = p.size;
  return p.cells.map(([x, y]) => { let cx = x, cy = y; for (let i = 0; i < rot; i++) [cx, cy] = [n - 1 - cy, cx]; return [cx, cy]; });
}

export default {
  mount(root, ctx) {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let bag = [], queue = [], cur = null, hold = null, canHold = true;
    let score = 0, lines = 0, level = 1, combo = -1, b2b = false, quads = 0, over = false;
    let fall = 0, lock = 0, lockResets = 0, das = 0, dasDir = 0, arr = 0, clearing = null, gesture = null;

    const draw7 = () => { if (!bag.length) bag = Object.keys(PIECES).sort(() => Math.random() - .5); return bag.pop(); };
    while (queue.length < 4) queue.push(draw7());

    function spawn(type) {
      cur = { type: type || queue.shift(), rot: 0, x: 3, y: -1 };
      if (!type) queue.push(draw7());
      if (PIECES[cur.type].size === 4) cur.y = -1;
      fall = 0; lock = 0; lockResets = 0;
      if (collides(cur.x, cur.y, cur.rot)) { cur.y--; if (collides(cur.x, cur.y, cur.rot)) gameOver(); }
    }
    function collides(x, y, rot, type = cur.type) {
      return cellsOf(type, rot).some(([cx, cy]) => {
        const bx = x + cx, by = y + cy;
        return bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx]);
      });
    }
    const speed = () => Math.max(.045, .8 * Math.pow(.86, level - 1));

    function move(dx) {
      if (!collides(cur.x + dx, cur.y, cur.rot)) { cur.x += dx; ctx.sfx.tick(); resetLock(); return true; }
      return false;
    }
    function rotate(dir = 1) {
      if (cur.type === 'O') return;
      const to = (cur.rot + dir + 4) % 4, key = `${cur.rot}>${to}`;
      for (const [kx, ky] of (cur.type === 'I' ? KICKS_I : KICKS)[key]) {
        if (!collides(cur.x + kx, cur.y - ky, to)) { cur.x += kx; cur.y -= ky; cur.rot = to; ctx.sfx.rotate(); resetLock(); return; }
      }
    }
    function resetLock() { if (onGround() && lockResets < 15) { lock = 0; lockResets++; } }
    const onGround = () => collides(cur.x, cur.y + 1, cur.rot);
    function ghostY() { let y = cur.y; while (!collides(cur.x, y + 1, cur.rot)) y++; return y; }
    function hardDrop() {
      const y = ghostY(); score += (y - cur.y) * 2; cur.y = y;
      a.fx.shake(2, .1); ctx.sfx.drop();
      for (const [cx, cy] of cellsOf(cur.type, cur.rot)) a.fx.burst(BX + (cur.x + cx) * S + 8, BY + (cur.y + cy) * S + 14, { n: 2, colors: [PIECES[cur.type].color, '#fff'], speed: 50, life: .35 });
      lockPiece();
    }
    function doHold() {
      if (!canHold) return;
      const t = cur.type; canHold = false; ctx.sfx.flip();
      if (hold) { const h = hold; hold = t; spawn(h); } else { hold = t; spawn(); }
    }
    function lockPiece() {
      for (const [cx, cy] of cellsOf(cur.type, cur.rot)) {
        const bx = cur.x + cx, by = cur.y + cy;
        if (by < 0) { gameOver(); return; }
        board[by][bx] = cur.type;
      }
      canHold = true;
      const full = []; for (let r = 0; r < ROWS; r++) if (board[r].every(Boolean)) full.push(r);
      if (full.length) {
        clearing = { rows: full, t: .32 };
        const n = full.length;
        combo++;
        const base = [0, 100, 300, 500, 800][n] * level;
        const btb = n === 4 && b2b ? 1.5 : 1;
        const pts = Math.round(base * btb) + (combo > 0 ? 50 * combo * level : 0);
        score += pts; lines += n; if (n === 4) { quads++; b2b = true; } else b2b = false;
        ctx.sfx.line(n);
        const label = n === 4 ? (btb > 1 ? '¡Cuádruple doble!' : '¡Cuádruple!') : n === 3 ? '¡Triple!' : n === 2 ? '¡Doble!' : '';
        if (label) a.banner(label, `+${pts}`, 1.1); else a.fx.text(BX + 80, BY + full[0] * S, `+${pts}`, '#ffd166', 13);
        if (combo > 0) a.fx.text(BX + 80, BY + full[0] * S + 16, `Combo x${combo + 1}`, '#06d6a0', 12);
        for (const r of full) for (let c = 0; c < COLS; c++) a.fx.burst(BX + c * S + 8, BY + r * S + 8, { n: 4, colors: [PIECES[board[r][c]].color, '#fff', '#ffd166'], speed: 150, life: .7 });
        if (n >= 3) a.fx.shake(4, .25);
        const newLevel = 1 + Math.floor(lines / 10);
        if (newLevel > level) { level = newLevel; ctx.sfx.fanfare(); a.banner(`Nivel ${level}`, '¡Más rápido!', 1.4); }
      } else { combo = -1; ctx.sfx.bounce(0); spawn(); }
      cur = full.length ? null : cur;
    }
    function finishClear() {
      const rows = clearing.rows; clearing = null;
      for (const r of rows.sort((p, q) => p - q)) { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); }
      spawn();
    }
    function gameOver() {
      if (over) return; over = true; cur = null;
      ctx.sfx.gameover();
      a.end({ score, won: lines >= 10, title: lines >= 40 ? '¡Arquitecto dulce!' : '¡Se llenó el frasco!', extra: { lines, quad: quads, candies: lines * 10 }, summary: `${lines} filas, nivel ${level}${quads ? `, ${quads} cuádruples` : ''}.` });
    }

    function update(dt) {
      if (over) return;
      if (clearing) { clearing.t -= dt; if (clearing.t <= 0) finishClear(); return; }
      if (!cur) return;
      // entrada con autorrepetición
      const dir = (a.down('right') ? 1 : 0) - (a.down('left') ? 1 : 0);
      if (dir !== dasDir) { dasDir = dir; das = 0; arr = 0; if (dir) move(dir); }
      else if (dir) { das += dt; if (das > .16) { arr += dt; while (arr > .05) { arr -= .05; if (!move(dir)) break; } } }
      if (a.hit('up') || a.hit('b')) rotate(1);
      if (a.hit('c')) doHold();
      if (a.hit('a')) { hardDrop(); return; }
      const soft = a.down('down');
      fall += dt;
      const interval = soft ? Math.min(.04, speed()) : speed();
      while (fall >= interval) {
        fall -= interval;
        if (!onGround()) { cur.y++; if (soft) score += 1; } else break;
      }
      if (onGround()) { lock += dt; if (lock >= .5) lockPiece(); } else lock = 0;
      ctx.hud({ Puntos: score, Filas: lines, Nivel: level });
    }

    // gestos táctiles sobre el tablero: tocar = rotar, deslizar = mover, deslizar abajo rápido = caer
    function onPointer(type, x, y, e) {
      if (!cur || clearing) return;
      if (type === 'down') gesture = { x, y, sx: x, t: performance.now(), moved: false };
      else if (type === 'move' && gesture) {
        const dx = x - gesture.x;
        if (Math.abs(dx) > 14) { move(Math.sign(dx)); gesture.x = x; gesture.moved = true; }
        if (y - gesture.y > 26 && !gesture.moved) { gesture.soft = true; if (!collides(cur.x, cur.y + 1, cur.rot)) { cur.y++; score++; } gesture.y = y; }
      } else if (type === 'up' && gesture) {
        const dt = performance.now() - gesture.t, dy = y - gesture.y;
        if (!gesture.moved && !gesture.soft && Math.abs(x - gesture.sx) < 8 && dt < 260) rotate(1);
        else if (dy > 40 && dt < 260) hardDrop();
        gesture = null;
      }
    }

    function cell(g, x, y, type, alpha = 1) {
      const p = PIECES[type];
      g.globalAlpha = alpha;
      roundRect(g, x + .5, y + .5, S - 1, S - 1, 4); g.fillStyle = p.color; g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; roundRect(g, x + 2, y + 2, S - 4, 4, 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + 2, y + S - 4, S - 4, 2);
      if (p.deco === 'stripes') { g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x + 4, y + 7, 2, 6); g.fillRect(x + 9, y + 7, 2, 6); }
      if (p.deco === 'dot') { g.fillStyle = '#ffd166'; g.beginPath(); g.arc(x + 8, y + 9, 2.2, 0, 7); g.fill(); }
      if (p.deco === 'swirl') { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4; g.beginPath(); g.arc(x + 8, y + 9, 3.5, 0, 4.6); g.stroke(); }
      if (p.deco === 'gum') { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x + 5, y + 10, 1.3, 0, 7); g.arc(x + 11, y + 8, 1.1, 0, 7); g.fill(); }
      if (p.deco === 'layer') { g.fillStyle = '#f3d9b1'; g.fillRect(x + 1, y + 8, S - 2, 2); }
      g.globalAlpha = 1;
    }
    function mini(g, type, cx, cy, sc = .75) {
      if (!type) return;
      const cs = cellsOf(type, 0), n = PIECES[type].size;
      const minx = Math.min(...cs.map(c => c[0])), maxx = Math.max(...cs.map(c => c[0])), miny = Math.min(...cs.map(c => c[1])), maxy = Math.max(...cs.map(c => c[1]));
      g.save(); g.translate(cx - ((minx + maxx + 1) / 2) * S * sc, cy - ((miny + maxy + 1) / 2) * S * sc); g.scale(sc, sc);
      for (const [x, y] of cs) cell(g, x * S, y * S, type);
      g.restore();
    }
    function draw(g) {
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#2b3b4b'); grd.addColorStop(1, '#1b2531');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // frasco (tablero)
      roundRect(g, BX - 4, BY - 4, COLS * S + 8, ROWS * S + 8, 10); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.035)';
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if ((r + c) % 2) g.fillRect(BX + c * S, BY + r * S, S, S);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const t = board[r][c]; if (!t) continue;
        if (clearing?.rows.includes(r)) { const k = clearing.t / .32; g.globalAlpha = k; g.fillStyle = '#fff'; g.fillRect(BX + c * S, BY + r * S, S, S); g.globalAlpha = 1; continue; }
        cell(g, BX + c * S, BY + r * S, t);
      }
      if (cur) {
        const gy = ghostY();
        for (const [cx, cy] of cellsOf(cur.type, cur.rot)) { const y = gy + cy; if (y >= 0) { g.strokeStyle = PIECES[cur.type].color; g.lineWidth = 1.5; g.globalAlpha = .55; roundRect(g, BX + (cur.x + cx) * S + 1.5, BY + y * S + 1.5, S - 3, S - 3, 4); g.stroke(); g.globalAlpha = 1; } }
        for (const [cx, cy] of cellsOf(cur.type, cur.rot)) { const y = cur.y + cy; if (y >= 0) cell(g, BX + (cur.x + cx) * S, BY + y * S, cur.type); }
      }
      // paneles
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const panel = (x, y, w, h, title) => { roundRect(g, x, y, w, h, 10); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.fillStyle = '#ffd166'; g.font = `700 10px ${FONT}`; g.fillText(title, x + w / 2, y + 10); };
      panel(6, 10, 56, 62, 'Guardado'); mini(g, hold, 34, 46, .7);
      if (hold && !canHold) { g.fillStyle = 'rgba(27,37,49,.6)'; g.fillRect(6, 22, 56, 48); }
      panel(W - 62, 10, 56, 150, 'Próximas'); queue.slice(0, 3).forEach((t, i) => mini(g, t, W - 34, 46 + i * 40, i ? .55 : .7));
      panel(6, 84, 56, 150, 'Marcador');
      const stat = (label, val, y) => { g.fillStyle = '#f6dbe3'; g.font = `600 9px ${FONT}`; g.fillText(label, 34, y); g.fillStyle = '#fff'; g.font = `700 13px ${FONT}`; g.fillText(String(val), 34, y + 14); };
      stat('Puntos', score, 104); stat('Filas', lines, 140); stat('Nivel', level, 176);
      if (combo > 0) { g.fillStyle = '#06d6a0'; g.font = `700 11px ${FONT}`; g.fillText(`Combo x${combo + 1}`, 34, 218); }
      // progreso de nivel
      roundRect(g, W - 62, 172, 56, 10, 5); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill();
      roundRect(g, W - 62, 172, 56 * ((lines % 10) / 10) || 1, 10, 5); g.fillStyle = '#06d6a0'; g.fill();
      g.fillStyle = '#f6dbe3'; g.font = `600 8px ${FONT}`; g.fillText(`${10 - lines % 10} filas para subir`, W - 34, 192);
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Tablero de Bongi Blocks', update, draw, onPointer,
      controls: { dirs: ['left', 'down', 'right'], buttons: [{ id: 'c', label: 'Guardar' }, { id: 'b', label: '⟳' }, { id: 'a', label: 'Caer' }] },
      help: ['◀ ▶ mover · ▼ bajar suave · ⟳ (▲ o X) rotar · Caer (Espacio) de golpe · Guardar (C).', 'En el celular también podés tocar el tablero para rotar y deslizar para mover o soltar.']
    });
    root._debug = {
      get state() { return { score, lines, level, over, queue: queue.length, cur: cur?.type }; },
      fillLines(n = 4) { for (let r = ROWS - n; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) board[r][c] = 'O'; cur = { type: 'I', rot: 1, x: COLS - 3, y: 0 }; if (collides(cur.x, cur.y, cur.rot)) cur.x--; }
    };
    spawn();
    a.start();
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
