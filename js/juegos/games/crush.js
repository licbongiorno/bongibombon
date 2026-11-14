// BONGI CRUSH — La fábrica de combinaciones.
// 30 niveles en 3 mundos, objetivos variados, golosinas especiales, combinaciones
// entre especiales, cascadas, glaseado, bloques de chocolate y mapa con estrellas.
import { arcade, FONT, roundRect } from '../core/arcade.js';
import { candyImage, preload } from '../../candies.js';

const COLORS = ['caramelo', 'gomita', 'confite', 'chupetin', 'bombon', 'chicle'];
const NAMES = ['caramelos', 'gomitas', 'confites', 'chupetines', 'bombones', 'chicles'];
const TINT = ['#ef476f', '#06d6a0', '#ffd166', '#ff6b35', '#8a4a33', '#ff8fb1'];
const N = 8, CS = 42, OX = 12, OY = 154, W = 360, H = 560;
const SPECIALS = ['lh', 'lv', 'bomb', 'fish', 'rainbow'];

const WORLDS = [
  { name: 'Fábrica de Gomitas', top: '#ffc2d6', bot: '#ff8fb1', road: '#fff3f5', ink: '#7a1f3d' },
  { name: 'Valle de Chocolate', top: '#d9a27e', bot: '#7a3e2b', road: '#ffd9a8', ink: '#3b1f2b' },
  { name: 'Torre de Caramelo', top: '#b9e6ff', bot: '#5aa9e6', road: '#fff7d6', ink: '#173a5c' }
];
const MASKS = {
  full: null,
  diamond: ['...##...', '..####..', '.######.', '########', '########', '.######.', '..####..', '...##...'],
  cross: ['..####..', '..####..', '########', '########', '########', '########', '..####..', '..####..'],
  frame: ['########', '########', '##.##.##', '########', '########', '##.##.##', '########', '########'],
  notch: ['###..###', '########', '########', '########', '########', '########', '########', '###..###'],
  heart: ['.##..##.', '########', '########', '########', '.######.', '..####..', '..####..', '...##...']
};
// [tipo, objetivo, movimientos, colores, máscara, extra]
const SPEC = [
  ['score', 1200, 20, 5, 'full'], ['collect', { 0: 14, 1: 14 }, 20, 5, 'full'], ['jelly', 'center', 22, 5, 'full'],
  ['score', 2200, 18, 5, 'diamond'], ['blocks', 'row', 22, 5, 'full'], ['special', 4, 20, 5, 'full'],
  ['collect', { 2: 20, 3: 18 }, 22, 5, 'cross'], ['jelly', 'rows', 24, 5, 'full'], ['blocks', 'corners', 22, 5, 'notch'], ['score', 4000, 22, 5, 'heart'],
  ['jelly', 'x', 22, 6, 'full'], ['collect', { 4: 22, 5: 22 }, 24, 6, 'full'], ['blocks', 'checker', 24, 6, 'full'],
  ['score', 5000, 22, 6, 'frame'], ['special', 7, 22, 6, 'full'], ['jelly', 'border', 24, 6, 'cross'],
  ['collect', { 0: 25, 2: 25 }, 24, 6, 'diamond'], ['blocks', 'wall', 26, 6, 'full'], ['jelly', 'all1', 26, 6, 'notch'], ['score', 7000, 24, 6, 'full'],
  ['jelly', 'all2', 30, 6, 'full'], ['collect', { 1: 30, 3: 30 }, 26, 6, 'frame'], ['blocks', 'row2', 26, 6, 'heart'],
  ['special', 10, 26, 6, 'full'], ['jelly', 'x2', 28, 6, 'diamond'], ['score', 9000, 25, 6, 'cross'],
  ['blocks', 'checker2', 28, 6, 'full'], ['collect', { 4: 35, 5: 35 }, 28, 6, 'notch'], ['jelly', 'all2', 30, 6, 'heart'], ['score', 12000, 28, 6, 'frame']
];
const LEVELS = SPEC.map(([type, goal, moves, colors, mask], i) => {
  const n = i + 1;
  const s1 = type === 'score' ? goal : moves * 160 + n * 60;
  return { n, world: Math.floor(i / 10), type, goal, moves, colors, mask, stars: [s1, Math.round(s1 * 1.8), Math.round(s1 * 2.7)] };
});

const jellyPattern = (name, r, c) => ({
  center: r >= 2 && r <= 5 && c >= 2 && c <= 5 ? 1 : 0,
  rows: r === 3 || r === 4 ? 1 : 0,
  x: r === c || r + c === N - 1 ? 1 : 0,
  x2: r === c || r + c === N - 1 ? 2 : (r === 3 || r === 4) ? 1 : 0,
  border: r === 0 || c === 0 || r === N - 1 || c === N - 1 ? 1 : 0,
  all1: 1, all2: r >= 2 && r <= 5 ? 2 : 1
}[name] || 0);
const blockPattern = (name, r, c) => ({
  row: r === 4 && c % 2 === 0 ? 1 : 0,
  row2: (r === 4 || r === 5) && c >= 1 && c <= 6 ? 2 : 0,
  corners: (r >= 6 && (c <= 1 || c >= 6)) ? 1 : 0,
  checker: r >= 5 && (r + c) % 2 === 0 ? 1 : 0,
  checker2: r >= 4 && (r + c) % 2 === 0 ? 2 : 0,
  wall: r === 5 ? (c % 3 === 1 ? 2 : 1) : 0
}[name] || 0);

export default {
  mount(root, ctx) {
    const data = ctx.data;
    data.unlocked ||= 1; data.stars ||= {}; data.best ||= {};
    let mode = 'map', world = Math.min(2, Math.floor((data.unlocked - 1) / 10)), mapSel = Math.min(data.unlocked, 30);
    let L = null, grid = [], hole = [], jelly = [], dying = [], effects = [], timers = [];
    let moves = 0, score = 0, collect = {}, specialsMade = 0, cleared = 0, busy = false, sel = null, cursor = { r: 0, c: 0 }, kbd = false;
    let idle = 0, hintCells = null, drag = null, finished = false, uid = 0;

    /* ---------- Tiempo de juego (se congela en pausa) ---------- */
    const wait = s => new Promise(r => timers.push({ t: s, r }));
    const settle = () => new Promise(r => timers.push({ settle: true, r }));
    const moving = () => grid.some(row => row.some(t => t && (t.x !== t.tx || t.y !== t.ty))) || dying.length > 0;

    /* ---------- Tablero ---------- */
    const inside = (r, c) => r >= 0 && r < N && c >= 0 && c < N && !hole[r][c];
    const tile = (r, c) => (inside(r, c) ? grid[r][c] : null);
    const matchable = t => t && t.color >= 0 && t.kind !== 'block' && t.kind !== 'rainbow';
    const mk = (color, kind, r, c, fromY = r) => ({ id: uid++, color, kind, hp: 0, x: c, y: fromY, tx: c, ty: r, vy: 0, s: 1 });
    const rand = () => (Math.random() * L.colors) | 0;

    function setupLevel(n) {
      L = LEVELS[n - 1];
      mode = 'play'; finished = false; busy = true;
      moves = L.moves; score = 0; specialsMade = 0; cleared = 0; collect = {}; dying = []; effects = []; sel = null; hintCells = null;
      if (L.type === 'collect') for (const [k, v] of Object.entries(L.goal)) collect[k] = v;
      const mask = MASKS[L.mask];
      for (let r = 0; r < N; r++) {
        grid[r] = []; hole[r] = []; jelly[r] = [];
        for (let c = 0; c < N; c++) {
          hole[r][c] = mask ? mask[r][c] === '.' : false;
          jelly[r][c] = !hole[r][c] && L.type === 'jelly' ? jellyPattern(L.goal, r, c) : 0;
          grid[r][c] = null;
        }
      }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (hole[r][c]) continue;
        const hp = L.type === 'blocks' ? blockPattern(L.goal, r, c) : 0;
        if (hp) { const t = mk(-1, 'block', r, c, r - N); t.hp = hp; grid[r][c] = t; continue; }
        let col, tries = 0;
        do { col = rand(); tries++; } while (tries < 20 && ((tile(r, c - 1)?.color === col && tile(r, c - 2)?.color === col) || (tile(r - 1, c)?.color === col && tile(r - 2, c)?.color === col)));
        grid[r][c] = mk(col, 'n', r, c, r - N - (N - c) * .15);
      }
      if (!findMove()) shuffle();
      cursor = { r: 3, c: 3 };
      ctx.music(['gomitas', 'chocolate', 'plaza'][L.world]);
      a.banner(`Nivel ${n}`, objectiveText(), 2);
      settle().then(() => { busy = false; });
      hud();
    }

    function objectiveText() {
      if (!L) return '';
      switch (L.type) {
        case 'score': return `Conseguí ${L.goal.toLocaleString('es-AR')} puntos`;
        case 'collect': return 'Juntá ' + Object.entries(L.goal).map(([k, v]) => `${v} ${NAMES[k]}`).join(' y ');
        case 'jelly': return 'Limpiá todo el glaseado rosa';
        case 'blocks': return 'Rompé todos los bloques de chocolate';
        case 'special': return `Creá ${L.goal} golosinas especiales`;
      }
    }
    const jellyLeft = () => jelly.flat().reduce((s, v) => s + v, 0);
    const blocksLeft = () => grid.flat().filter(t => t?.kind === 'block').length;
    function objectiveDone() {
      switch (L.type) {
        case 'score': return score >= L.goal;
        case 'collect': return Object.values(collect).every(v => v <= 0);
        case 'jelly': return jellyLeft() === 0;
        case 'blocks': return blocksLeft() === 0;
        case 'special': return specialsMade >= L.goal;
      }
    }
    const starsFor = sc => L.stars.filter(t => sc >= t).length;
    function hud() {
      if (mode !== 'play') { ctx.hud({ Mundo: world + 1, Estrellas: Object.values(data.stars).reduce((s, v) => s + v, 0) }); return; }
      ctx.hud({ Nivel: L.n, Movimientos: moves, Puntos: score.toLocaleString('es-AR') });
    }

    /* ---------- Coincidencias ---------- */
    function findGroups(swapped = []) {
      const runs = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
        const t = tile(r, c); if (!matchable(t)) { c++; continue; }
        let k = c + 1; while (k < N && matchable(tile(r, k)) && tile(r, k).color === t.color) k++;
        if (k - c >= 3) runs.push({ dir: 'h', cells: Array.from({ length: k - c }, (_, i) => [r, c + i]) });
        c = k;
      }
      for (let c = 0; c < N; c++) for (let r = 0; r < N;) {
        const t = tile(r, c); if (!matchable(t)) { r++; continue; }
        let k = r + 1; while (k < N && matchable(tile(k, c)) && tile(k, c).color === t.color) k++;
        if (k - r >= 3) runs.push({ dir: 'v', cells: Array.from({ length: k - r }, (_, i) => [r + i, c]) });
        r = k;
      }
      // unir corridas que se cruzan (L y T)
      const groups = [];
      for (const run of runs) {
        const keys = new Set(run.cells.map(([r, c]) => r * N + c));
        const hit = groups.filter(g => [...keys].some(k => g.keys.has(k)));
        const g = { keys, runs: [run] };
        for (const h of hit) { h.keys.forEach(k => g.keys.add(k)); g.runs.push(...h.runs); groups.splice(groups.indexOf(h), 1); }
        groups.push(g);
      }
      // cuadrados de 2×2 que no forman parte de una corrida
      const used = new Set(groups.flatMap(g => [...g.keys]));
      for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) {
        const t = tile(r, c); if (!matchable(t)) continue;
        const cells = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
        if (cells.every(([y, x]) => matchable(tile(y, x)) && tile(y, x).color === t.color && !used.has(y * N + x))) {
          const keys = new Set(cells.map(([y, x]) => y * N + x)); keys.forEach(k => used.add(k));
          groups.push({ keys, runs: [], square: true });
        }
      }
      // qué especial nace de cada grupo y dónde
      for (const g of groups) {
        const max = Math.max(0, ...g.runs.map(r => r.cells.length));
        const dirs = new Set(g.runs.map(r => r.dir));
        g.make = max >= 5 ? 'rainbow' : dirs.size === 2 && g.keys.size >= 5 ? 'bomb' : max === 4 ? (g.runs.find(r => r.cells.length === 4).dir === 'h' ? 'lv' : 'lh') : g.square ? 'fish' : null;
        const sw = swapped.map(([r, c]) => r * N + c).find(k => g.keys.has(k));
        const longest = g.runs.sort((a, b) => b.cells.length - a.cells.length)[0];
        g.at = sw ?? (longest ? (([r, c]) => r * N + c)(longest.cells[longest.cells.length >> 1]) : [...g.keys][0]);
        g.color = tile((g.at / N) | 0, g.at % N).color;
      }
      return groups;
    }

    function findMove() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const a1 = tile(r, c), b1 = tile(r + dr, c + dc);
        if (!a1 || !b1 || a1.kind === 'block' || b1.kind === 'block') continue;
        if ((SPECIALS.includes(a1.kind) && SPECIALS.includes(b1.kind)) || a1.kind === 'rainbow' || b1.kind === 'rainbow') return [[r, c], [r + dr, c + dc]];
        swapData([r, c], [r + dr, c + dc]); const ok = findGroups().length > 0; swapData([r, c], [r + dr, c + dc]);
        if (ok) return [[r, c], [r + dr, c + dc]];
      }
      return null;
    }
    function swapData([r1, c1], [r2, c2]) { const t = grid[r1][c1]; grid[r1][c1] = grid[r2][c2]; grid[r2][c2] = t; }
    function place() { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const t = grid[r][c]; if (t) { t.tx = c; t.ty = r; } } }
    function shuffle() {
      const ts = grid.flat().filter(t => t && t.kind === 'n');
      let tries = 0;
      do {
        const cols = ts.map(t => t.color).sort(() => Math.random() - .5);
        ts.forEach((t, i) => (t.color = cols[i]));
        tries++;
      } while ((findGroups().length || !findMove()) && tries < 60);
      if (!findMove()) ts.forEach(t => (t.color = rand()));
    }

    /* ---------- Limpiar celdas (con reacciones en cadena) ---------- */
    function areaOf(t, r, c) {
      const out = [];
      const add = (y, x) => { if (inside(y, x)) out.push([y, x]); };
      if (t.kind === 'lh') { for (let x = 0; x < N; x++) add(r, x); effects.push({ type: 'beam', r, dir: 'h', t: .35 }); }
      if (t.kind === 'lv') { for (let y = 0; y < N; y++) add(y, c); effects.push({ type: 'beam', c, dir: 'v', t: .35 }); }
      if (t.kind === 'bomb') { for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) add(y, x); effects.push({ type: 'ring', r, c, rad: 1.6, t: .4 }); ctx.sfx.explode(.6); a.fx.shake(3, .2); }
      if (t.kind === 'fish') { for (const [y, x] of fishTargets(3)) { add(y, x); effects.push({ type: 'arrow', r, c, r2: y, c2: x, t: .35 }); } }
      if (t.kind === 'rainbow') {
        const counts = {}; grid.flat().forEach(q => { if (matchable(q)) counts[q.color] = (counts[q.color] || 0) + 1; });
        const col = Number(Object.entries(counts).sort((p, q) => q[1] - p[1])[0]?.[0] ?? 0);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (tile(y, x)?.color === col && tile(y, x).kind !== 'block') add(y, x);
        effects.push({ type: 'ring', r, c, rad: 4, t: .5, rainbow: true });
      }
      return out;
    }
    function fishTargets(n) {
      const cand = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const t = tile(r, c); if (!t) continue;
        let w = 1;
        if (jelly[r][c]) w += 6;
        if (t.kind === 'block') w += 5;
        if (collect[t.color] > 0) w += 4;
        cand.push({ r, c, w: w + Math.random() });
      }
      return cand.sort((p, q) => q.w - p.w).slice(0, n).map(o => [o.r, o.c]);
    }

    async function clearCells(cells, cascade, protect = new Set(), matchCells = new Set()) {
      const todo = [...cells], done = new Set();
      while (todo.length) {
        const [r, c] = todo.pop(); const k = r * N + c;
        if (done.has(k) || protect.has(k) || !inside(r, c)) continue;
        done.add(k);
        const t = grid[r][c]; if (!t) continue;
        if (SPECIALS.includes(t.kind)) { ctx.sfx.combo(cascade + 1); todo.push(...areaOf(t, r, c)); }
      }
      // bloques vecinos de una combinación también se dañan
      for (const k of matchCells) {
        const r = (k / N) | 0, c = k % N;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = tile(r + dr, c + dc); if (q?.kind === 'block') done.add((r + dr) * N + c + dc); }
      }
      let pts = 0, bonusMoves = 0;
      for (const k of done) {
        const r = (k / N) | 0, c = k % N, t = grid[r][c];
        if (jelly[r][c] && t?.kind !== 'block') { jelly[r][c]--; pts += 100; a.fx.burst(OX + c * CS + CS / 2, OY + r * CS + CS / 2, { n: 6, colors: ['#ff8fb1', '#fff'], speed: 70 }); }
        if (!t) continue;
        if (t.kind === 'block') {
          t.hp--; pts += 50;
          a.fx.burst(OX + c * CS + CS / 2, OY + r * CS + CS / 2, { n: 8, colors: ['#5b2d1f', '#7a3e2b', '#c98b6b'], speed: 90, shape: 'square' });
          if (t.hp > 0) continue;
          pts += 100;
        } else {
          pts += 20 * cascade;
          cleared++;
          if (collect[t.color] > 0) collect[t.color]--;
          if (t.kind === 'surprise') {
            if (Math.random() < .5) { bonusMoves += 3; a.fx.text(OX + c * CS + CS / 2, OY + r * CS, '+3 movimientos', '#06d6a0', 13); }
            else { pts += 500; a.fx.text(OX + c * CS + CS / 2, OY + r * CS, '+500', '#ffd166', 15); }
            ctx.sfx.powerup();
          }
          a.fx.burst(OX + c * CS + CS / 2, OY + r * CS + CS / 2, { n: 7, colors: [TINT[t.color] || '#fff', '#fff'], speed: 110, life: .5 });
        }
        grid[r][c] = null; dying.push(t);
      }
      moves += bonusMoves; score += pts;
      return pts;
    }

    function gravity() {
      for (let c = 0; c < N; c++) {
        const rows = []; for (let r = 0; r < N; r++) if (!hole[r][c]) rows.push(r);
        const tiles = rows.map(r => grid[r][c]).filter(Boolean);
        rows.forEach(r => (grid[r][c] = null));
        let i = rows.length - 1;
        for (let j = tiles.length - 1; j >= 0; j--, i--) grid[rows[i]][c] = tiles[j];
        const missing = i + 1;
        for (let k = 0; k < missing; k++) {
          const r = rows[k];
          let col = rand(), kind = 'n';
          if (L.n >= 3 && Math.random() < .018 && !grid.flat().some(t => t?.kind === 'surprise')) kind = 'surprise';
          grid[r][c] = mk(col, kind, r, c, rows[0] - (missing - k) - .2);
        }
      }
      place();
    }

    async function resolve(swapped = []) {
      let cascade = 0;
      for (;;) {
        const groups = findGroups(swapped);
        if (!groups.length) break;
        cascade++;
        const all = new Set(), protect = new Set(), creates = [];
        for (const g of groups) {
          g.keys.forEach(k => all.add(k));
          if (g.make) { protect.add(g.at); creates.push(g); }
        }
        const cells = [...all].map(k => [(k / N) | 0, k % N]);
        // la celda donde nace un especial: si ya era especial, se activa igual
        for (const g of creates) {
          const t = grid[(g.at / N) | 0][g.at % N];
          if (t && SPECIALS.includes(t.kind)) protect.delete(g.at);
        }
        ctx.sfx.combo(cascade);
        if (cascade >= 2) a.fx.text(W / 2, OY - 14, cascade >= 4 ? `¡Dulcísimo! x${cascade}` : `Cascada x${cascade}`, '#ffd166', 16);
        await clearCells(cells, cascade, protect, all);
        for (const g of creates) {
          const r = (g.at / N) | 0, c = g.at % N;
          const t = grid[r][c] || (grid[r][c] = mk(g.color, 'n', r, c));
          t.kind = g.make; if (g.make === 'rainbow') t.color = -2; else t.color = g.color;
          t.s = 1.6; specialsMade++; score += { lh: 60, lv: 60, bomb: 100, fish: 80, rainbow: 200 }[g.make];
          ctx.sfx.powerup();
        }
        hud();
        await wait(.14);
        gravity();
        await settle();
        swapped = [];
      }
      return cascade;
    }

    async function comboSwap(p, q) {
      const A = tile(...p), B = tile(...q);
      const area = [];
      const sweep = (fn) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (inside(r, c) && fn(r, c)) area.push([r, c]); };
      const kinds = [A.kind, B.kind];
      const rb = A.kind === 'rainbow' ? A : B.kind === 'rainbow' ? B : null;
      const other = rb === A ? B : A, op = rb === A ? q : p;
      if (rb && other.kind === 'rainbow') { sweep(() => true); effects.push({ type: 'ring', r: q[0], c: q[1], rad: 8, t: .7, rainbow: true }); a.fx.shake(6, .4); ctx.sfx.explode(1.4); }
      else if (rb && other.kind === 'n' || rb && other.kind === 'surprise') { const col = other.color; sweep((r, c) => tile(r, c)?.color === col); area.push(p, q); effects.push({ type: 'ring', r: op[0], c: op[1], rad: 5, t: .5, rainbow: true }); }
      else if (rb) {
        const col = other.color, kind = other.kind;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const t = tile(r, c); if (t && t.color === col && t.kind !== 'block') { t.kind = kind === 'lh' || kind === 'lv' ? (Math.random() < .5 ? 'lh' : 'lv') : kind; t.s = 1.4; area.push([r, c]); } }
        area.push(p, q); await wait(.35);
      } else if (kinds.every(k => k === 'lh' || k === 'lv')) { sweep((r, c) => r === q[0] || c === q[1]); effects.push({ type: 'beam', r: q[0], dir: 'h', t: .4 }, { type: 'beam', c: q[1], dir: 'v', t: .4 }); }
      else if (kinds.includes('bomb') && kinds.some(k => k === 'lh' || k === 'lv')) { sweep((r, c) => Math.abs(r - q[0]) <= 1 || Math.abs(c - q[1]) <= 1); a.fx.shake(5, .3); }
      else if (kinds[0] === 'bomb' && kinds[1] === 'bomb') { sweep((r, c) => Math.abs(r - q[0]) <= 2 && Math.abs(c - q[1]) <= 2); effects.push({ type: 'ring', r: q[0], c: q[1], rad: 2.8, t: .5 }); a.fx.shake(6, .35); ctx.sfx.explode(1.2); }
      else area.push(p, q);
      // quitar el arcoíris del tablero sin volver a activarlo
      for (const t of [A, B]) if (t.kind === 'rainbow') { const pos = t === tile(...p) ? p : q; grid[pos[0]][pos[1]] = null; dying.push(t); }
      ctx.sfx.combo(5);
      await clearCells(area, 2);
      hud();
      await wait(.12); gravity(); await settle();
      await resolve();
    }

    async function trySwap(p, q) {
      if (busy || finished || !inside(...p) || !inside(...q)) return;
      const A = tile(...p), B = tile(...q);
      if (!A || !B || A.kind === 'block' || B.kind === 'block') return;
      busy = true; sel = null; hintCells = null; idle = 0;
      swapData(p, q); place(); ctx.sfx.flip();
      await settle();
      const special = (SPECIALS.includes(A.kind) && SPECIALS.includes(B.kind)) || A.kind === 'rainbow' || B.kind === 'rainbow';
      if (special) { moves--; hud(); await comboSwap(q, p); }
      else if (findGroups().length) { moves--; hud(); await resolve([p, q]); }
      else { swapData(p, q); place(); ctx.sfx.error(); await settle(); busy = false; return; }
      if (!findMove()) { a.banner('¡Mezclando!', '', 1); await wait(.6); shuffle(); }
      hud();
      await checkEnd();
      busy = false;
    }

    async function checkEnd() {
      if (finished) return;
      if (objectiveDone() && (L.type !== 'score' || score >= L.goal)) {
        finished = true;
        a.banner('¡Objetivo cumplido!', moves ? 'Dulce final: cada movimiento sobrante es un bonus' : '', 1.6);
        ctx.sfx.fanfare();
        await wait(1.2);
        // Dulce final: los movimientos sobrantes se vuelven chupetines relámpago
        while (moves > 0) {
          const opts = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const t = tile(r, c); if (t?.kind === 'n') opts.push([r, c]); }
          if (!opts.length) break;
          const [r, c] = opts[(Math.random() * opts.length) | 0];
          grid[r][c].kind = Math.random() < .5 ? 'lh' : 'lv'; grid[r][c].s = 1.6;
          moves--; score += 120; hud(); ctx.sfx.coin();
          await wait(.12);
          await clearCells([[r, c]], 2); gravity(); await settle(); await resolve();
        }
        await wait(.4);
        win();
      } else if (moves <= 0) {
        finished = true;
        a.banner('Sin movimientos', objectiveText(), 1.4);
        await wait(1.2);
        a.end({ score, won: false, stars: 0, title: '¡Casi!', againLabel: 'Reintentar nivel', extra: { candies: cleared }, summary: `Nivel ${L.n}: te faltó ${remainingText()}.` });
        data.pending = L.n; ctx.save();
      }
    }
    function remainingText() {
      switch (L.type) {
        case 'score': return `${(L.goal - score).toLocaleString('es-AR')} puntos`;
        case 'collect': return Object.entries(collect).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${NAMES[k]}`).join(' y ');
        case 'jelly': return `${jellyLeft()} capas de glaseado`;
        case 'blocks': return `${blocksLeft()} bloques de chocolate`;
        case 'special': return `${L.goal - specialsMade} especiales`;
      }
    }
    function win() {
      const st = Math.max(1, starsFor(score));
      data.stars[L.n] = Math.max(data.stars[L.n] || 0, st);
      data.best[L.n] = Math.max(data.best[L.n] || 0, score);
      if (L.n < LEVELS.length) data.unlocked = Math.max(data.unlocked, L.n + 1);
      data.pending = Math.min(LEVELS.length, L.n + 1);
      ctx.save();
      a.end({ score, won: true, stars: st, title: `¡Nivel ${L.n} superado!`, againLabel: L.n < LEVELS.length ? 'Siguiente nivel' : 'Volver a jugar',
        extra: { level: L.n, candies: cleared }, summary: `${WORLDS[L.world].name} · ${st} ${st === 1 ? 'estrella' : 'estrellas'}.` });
    }

    /* ---------- Mapa de niveles ---------- */
    const nodePos = i => { const k = i % 10; return { x: 90 + (k % 2 ? 180 : 0) + (k % 4 === 2 ? 40 : k % 4 === 3 ? -40 : 0), y: 470 - k * 40 }; };
    function mapHit(x, y) {
      if (y > 515 && x < 90) return 'prev';
      if (y > 515 && x > 270) return 'next';
      for (let i = world * 10; i < world * 10 + 10; i++) { const p = nodePos(i); if (Math.hypot(x - p.x, y - p.y) < 22) return i + 1; }
      return null;
    }
    function openLevel(n) { if (n > data.unlocked) { ctx.sfx.error(); return; } ctx.sfx.click(); setupLevel(n); }

    /* ---------- Entrada ---------- */
    const cellAt = (x, y) => { const c = Math.floor((x - OX) / CS), r = Math.floor((y - OY) / CS); return inside(r, c) ? [r, c] : null; };
    function onPointer(type, x, y) {
      kbd = false;
      if (mode === 'map') {
        if (type !== 'down') return;
        const h = mapHit(x, y);
        if (h === 'prev' && world > 0) { world--; ctx.sfx.flip(); hud(); }
        else if (h === 'next' && world < 2) { world++; ctx.sfx.flip(); hud(); }
        else if (typeof h === 'number') openLevel(h);
        return;
      }
      if (busy || finished) return;
      if (type === 'down') {
        const p = cellAt(x, y); if (!p) return;
        drag = { p, x, y };
        if (sel && Math.abs(sel[0] - p[0]) + Math.abs(sel[1] - p[1]) === 1) { const s = sel; sel = null; drag = null; trySwap(s, p); return; }
        sel = tile(...p)?.kind === 'block' ? null : p; ctx.sfx.click();
      } else if (type === 'move' && drag) {
        const dx = x - drag.x, dy = y - drag.y;
        if (Math.hypot(dx, dy) > CS * .45) {
          const p = drag.p, q = Math.abs(dx) > Math.abs(dy) ? [p[0], p[1] + Math.sign(dx)] : [p[0] + Math.sign(dy), p[1]];
          drag = null; sel = null; trySwap(p, q);
        }
      } else if (type === 'up' || type === 'cancel') drag = null;
    }

    function keys() {
      const dir = a.hit('left') ? [0, -1] : a.hit('right') ? [0, 1] : a.hit('up') ? [-1, 0] : a.hit('down') ? [1, 0] : null;
      if (mode === 'map') {
        if (dir) {
          let n = mapSel + (dir[1] || -dir[0]);
          n = Math.max(1, Math.min(30, n)); mapSel = n; world = Math.floor((n - 1) / 10); kbd = true; ctx.sfx.tick(); hud();
        }
        if (a.hit('a')) openLevel(mapSel);
        return;
      }
      if (busy || finished) return;
      if (dir) {
        kbd = true;
        if (sel) { const q = [sel[0] + dir[0], sel[1] + dir[1]]; const s = sel; sel = null; trySwap(s, q); return; }
        cursor = { r: Math.max(0, Math.min(N - 1, cursor.r + dir[0])), c: Math.max(0, Math.min(N - 1, cursor.c + dir[1])) };
      }
      if (a.hit('a')) { kbd = true; sel = sel ? null : inside(cursor.r, cursor.c) ? [cursor.r, cursor.c] : null; ctx.sfx.click(); }
    }

    /* ---------- Actualización ---------- */
    function update(dt) {
      keys();
      for (const row of grid) for (const t of row) {
        if (!t) continue;
        if (t.s > 1) t.s = Math.max(1, t.s - dt * 2.5);
        if (t.ty > t.y + .001) { t.vy = Math.min(t.vy + 60 * dt, 18); t.y = Math.min(t.ty, t.y + t.vy * dt); if (t.y === t.ty) t.vy = 0; }
        else if (t.y !== t.ty || t.x !== t.tx) {
          const sp = 9 * dt, dx = t.tx - t.x, dy = t.ty - t.y;
          t.x = Math.abs(dx) <= sp ? t.tx : t.x + Math.sign(dx) * sp;
          t.y = Math.abs(dy) <= sp ? t.ty : t.y + Math.sign(dy) * sp;
        }
      }
      for (const d of dying) d.s -= dt * 6;
      dying = dying.filter(d => d.s > 0);
      for (const e of effects) e.t -= dt;
      effects = effects.filter(e => e.t > 0);
      for (const tm of timers) {
        if (tm.settle) { if (!moving()) tm.done = true; }
        else if ((tm.t -= dt) <= 0) tm.done = true;
      }
      const ready = timers.filter(t => t.done); timers = timers.filter(t => !t.done); ready.forEach(t => t.r());
      if (mode === 'play' && !busy && !finished) {
        idle += dt;
        if (idle > 6 && !hintCells) hintCells = findMove();
      }
    }

    /* ---------- Dibujo ---------- */
    function drawCandy(g, t, cx, cy, size) {
      const s = size * t.s;
      if (t.kind === 'block') {
        g.save(); g.translate(cx, cy);
        roundRect(g, -s / 2 + 2, -s / 2 + 2, s - 4, s - 4, 7); g.fillStyle = t.hp > 1 ? '#3b1f1a' : '#5b2d1f'; g.fill();
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-s / 2 + 6, -s / 2 + 6, s - 12, 5);
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s / 2 + 3); g.lineTo(0, s / 2 - 3); g.moveTo(-s / 2 + 3, 0); g.lineTo(s / 2 - 3, 0); g.stroke();
        if (t.hp > 1) { g.strokeStyle = '#ffd166'; g.lineWidth = 2; roundRect(g, -s / 2 + 4, -s / 2 + 4, s - 8, s - 8, 6); g.stroke(); }
        g.restore(); return;
      }
      if (t.kind === 'rainbow') {
        g.save(); g.translate(cx, cy);
        const cols = ['#ef476f', '#ff6b35', '#ffd166', '#06d6a0', '#7ae0ff', '#9b6bff'];
        cols.forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, s * .4, i / 6 * Math.PI * 2 + a.time * 2, (i + 1) / 6 * Math.PI * 2 + a.time * 2); g.fill(); });
        g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(0, 0, s * .16, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-s * .15, -s * .18, s * .08, s * .04, -.6, 0, 7); g.fill();
        g.restore(); return;
      }
      if (t.kind === 'bomb') {
        g.save(); g.translate(cx, cy);
        roundRect(g, -s * .42, -s * .42, s * .84, s * .84, 9); g.fillStyle = '#4a2318'; g.fill();
        g.strokeStyle = TINT[t.color]; g.lineWidth = 3; g.stroke(); g.restore();
      }
      const { img } = candyImage(COLORS[t.color] || 'caramelo');
      const k = t.kind === 'bomb' ? .62 : .86;
      g.drawImage(img, cx - s * k / 2, cy - s * k / 2, s * k, s * k);
      if (t.kind === 'lh' || t.kind === 'lv') {
        g.save(); g.translate(cx, cy); if (t.kind === 'lv') g.rotate(Math.PI / 2);
        g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2.5;
        for (const y of [-6, 0, 6]) { g.beginPath(); g.moveTo(-s * .38, y); g.lineTo(s * .38, y); g.stroke(); }
        g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(-3, -9); g.lineTo(4, -1); g.lineTo(0, -1); g.lineTo(3, 9); g.lineTo(-4, 1); g.lineTo(0, 1); g.closePath(); g.fill();
        g.restore();
      }
      if (t.kind === 'fish') {
        for (let i = 0; i < 4; i++) { const an = a.time * 3 + i * Math.PI / 2; g.fillStyle = TINT[(t.color + i + 1) % 6]; g.beginPath(); g.arc(cx + Math.cos(an) * s * .38, cy + Math.sin(an) * s * .38, 3.5, 0, 7); g.fill(); }
      }
      if (t.kind === 'surprise') {
        g.fillStyle = '#ffd166'; g.fillRect(cx - s * .4, cy - 3, s * .8, 6); g.fillRect(cx - 3, cy - s * .4, 6, s * .8);
        g.beginPath(); g.ellipse(cx - 6, cy - s * .38, 6, 4, -.5, 0, 7); g.ellipse(cx + 6, cy - s * .38, 6, 4, .5, 0, 7); g.fill();
      }
    }

    function drawPlay(g) {
      const wv = WORLDS[L.world];
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, wv.top); grd.addColorStop(1, wv.bot);
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // panel superior: objetivo, movimientos y barra de estrellas
      roundRect(g, 10, 10, W - 20, 132, 18); g.fillStyle = 'rgba(59,31,43,.82)'; g.fill();
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillStyle = '#ffd166'; g.font = `700 15px ${FONT}`; g.fillText(`Nivel ${L.n} · ${wv.name}`, 24, 34);
      g.fillStyle = '#fff'; g.font = `600 13px ${FONT}`; g.fillText(objectiveText(), 24, 54);
      // objetivos con íconos
      let ox = 24;
      const chip = (label, val, draw) => { roundRect(g, ox, 64, 92, 36, 12); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); draw(ox + 18, 82); g.fillStyle = val === '✓' ? '#06d6a0' : '#fff'; g.font = `700 15px ${FONT}`; g.fillText(String(val), ox + 38, 88); ox += 100; };
      if (L.type === 'collect') for (const [k, v] of Object.entries(collect)) chip(NAMES[k], v > 0 ? v : '✓', (x, y) => g.drawImage(candyImage(COLORS[k]).img, x - 13, y - 13, 26, 26));
      if (L.type === 'jelly') { const v = jellyLeft(); chip('glaseado', v || '✓', (x, y) => { roundRect(g, x - 11, y - 11, 22, 22, 6); g.fillStyle = '#ff8fb1'; g.fill(); }); }
      if (L.type === 'blocks') { const v = blocksLeft(); chip('bloques', v || '✓', (x, y) => { roundRect(g, x - 11, y - 11, 22, 22, 5); g.fillStyle = '#5b2d1f'; g.fill(); }); }
      if (L.type === 'special') { const v = Math.max(0, L.goal - specialsMade); chip('especiales', v || '✓', (x, y) => { g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(x - 4, y - 11); g.lineTo(x + 5, y - 1); g.lineTo(x, y - 1); g.lineTo(x + 4, y + 11); g.lineTo(x - 5, y + 1); g.lineTo(x, y + 1); g.closePath(); g.fill(); }); }
      if (L.type === 'score') chip('meta', score >= L.goal ? '✓' : '', (x, y) => { g.fillStyle = '#ffd166'; g.font = `700 13px ${FONT}`; g.fillText(L.goal.toLocaleString('es-AR'), x - 12, y + 5); });
      // movimientos
      g.textAlign = 'right'; g.fillStyle = moves <= 3 ? '#ff8fa8' : '#fff'; g.font = `700 28px ${FONT}`; g.fillText(String(moves), W - 24, 92);
      g.font = `600 11px ${FONT}`; g.fillStyle = '#f6dbe3'; g.fillText('movimientos', W - 24, 104);
      // barra de puntos con estrellas
      const bx = 24, bw = W - 48, by = 116, max = L.stars[2] * 1.05;
      roundRect(g, bx, by, bw, 12, 6); g.fillStyle = 'rgba(255,255,255,.15)'; g.fill();
      roundRect(g, bx, by, Math.max(12, bw * Math.min(1, score / max)), 12, 6); g.fillStyle = '#06d6a0'; g.fill();
      L.stars.forEach((t, i) => { const x = bx + bw * t / max; g.fillStyle = score >= t ? '#ffd166' : 'rgba(255,255,255,.35)'; g.font = `700 16px ${FONT}`; g.textAlign = 'center'; g.fillText('★', x, by + 11); });
      g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `700 12px ${FONT}`; g.fillText(`${score.toLocaleString('es-AR')} pts`, bx, by - 3);

      // tablero
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (hole[r][c]) continue;
        const x = OX + c * CS, y = OY + r * CS;
        roundRect(g, x + 1, y + 1, CS - 2, CS - 2, 9);
        g.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.24)'; g.fill();
        if (jelly[r][c]) { roundRect(g, x + 2, y + 2, CS - 4, CS - 4, 9); g.fillStyle = jelly[r][c] > 1 ? 'rgba(239,71,111,.75)' : 'rgba(255,143,177,.6)'; g.fill(); if (jelly[r][c] > 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); } }
      }
      g.save(); g.beginPath(); g.rect(OX - 4, OY - 2, N * CS + 8, N * CS + 6); g.clip();
      for (const row of grid) for (const t of row) if (t) {
        let cx = OX + t.x * CS + CS / 2, cy = OY + t.y * CS + CS / 2;
        if (hintCells?.some(([r, c]) => grid[r][c] === t)) cy += Math.sin(a.time * 10) * 3;
        if (sel && grid[sel[0]][sel[1]] === t) { g.fillStyle = 'rgba(255,255,255,.55)'; roundRect(g, cx - CS / 2 + 2, cy - CS / 2 + 2, CS - 4, CS - 4, 10); g.fill(); }
        drawCandy(g, t, cx, cy, CS);
      }
      for (const d of dying) drawCandy(g, d, OX + d.x * CS + CS / 2, OY + d.y * CS + CS / 2, CS);
      g.restore();
      // efectos de especiales
      for (const e of effects) {
        g.globalAlpha = Math.min(1, e.t * 3);
        if (e.type === 'beam') { g.fillStyle = 'rgba(255,255,255,.85)'; if (e.dir === 'h') g.fillRect(OX, OY + e.r * CS + CS / 2 - 5, N * CS, 10); else g.fillRect(OX + e.c * CS + CS / 2 - 5, OY, 10, N * CS); }
        if (e.type === 'ring') { g.strokeStyle = e.rainbow ? `hsl(${a.time * 400 % 360} 90% 65%)` : '#ffd166'; g.lineWidth = 6; g.beginPath(); g.arc(OX + e.c * CS + CS / 2, OY + e.r * CS + CS / 2, CS * e.rad * (1.2 - e.t), 0, 7); g.stroke(); }
        if (e.type === 'arrow') { g.strokeStyle = '#ffd166'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(OX + e.c * CS + CS / 2, OY + e.r * CS + CS / 2); g.lineTo(OX + e.c2 * CS + CS / 2, OY + e.r2 * CS + CS / 2); g.stroke(); g.setLineDash([]); }
      }
      g.globalAlpha = 1;
      if (kbd && !busy) { g.strokeStyle = '#fff'; g.lineWidth = 3; roundRect(g, OX + cursor.c * CS + 2, OY + cursor.r * CS + 2, CS - 4, CS - 4, 10); g.stroke(); }
    }

    function drawMap(g) {
      const wv = WORLDS[world];
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, wv.top); grd.addColorStop(1, wv.bot);
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // decoración del mundo
      for (let i = 0; i < 9; i++) { const { img } = candyImage(COLORS[(i + world * 2) % 6]); g.globalAlpha = .25; g.drawImage(img, (i * 97) % (W - 40), 60 + (i * 53) % 400, 36, 36); }
      g.globalAlpha = 1;
      roundRect(g, 16, 12, W - 32, 52, 16); g.fillStyle = 'rgba(59,31,43,.82)'; g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd166'; g.font = `700 18px ${FONT}`; g.fillText(`Mundo ${world + 1}: ${wv.name}`, W / 2, 32);
      const total = Object.entries(data.stars).filter(([k]) => Math.floor((k - 1) / 10) === world).reduce((s, [, v]) => s + v, 0);
      g.fillStyle = '#fff'; g.font = `600 12px ${FONT}`; g.fillText(`${total}/30 estrellas en este mundo`, W / 2, 52);
      // camino
      g.strokeStyle = wv.road; g.lineWidth = 12; g.lineCap = 'round'; g.setLineDash([2, 16]); g.beginPath();
      for (let i = 0; i < 10; i++) { const p = nodePos(world * 10 + i); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
      g.stroke(); g.setLineDash([]);
      for (let i = world * 10; i < world * 10 + 10; i++) {
        const n = i + 1, p = nodePos(i), open = n <= data.unlocked, st = data.stars[n] || 0, cur = n === data.unlocked;
        if (cur) { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(p.x, p.y, 26 + Math.sin(a.time * 4) * 3, 0, 7); g.fill(); }
        g.fillStyle = open ? (st ? '#06d6a0' : '#ef476f') : '#8d7a82';
        g.beginPath(); g.arc(p.x, p.y, 20, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        if (kbd && n === mapSel) { g.strokeStyle = '#3b1f2b'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 25, 0, 7); g.stroke(); }
        g.fillStyle = '#fff'; g.font = `700 15px ${FONT}`; g.fillText(open ? String(n) : '🔒', p.x, p.y + 1);
        if (open) { g.font = `700 11px ${FONT}`; g.fillStyle = 'rgba(59,31,43,.9)'; roundRect(g, p.x - 22, p.y + 21, 44, 15, 7); g.fill(); g.fillStyle = '#ffd166'; g.fillText('★'.repeat(st) + '☆'.repeat(3 - st), p.x, p.y + 29); }
      }
      // navegación de mundos
      g.font = `700 14px ${FONT}`;
      if (world > 0) { roundRect(g, 12, 518, 76, 32, 16); g.fillStyle = 'rgba(59,31,43,.82)'; g.fill(); g.fillStyle = '#fff'; g.fillText('◀ Mundo', 50, 535); }
      if (world < 2) { roundRect(g, W - 88, 518, 76, 32, 16); g.fillStyle = 'rgba(59,31,43,.82)'; g.fill(); g.fillStyle = '#fff'; g.fillText('Mundo ▶', W - 50, 535); }
      g.fillStyle = 'rgba(59,31,43,.9)'; g.font = `600 12px ${FONT}`; g.fillText('Tocá un nivel para jugar', W / 2, 534);
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Tablero de Bongi Crush', onPointer, update,
      draw: g => (mode === 'map' ? drawMap(g) : drawPlay(g)),
      help: ['Deslizá o tocá dos golosinas vecinas para intercambiarlas.', 'Teclado: flechas para moverte, Espacio para elegir y flechas para cambiar.', '4 en línea = Chupetín relámpago · L o T = Chocolate explosivo · 5 = Gomita arcoíris · cuadrado = Caramelo multicolor.']
    });

    // Gancho para pruebas automatizadas (no afecta al jugador)
    root._debug = {
      get state() { return { mode, moves, score, busy, finished, level: L?.n, world }; },
      open: n => openLevel(n),
      move() { const m = !busy && !finished && mode === 'play' && findMove(); if (m) trySwap(...m); return !!m; }
    };
    preload([...COLORS]).then(() => {
      if (ctx.again && data.pending) { const n = data.pending; delete data.pending; ctx.save(); setupLevel(n); }
      else { delete data.pending; ctx.save(); hud(); }
      a.start();
    });
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
