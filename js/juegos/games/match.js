// Candy Match: intercambiar golosinas vecinas para formar líneas de 3 o más.
// Controles: tocar + tocar vecina, deslizar, o teclado (Enter para elegir y flechas para intercambiar).
import { candySVG, CANDIES } from '../../candies.js?v=cfab42284a';

const N = 7;
const TYPES = ['caramelo', 'chupetin', 'gomita', 'confite', 'bombon', 'chicle'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const goalFor = lvl => 700 + (lvl - 1) * 450;
const movesFor = lvl => 18 + Math.min(4, lvl - 1);

export default {
  mount(root, ctx) {
    let alive = true, busy = false, sel = null, hintTimer = 0;
    let level = 1, total = 0, levelPts = 0, moves = movesFor(1), bestCombo = 0;
    const fast = ctx.reduceMotion ? 0.3 : 1;
    const grid = []; // grid[r][c] = { type, el }

    root.innerHTML = `<div class="match-wrap">
      <div class="match-goal"><span data-goal></span><span data-moves></span></div>
      <div class="match-progress" aria-hidden="true"><span data-prog></span></div>
      <div class="match-board" style="--n:${N}" role="grid" aria-label="Tablero de Candy Match. Elegí una golosina con Enter y usá las flechas para intercambiarla."></div>
    </div>`;
    const board = root.querySelector('.match-board');

    const rand = () => TYPES[(Math.random() * TYPES.length) | 0];
    const place = (cell, r, c) => { cell.el.style.transform = `translate(${c * 100}%, ${r * 100}%)`; cell.el.dataset.r = r; cell.el.dataset.c = c; cell.el.setAttribute('aria-label', `${CANDIES[cell.type].name}, fila ${r + 1}, columna ${c + 1}`); };
    function makeCell(type, r, c, fromRow = r) {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'tile'; el.tabIndex = -1;
      el.innerHTML = candySVG(type);
      const cell = { type, el };
      el.style.transition = 'none';
      el.style.transform = `translate(${c * 100}%, ${fromRow * 100}%)`;
      board.append(el);
      return cell;
    }

    function initBoard() {
      for (let r = 0; r < N; r++) {
        grid[r] = [];
        for (let c = 0; c < N; c++) {
          let t;
          do { t = rand(); } while ((c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) || (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t));
          grid[r][c] = makeCell(t, r, c);
          place(grid[r][c], r, c);
        }
      }
      requestAnimationFrame(() => board.querySelectorAll('.tile').forEach(t => (t.style.transition = '')));
      if (!findMove()) reshuffle();
      grid[0][0].el.tabIndex = 0;
    }

    function matches() {
      const hit = new Set();
      let longest = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
        let k = c; while (k < N && grid[r][k].type === grid[r][c].type) k++;
        if (k - c >= 3) { for (let i = c; i < k; i++) hit.add(r * N + i); longest = Math.max(longest, k - c); }
        c = k;
      }
      for (let c = 0; c < N; c++) for (let r = 0; r < N;) {
        let k = r; while (k < N && grid[k][c].type === grid[r][c].type) k++;
        if (k - r >= 3) { for (let i = r; i < k; i++) hit.add(i * N + c); longest = Math.max(longest, k - r); }
        r = k;
      }
      return { hit, longest };
    }

    function swapData(a, b) { const t = grid[a.r][a.c]; grid[a.r][a.c] = grid[b.r][b.c]; grid[b.r][b.c] = t; }
    function findMove() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const b = { r: r + dr, c: c + dc }; if (b.r >= N || b.c >= N) continue;
        swapData({ r, c }, b); const ok = matches().hit.size > 0; swapData({ r, c }, b);
        if (ok) return [{ r, c }, b];
      }
      return null;
    }
    function reshuffle() {
      let tries = 0;
      do {
        const types = grid.flat().map(x => x.type).sort(() => Math.random() - .5);
        grid.flat().forEach((cell, i) => { cell.type = types[i]; cell.el.innerHTML = candySVG(cell.type); });
        tries++;
      } while ((matches().hit.size || !findMove()) && tries < 50);
      if (matches().hit.size || !findMove()) { // muy improbable: tablero nuevo
        board.innerHTML = ''; initBoard(); return;
      }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) place(grid[r][c], r, c);
    }

    function paintHud() {
      ctx.hud({ Nivel: level, Puntos: total, Combo: bestCombo ? `x${bestCombo}` : '—' });
      root.querySelector('[data-goal]').textContent = `Meta del nivel: ${levelPts} / ${goalFor(level)}`;
      root.querySelector('[data-moves]').textContent = `${moves} movimientos`;
      root.querySelector('[data-prog]').style.width = `${Math.min(100, (levelPts / goalFor(level)) * 100)}%`;
    }

    function flash(text) {
      const f = document.createElement('div'); f.className = 'combo-flash'; f.textContent = text;
      board.append(f); setTimeout(() => f.remove(), 800);
    }

    async function trySwap(a, b) {
      if (busy || !alive) return;
      busy = true; clearHint(); select(null);
      swapData(a, b); place(grid[a.r][a.c], a.r, a.c); place(grid[b.r][b.c], b.r, b.c);
      ctx.sfx.flip();
      await sleep(230 * fast);
      if (!matches().hit.size) {
        swapData(a, b); place(grid[a.r][a.c], a.r, a.c); place(grid[b.r][b.c], b.r, b.c);
        ctx.sfx.error(); await sleep(230 * fast); busy = false; armHint(); return;
      }
      moves--;
      let combo = 0;
      for (;;) {
        const { hit, longest } = matches();
        if (!hit.size || !alive) break;
        combo++;
        const pts = hit.size * 10 * combo + (longest >= 5 ? 100 : longest === 4 ? 40 : 0);
        total += pts; levelPts += pts; bestCombo = Math.max(bestCombo, combo);
        ctx.sfx.combo(combo);
        if (combo >= 2) flash(`Combo x${combo}`);
        if (longest >= 4) flash(longest >= 5 ? '¡Dulcísimo!' : '¡Genial!');
        for (const k of hit) grid[(k / N) | 0][k % N].el.classList.add('is-pop');
        const first = [...hit][0], fr = (first / N) | 0, fc = first % N;
        const tile = board.getBoundingClientRect(), rr = root.getBoundingClientRect();
        ctx.float(tile.left - rr.left + (fc + .5) * tile.width / N, tile.top - rr.top + fr * tile.height / N, `+${pts}`);
        paintHud();
        await sleep(220 * fast);
        // Gravedad + reposición
        for (let c = 0; c < N; c++) {
          const keep = [];
          for (let r = N - 1; r >= 0; r--) { const cell = grid[r][c]; if (hit.has(r * N + c)) cell.el.remove(); else keep.push(cell); }
          let r = N - 1;
          for (const cell of keep) grid[r--][c] = cell;
          let spawnRow = -1;
          for (; r >= 0; r--) { grid[r][c] = makeCell(rand(), r, c, spawnRow--); }
        }
        await new Promise(requestAnimationFrame);
        board.querySelectorAll('.tile').forEach(t => (t.style.transition = ''));
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) place(grid[r][c], r, c);
        await sleep(260 * fast);
      }
      if (!alive) return;
      if (levelPts >= goalFor(level)) {
        const bonus = moves * 20; total += bonus;
        ctx.sfx.win(); flash(`¡Nivel ${level} superado!`);
        level++; levelPts = 0; moves = movesFor(level);
        await sleep(900);
      } else if (moves <= 0) {
        paintHud(); await sleep(400);
        return end();
      }
      if (!findMove()) { flash('Mezclando…'); await sleep(500); reshuffle(); }
      if (!board.querySelector('.tile[tabindex="0"]')) grid[0][0].el.tabIndex = 0;
      paintHud(); busy = false; armHint();
    }

    function end() {
      alive = false; clearHint();
      ctx.end({ score: total, won: level > 1, extra: { level, combo: bestCombo }, summary: `Llegaste al nivel ${level}. Mejor combo: x${bestCombo}.`, title: level > 1 ? '¡Muy dulce!' : 'Sin movimientos' });
    }

    // ---------- Selección e interacción ----------
    function select(cell) {
      board.querySelectorAll('.is-selected').forEach(t => t.classList.remove('is-selected'));
      sel = cell; if (cell) cell.el.classList.add('is-selected');
    }
    const posOf = el => ({ r: Number(el.dataset.r), c: Number(el.dataset.c) });
    const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

    let drag = null;
    board.addEventListener('pointerdown', e => {
      const t = e.target.closest('.tile'); if (!t || busy) return;
      drag = { el: t, x: e.clientX, y: e.clientY, used: false };
    });
    board.addEventListener('pointermove', e => {
      if (!drag || drag.used) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) < 22) return;
      drag.used = true;
      const a = posOf(drag.el);
      const b = Math.abs(dx) > Math.abs(dy) ? { r: a.r, c: a.c + Math.sign(dx) } : { r: a.r + Math.sign(dy), c: a.c };
      if (b.r >= 0 && b.r < N && b.c >= 0 && b.c < N) trySwap(a, b);
    });
    board.addEventListener('pointerup', () => { setTimeout(() => (drag = null), 0); });
    board.addEventListener('click', e => {
      const t = e.target.closest('.tile'); if (!t || busy || drag?.used) return;
      const p = posOf(t), cell = grid[p.r][p.c];
      ctx.sfx.click();
      if (sel && sel !== cell && adjacent(posOf(sel.el), p)) trySwap(posOf(sel.el), p);
      else select(sel === cell ? null : cell);
    });
    board.addEventListener('keydown', e => {
      const t = e.target.closest('.tile'); if (!t) return;
      const p = posOf(t);
      const dir = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (dir) {
        e.preventDefault();
        const q = { r: p.r + dir[0], c: p.c + dir[1] };
        if (q.r < 0 || q.r >= N || q.c < 0 || q.c >= N) return;
        if (sel && sel.el === t) { trySwap(p, q); return; }
        t.tabIndex = -1; const n = grid[q.r][q.c].el; n.tabIndex = 0; n.focus();
      }
    });

    function clearHint() { clearTimeout(hintTimer); board.querySelectorAll('.is-hint').forEach(t => t.classList.remove('is-hint')); }
    function armHint() {
      clearHint();
      hintTimer = setTimeout(() => { const m = findMove(); if (m && alive && !busy) m.forEach(p => grid[p.r][p.c].el.classList.add('is-hint')); }, 7000);
    }

    initBoard(); paintHud(); armHint();
    return { destroy() { alive = false; clearHint(); } };
  }
};
