// BONGI WORLD — Aventura de plataformas en 5 mundos dulces.
// Física con tiempo de gracia, salto variable y salto anticipado; bloques sorpresa y ocultos,
// plataformas móviles, trampolines, pinches, puntos de control, poderes y jefes.
import { arcade, FONT, roundRect, drawBongi } from '../core/arcade.js';

const W = 400, H = 224, T = 16, ROWS = 14;
const GRAV = 1400, JUMP = 425, JUMP2 = 370, MAXFALL = 520, WALK = 105, RUN = 170, ACC = 900, FRIC = 1200;

const WORLDS = [
  { name: 'Reino de los Chocolates', music: 'chocolate', sky: ['#ffe2c4', '#f4a77a'], ground: '#6b3524', top: '#9b5639', deco: '#b0704c', brick: '#7a3e2b', enemy: '#8a4a33', boss: 'Gran Bombonazo' },
  { name: 'Bosque de Gomitas', music: 'gomitas', sky: ['#d4fbe6', '#7fdcb0'], ground: '#2f8f5b', top: '#06d6a0', deco: '#ef476f', brick: '#ff8fb1', enemy: '#5a7d1f', boss: 'Gomitón Amargo' },
  { name: 'Montañas de Alfajores', music: 'alfajor', sky: ['#fff1c9', '#ffc96b'], ground: '#5b2d1f', top: '#f3d9b1', deco: '#d99a52', brick: '#c98a5a', enemy: '#b5522a', boss: 'Alfajorón de Tres Pisos' },
  { name: 'Fábrica de Caramelos', music: 'fabrica', sky: ['#dfe6ff', '#8fa3e8'], ground: '#4b4f72', top: '#ffd166', deco: '#7a86b8', brick: '#ef476f', enemy: '#c41e4a', boss: 'Máquina Agria' },
  { name: 'Castillo de los Dulces', music: 'castillo', sky: ['#4a2550', '#1f1030'], ground: '#7a4a6b', top: '#ff8fb1', deco: '#c9a0ff', brick: '#a05a8a', enemy: '#d4e157', boss: 'Rey Ácido' }
];

/* ---------- Trozos de nivel (14 filas). Leyenda:
   # suelo · = ladrillo · ? bloque sorpresa · P bloque con poder · H bloque oculto · - plataforma de paso
   c golosina · ^ pinches · e caminante · f volador · j saltarín · x erizo (no se pisa) · M plataforma móvil
   V plataforma vertical · S trampolín · K punto de control ---------- */
const E = '................';
const CH = {
  start: [E, E, E, E, E, E, E, E, E, E, E, E, '################', '################'],
  bloques: [E, E, E, E, '.....c.c.c......', E, E, E, '....=?=P=.......', E, E, '...........e....', '################', '################'],
  hueco: [E, E, E, E, E, E, E, E, '.......ccc......', E, E, E, '######...#######', '######...#######'],
  escalera: [E, E, E, E, E, E, E, '..............c.', '............##..', '..........####..', '........######..', '......########..', '################', '################'],
  pinches: [E, E, E, E, E, E, E, E, '......cccc......', '.....------.....', E, '...^^^^^^^^^....', '################', '################'],
  movil: [E, E, E, E, E, E, '........c.......', E, E, '...M............', E, E, '###.........####', '###.........####'],
  enemigos: [E, E, E, E, E, E, E, E, '.....=?=........', E, E, '...e.....e..e...', '################', '################'],
  volador: [E, E, E, E, '...........c....', '........f.......', E, E, E, E, E, E, '#####...########', '#####...########'],
  resorte: [E, E, E, '..cccccc........', '..------........', E, E, E, E, E, E, '......S.....e...', '################', '################'],
  secreto: [E, E, E, E, E, E, E, E, '......H.....?...', E, E, '.........j......', '################', '################'],
  cueva: [E, E, E, E, '################', '################', E, '..c.c.c.c.c.c...', E, E, E, '.....e.....e....', '################', '################'],
  columnas: [E, E, E, E, E, E, E, '....c.....c.....', E, '....##....##....', '....##....##....', '....##..e.##....', '################', '################'],
  erizos: [E, E, E, E, E, E, '..c........c....', '.------..------.', E, E, E, '....x......x....', '################', '################'],
  vertical: [E, E, E, '..........ccc...', E, '.........----...', E, E, '.....V..........', E, E, E, '###.......######', '###.......######'],
  control: [E, E, E, E, E, E, E, E, '...=?=..........', E, E, '..........K.....', '################', '################'],
  meta: [E, E, E, E, E, E, E, E, E, E, E, '..........G.....', '################', '################'],
  jefe: (() => { const r = []; for (let i = 0; i < 12; i++) r.push(i < 11 ? '........................#' : '...................B....#'); r.push('#########################', '#########################'); return r; })()
};
const POOL = [
  ['bloques', 'hueco', 'escalera', 'enemigos', 'resorte', 'secreto', 'columnas', 'pinches'],
  ['bloques', 'hueco', 'movil', 'enemigos', 'volador', 'resorte', 'secreto', 'pinches', 'columnas'],
  ['escalera', 'hueco', 'movil', 'volador', 'erizos', 'pinches', 'cueva', 'secreto', 'vertical'],
  ['movil', 'vertical', 'erizos', 'volador', 'pinches', 'cueva', 'enemigos', 'hueco', 'bloques'],
  ['erizos', 'vertical', 'movil', 'volador', 'pinches', 'cueva', 'columnas', 'hueco', 'secreto']
];
const POWERS = ['chicle', 'alfajor', 'veloz', 'confites'];
const POWER_NAMES = { chicle: 'Chicle saltarín: ¡doble salto!', alfajor: 'Alfajor escudo', veloz: 'Caramelo veloz', confites: 'Confites lanzables (botón Correr)' };

function buildStage(w, s) {
  let seed = w * 31 + s * 7 + 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pool = POOL[w], count = 6 + w + s;
  const parts = ['start'];
  for (let i = 0; i < count; i++) {
    if (i === Math.floor(count / 2)) parts.push('control');
    let k; do { k = pool[Math.floor(rnd() * pool.length)]; } while (k === parts[parts.length - 1]);
    parts.push(k);
  }
  parts.push(s === 1 ? 'jefe' : 'meta');
  const rows = Array.from({ length: ROWS }, () => '');
  for (const p of parts) CH[p].forEach((line, r) => (rows[r] += line));
  return rows;
}

export default {
  mount(root, ctx) {
    const data = ctx.data;
    data.maxWorld ??= 0; data.cleared ??= 0;
    let mode = 'select', selW = Math.min(4, data.maxWorld);
    let wIdx = 0, stage = 0, tiles = [], cols = 0, ents = [], items = [], shots = [], plats = [];
    let P = null, cam = 0, timeLeft = 200, lives = 3, coins = 0, score = 0, candies = 0, respawn = null, state = 'play', stateT = 0, hudT = 0, boss = null;
    let doubleUnlocked = !!data.double, powerIdx = 0;

    /* ---------- Carga de nivel ---------- */
    function loadStage(w, s, fromCheckpoint = false) {
      wIdx = w; stage = s;
      const rows = buildStage(w, s);
      cols = rows[0].length;
      tiles = rows.map(r => r.split(''));
      ents = []; items = []; shots = []; plats = []; boss = null;
      let spawnX = 2 * T;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < cols; c++) {
        const ch = tiles[r][c], x = c * T, y = r * T;
        const put = () => (tiles[r][c] = '.');
        if (ch === 'c') { items.push({ kind: 'candy', x: x + 4, y: y + 4, w: 8, h: 8, t: Math.random() * 6 }); put(); }
        else if ('efjx'.includes(ch)) { ents.push(enemy(ch, x, y)); put(); }
        else if (ch === 'M') { plats.push({ x, y, w: 48, h: 8, ox: x, oy: y, axis: 'x', range: 72, sp: 1.1 + w * .1, t: 0, dx: 0, dy: 0 }); put(); }
        else if (ch === 'V') { plats.push({ x, y, w: 48, h: 8, ox: x, oy: y, axis: 'y', range: 48, sp: 1.2, t: 0, dx: 0, dy: 0 }); put(); }
        else if (ch === 'S') { items.push({ kind: 'spring', x, y: y + 8, w: 16, h: 8, sq: 0 }); put(); }
        else if (ch === 'K') { items.push({ kind: 'check', x, y: y - 16, w: 12, h: 32, on: false }); put(); }
        else if (ch === 'G') { items.push({ kind: 'goal', x, y: y - 64, w: 16, h: 80 }); put(); }
        else if (ch === 'B') { boss = { kind: 'boss', x, y: y - 20, w: 34, h: 34, vx: 0, vy: 0, hp: 3, inv: 0, jumpT: 1.5, dead: false, t: 0, onGround: false }; put(); }
      }
      if (fromCheckpoint && respawn) spawnX = respawn;
      else respawn = null;
      P = { x: spawnX, y: 9 * T, w: 11, h: 14, vx: 0, vy: 0, dir: 1, onGround: false, coyote: 0, buffer: 0, jumps: 0, inv: 0, shield: P?.shield || false, speedT: 0, confites: P?.confites && fromCheckpoint || false, walk: 0, squash: 1, ride: null, blink: 0 };
      cam = Math.max(0, P.x - W * .4);
      timeLeft = 200 + w * 20;
      state = 'play';
      ctx.music(WORLDS[w].music);
      if (!fromCheckpoint) a.banner(`Mundo ${w + 1}-${s + 1}`, s === 1 ? `${WORLDS[w].name} · ¡Jefe: ${WORLDS[w].boss}!` : WORLDS[w].name, 2.2);
      hud(true);
    }
    function enemy(ch, x, y) {
      const base = { x, y, w: 14, h: 14, vx: -(28 + wIdx * 5), vy: 0, dead: 0, t: Math.random() * 6, onGround: false };
      if (ch === 'e') return { ...base, type: 'walker' };
      if (ch === 'x') return { ...base, type: 'spiky' };
      if (ch === 'j') return { ...base, type: 'jumper', jumpT: 1 };
      return { ...base, type: 'flyer', baseY: y, vx: -22 };
    }

    /* ---------- Colisiones con el mapa ---------- */
    const tileAt = (c, r) => (r < 0 || r >= ROWS || c < 0 || c >= cols ? (r >= ROWS ? '.' : '#') : tiles[r][c]);
    const solid = ch => '#=?PuX'.includes(ch);
    function moveBody(b, dt, opts = {}) {
      // eje X
      b.x += b.vx * dt;
      let hitX = false;
      for (let r = Math.floor(b.y / T); r <= Math.floor((b.y + b.h - 1) / T); r++) {
        for (const c of [Math.floor(b.x / T), Math.floor((b.x + b.w - 1) / T)]) {
          if (solid(tileAt(c, r))) {
            if (b.vx > 0) b.x = c * T - b.w; else if (b.vx < 0) b.x = (c + 1) * T;
            hitX = true;
          }
        }
      }
      // eje Y
      const prevBottom = b.y + b.h;
      b.y += b.vy * dt;
      b.onGround = false;
      let headHit = null;
      for (const c of [Math.floor((b.x + 1) / T), Math.floor((b.x + b.w - 2) / T)]) {
        if (b.vy > 0) {
          const r = Math.floor((b.y + b.h) / T), ch = tileAt(c, r);
          if (solid(ch) || (ch === '-' && prevBottom <= r * T + 1)) { b.y = r * T - b.h; b.vy = 0; b.onGround = true; }
        } else if (b.vy < 0) {
          const r = Math.floor(b.y / T), ch = tileAt(c, r);
          if (solid(ch) || (opts.hidden && ch === 'H')) { b.y = (r + 1) * T; b.vy = 0; headHit = headHit || [c, r]; }
        }
      }
      return { hitX, headHit };
    }

    /* ---------- Golpes a bloques ---------- */
    function bump(c, r) {
      const ch = tiles[r][c], x = c * T, y = r * T;
      if (ch === '?') { tiles[r][c] = 'u'; addCandy(x + 8, y - 6, true); ctx.sfx.coin(); }
      else if (ch === 'P') {
        tiles[r][c] = 'u'; ctx.sfx.powerup();
        let kind = POWERS[powerIdx++ % POWERS.length];
        if (kind === 'chicle' && doubleUnlocked) kind = POWERS[powerIdx++ % POWERS.length];
        items.push({ kind: 'power', power: kind, x: x + 2, y: y - 2, w: 12, h: 12, vx: 0, vy: 0, rise: 12, onGround: false });
      }
      else if (ch === 'H') { tiles[r][c] = 'u'; items.push({ kind: 'life', x: x + 2, y: y - 2, w: 12, h: 12, vx: 30, vy: 0, rise: 12 }); ctx.sfx.powerup(); a.fx.text(x + 8, y - 6, '¡Secreto!', '#ffd166'); }
      else if (ch === '=') { tiles[r][c] = '.'; score += 20; ctx.sfx.brick(3); a.fx.burst(x + 8, y + 8, { n: 10, colors: [WORLDS[wIdx].brick, '#fff'], speed: 140, shape: 'square', size: 3 }); }
      else if (ch === 'u' || ch === '#') ctx.sfx.bounce(0);
      // enemigos parados sobre el bloque saltan y caen
      for (const e of ents) if (!e.dead && Math.abs(e.x + e.w / 2 - (x + 8)) < 14 && Math.abs(e.y + e.h - y) < 4) killEnemy(e, 100);
    }
    function addCandy(x, y, pop) {
      candies++; coins++; score += 10;
      if (pop) a.fx.burst(x, y, { n: 6, colors: ['#ffd166', '#ef476f', '#06d6a0'], speed: 80, life: .5 });
      if (coins >= 50) { coins -= 50; lives++; ctx.sfx.fanfare(); a.fx.text(P.x, P.y - 10, '¡Vida extra!', '#06d6a0', 13); }
    }
    function killEnemy(e, pts) { e.dead = 1; e.vy = -200; score += pts; ctx.sfx.stomp(); a.fx.burst(e.x + 7, e.y + 7, { n: 10, colors: ['#ffd166', '#fff', WORLDS[wIdx].enemy], speed: 110 }); a.fx.text(e.x + 7, e.y - 4, `+${pts}`); }

    /* ---------- Daño y muerte ---------- */
    let god = false;
    function hurt() {
      if (P.inv > 0 || state !== 'play' || god) return;
      if (P.shield) { P.shield = false; P.inv = 1.4; ctx.sfx.hurt(); a.fx.shake(3, .2); a.fx.burst(P.x + 6, P.y + 7, { n: 12, colors: ['#d99a52', '#f3d9b1'], speed: 120 }); return; }
      die();
    }
    function die() {
      if (state !== 'play') return;
      if (god) { P.y = 2 * T; P.vy = 0; timeLeft = Math.max(timeLeft, 50); return; }
      state = 'dead'; stateT = 1.8; P.vy = -380; P.vx = 0; lives--; ctx.sfx.hurt(); a.fx.shake(4, .3); ctx.music('plaza');
    }

    /* ---------- Actualización ---------- */
    function update(dt) {
      if (mode === 'select') return updateSelect();
      hudT -= dt; if (hudT <= 0) { hud(); hudT = .25; }
      if (state === 'dead') {
        P.vy += GRAV * dt; P.y += P.vy * dt; stateT -= dt;
        if (stateT <= 0) {
          if (lives <= 0) return gameOver();
          loadStage(wIdx, stage, true);
        }
        return;
      }
      if (state === 'clear') {
        stateT -= dt;
        P.walk += dt * 10; P.vy += GRAV * dt; moveBody(P, dt);
        if (P.onGround && stateT > 1) P.vy = -300;
        if (timeLeft > 0) { timeLeft = Math.ceil(timeLeft); const k = Math.min(timeLeft, Math.ceil(dt * 120)); timeLeft -= k; score += k * 5; if (Math.random() < .3) ctx.sfx.tick(); }
        if (stateT <= 0 && timeLeft <= 0) nextStage();
        return;
      }

      timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; die(); return; }
      // --- jugador ---
      const left = a.down('left'), right = a.down('right'), run = a.down('b');
      const max = (run ? RUN : WALK) * (P.speedT > 0 ? 1.35 : 1);
      const accel = ACC * (P.onGround ? 1 : .7);
      if (left && !right) { P.vx = Math.max(-max, P.vx - accel * dt); P.dir = -1; }
      else if (right && !left) { P.vx = Math.min(max, P.vx + accel * dt); P.dir = 1; }
      else if (P.onGround) { const f = FRIC * dt; P.vx = Math.abs(P.vx) <= f ? 0 : P.vx - Math.sign(P.vx) * f; }
      if (Math.abs(P.vx) > max) P.vx -= Math.sign(P.vx) * ACC * dt;
      if (a.hit('a')) P.buffer = .13; else P.buffer -= dt;
      P.coyote = P.onGround ? .1 : P.coyote - dt;
      if (P.buffer > 0 && (P.coyote > 0 || P.ride)) { P.vy = -JUMP; P.buffer = 0; P.coyote = 0; P.jumps = 1; P.ride = null; ctx.sfx.jump(); P.squash = .7; }
      else if (P.buffer > 0 && doubleUnlocked && P.jumps === 1 && !P.onGround) { P.vy = -JUMP2; P.buffer = 0; P.jumps = 2; ctx.sfx.jump2(); a.fx.burst(P.x + 6, P.y + 14, { n: 8, colors: ['#ff8fb1', '#fff'], speed: 60, gravity: 0 }); }
      if (!a.down('a') && P.vy < -160) P.vy = -160;  // salto variable
      P.vy = Math.min(MAXFALL, P.vy + GRAV * dt);
      // lanzar confites
      if (P.confites && a.hit('b') && shots.length < 3) { shots.push({ x: P.x + 6 + P.dir * 6, y: P.y + 4, vx: P.dir * 220, vy: -60, life: 1.6 }); ctx.sfx.shoot(); }

      const wasGround = P.onGround;
      const { headHit } = moveBody(P, dt, { hidden: true });
      if (headHit) bump(...headHit);
      // plataformas móviles
      P.ride = null;
      for (const p of plats) {
        p.t += dt * p.sp;
        const nx = p.axis === 'x' ? p.ox + Math.sin(p.t) * p.range : p.ox, ny = p.axis === 'y' ? p.oy + Math.sin(p.t) * p.range : p.oy;
        p.dx = nx - p.x; p.dy = ny - p.y; p.x = nx; p.y = ny;
        if (P.vy >= 0 && P.x + P.w > p.x && P.x < p.x + p.w && P.y + P.h >= p.y - 2 && P.y + P.h <= p.y + 6 + Math.max(0, p.dy)) {
          P.y = p.y - P.h; P.vy = 0; P.onGround = true; P.ride = p; P.x += p.dx;
        }
      }
      if (P.onGround) { P.jumps = 0; if (!wasGround) { P.squash = 1.25; } }
      P.squash += (1 - P.squash) * Math.min(1, dt * 12);
      P.walk += Math.abs(P.vx) * dt * .12;
      if (P.inv > 0) P.inv -= dt;
      if (P.speedT > 0) P.speedT -= dt;
      P.blink = (a.time % 3) < .12;
      if (P.x < cam) { P.x = cam; P.vx = Math.max(0, P.vx); }
      if (P.y > ROWS * T + 20) { die(); return; }
      // pinches
      for (const c of [Math.floor((P.x + 2) / T), Math.floor((P.x + P.w - 2) / T)]) if (tileAt(c, Math.floor((P.y + P.h - 2) / T)) === '^') hurt();

      // --- objetos ---
      for (const it of items) {
        if (it.dead) continue;
        it.t = (it.t || 0) + dt;
        if ((it.kind === 'power' || it.kind === 'life') && it.rise > 0) { it.y -= 30 * dt; it.rise -= 30 * dt; continue; }
        if (it.kind === 'power' || it.kind === 'life') {
          if (!it.vx) it.vx = it.power === 'veloz' ? 60 : 40;
          it.vy = Math.min(MAXFALL, it.vy + GRAV * dt);
          const { hitX } = moveBody(it, dt); if (hitX) it.vx *= -1;
          if (it.power === 'veloz' && it.onGround) it.vy = -280;
          if (it.y > ROWS * T + 20) it.dead = true;
        }
        if (it.kind === 'spring') it.sq = Math.max(0, it.sq - dt * 4);
        if (overlap(P, it)) collect(it);
      }
      items = items.filter(i => !i.dead);

      // --- enemigos ---
      for (const e of ents) {
        e.t += dt;
        if (e.dead) { e.vy += GRAV * dt; e.y += e.vy * dt; e.dead += dt; continue; }
        if (e.x > cam + W + 40) continue;   // dormidos fuera de pantalla
        if (e.type === 'flyer') { e.x += e.vx * dt; e.y = e.baseY + Math.sin(e.t * 2.2) * 26; }
        else {
          if (e.type === 'jumper') { e.jumpT -= dt; if (e.onGround && e.jumpT <= 0) { e.vy = -330; e.vx = Math.sign(P.x - e.x || 1) * 50; e.jumpT = 1.4; } if (e.onGround && e.jumpT < 1.2) e.vx = 0; }
          e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
          const { hitX } = moveBody(e, dt);
          if (hitX) e.vx *= -1;
          // no caerse por los bordes
          if (e.onGround && e.type !== 'jumper') { const fc = Math.floor((e.vx > 0 ? e.x + e.w + 1 : e.x - 1) / T), fr = Math.floor((e.y + e.h + 2) / T); if (!solid(tileAt(fc, fr)) && tileAt(fc, fr) !== '-') e.vx *= -1; }
          if (e.y > ROWS * T + 20) e.dead = 9;
        }
        if (overlap(P, e) && state === 'play') {
          if (P.vy > 40 && P.y + P.h - e.y < 10 && e.type !== 'spiky') { killEnemy(e, 100); P.vy = a.down('a') ? -JUMP : -300; P.jumps = 1; }
          else hurt();
        }
      }
      ents = ents.filter(e => e.dead < 2);

      // --- confites lanzados ---
      for (const s of shots) {
        s.life -= dt; s.vy += GRAV * .6 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        const r = Math.floor((s.y + 4) / T), c = Math.floor(s.x / T);
        if (solid(tileAt(c, r))) { if (s.vy > 0) { s.y = r * T - 4; s.vy = -200; } else s.life = 0; }
        for (const e of ents) if (!e.dead && overlap({ x: s.x - 3, y: s.y - 3, w: 6, h: 6 }, e)) { killEnemy(e, 150); s.life = 0; }
        if (boss && !boss.dead && overlap({ x: s.x - 3, y: s.y - 3, w: 6, h: 6 }, boss)) { hitBoss(); s.life = 0; }
      }
      shots = shots.filter(s => s.life > 0);

      // --- jefe ---
      if (boss) updateBoss(dt);

      // --- cámara ---
      const target = P.x - W * .4 + P.dir * 30;
      cam += (target - cam) * Math.min(1, dt * 4);
      cam = Math.max(0, Math.min(cols * T - W, cam));
    }
    const overlap = (p, q) => p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;

    function collect(it) {
      if (it.kind === 'candy') { it.dead = true; addCandy(it.x + 4, it.y + 4); ctx.sfx.coin(); }
      else if (it.kind === 'life') { it.dead = true; lives++; score += 500; ctx.sfx.fanfare(); a.fx.text(it.x + 6, it.y, '¡Vida extra!', '#06d6a0', 13); }
      else if (it.kind === 'power') {
        it.dead = true; score += 300; ctx.sfx.powerup();
        if (it.power === 'chicle') { doubleUnlocked = true; data.double = true; ctx.save(); }
        if (it.power === 'alfajor') P.shield = true;
        if (it.power === 'veloz') P.speedT = 10;
        if (it.power === 'confites') P.confites = true;
        a.banner(POWER_NAMES[it.power], it.power === 'chicle' ? 'Tocá Saltar otra vez en el aire' : '', 1.6);
        a.fx.burst(P.x + 6, P.y + 6, { n: 16, speed: 130 });
      }
      else if (it.kind === 'spring' && P.vy > 0 && P.y + P.h - it.y < 10) { P.vy = -640; P.jumps = 1; it.sq = 1; ctx.sfx.jump2(); }
      else if (it.kind === 'check' && !it.on) { it.on = true; respawn = it.x; ctx.sfx.coin(); a.fx.text(it.x + 6, it.y - 4, 'Punto de control', '#06d6a0', 11); }
      else if (it.kind === 'goal' && state === 'play') { state = 'clear'; stateT = 1.8; P.vx = 30; score += 1000; ctx.sfx.fanfare(); a.fx.burst(it.x + 8, it.y + 10, { n: 40, speed: 200 }); a.banner('¡Nivel superado!', 'Bonus de tiempo', 1.6); }
    }

    function updateBoss(dt) {
      const b = boss; b.t += dt;
      if (b.dead) { b.vy += GRAV * dt; b.y += b.vy * dt; return; }
      if (P.x < b.x - W * .9) return; // todavía no llegaste a la arena
      if (!b.awake) { b.awake = true; a.banner(WORLDS[wIdx].boss, 'Saltale encima tres veces', 1.6); ctx.music('accion'); }
      b.inv = Math.max(0, b.inv - dt);
      const sp = 45 + wIdx * 10 + (3 - b.hp) * 18;
      b.vx = Math.sign(P.x - b.x) * sp;
      b.jumpT -= dt;
      if (b.onGround && b.jumpT <= 0) { b.vy = -380 - wIdx * 20; b.jumpT = 1.6 - wIdx * .12; }
      b.vy = Math.min(MAXFALL, b.vy + GRAV * dt);
      const was = b.onGround;
      moveBody(b, dt);
      if (b.onGround && !was) { a.fx.shake(3, .15); ctx.sfx.drop(); }
      if (overlap(P, b) && state === 'play') {
        if (P.vy > 40 && P.y + P.h - b.y < 14 && b.inv <= 0) { P.vy = -JUMP; P.jumps = 1; hitBoss(); }
        else if (b.inv <= .6) hurt();
      }
    }
    function hitBoss() {
      const b = boss; if (b.inv > 0) return;
      b.hp--; b.inv = 1.1; score += 500; ctx.sfx.stomp(); a.fx.shake(4, .25);
      a.fx.burst(b.x + 17, b.y + 10, { n: 18, colors: ['#ffd166', '#fff', WORLDS[wIdx].enemy], speed: 160 });
      if (b.hp <= 0) {
        b.dead = true; b.vy = -300; score += 2000; ctx.sfx.explode(1.4);
        a.banner(`¡Derrotaste a ${WORLDS[wIdx].boss}!`, '', 2);
        items.push({ kind: 'goal', x: (cols - 4) * T, y: 11 * T - 64, w: 16, h: 80 });
      }
    }

    function nextStage() {
      if (stage === 0) { loadStage(wIdx, 1); return; }
      data.cleared = Math.max(data.cleared, wIdx + 1);
      data.maxWorld = Math.max(data.maxWorld, Math.min(4, wIdx + 1));
      data.pending = Math.min(4, wIdx + 1); ctx.save();
      state = 'over';
      const last = wIdx === 4;
      a.end({ score, won: true, title: last ? '¡Salvaste el Castillo de los Dulces!' : `¡${WORLDS[wIdx].name} superado!`, againLabel: last ? 'Jugar de nuevo' : `Ir al mundo ${wIdx + 2}`,
        extra: { worlds: data.cleared, candies }, summary: `Juntaste ${candies} golosinas y te quedaron ${lives} vidas.` });
    }
    function gameOver() {
      state = 'over'; data.pending = wIdx; ctx.save();
      a.end({ score, won: false, title: '¡Sin vidas!', againLabel: 'Reintentar mundo', extra: { worlds: data.cleared, candies }, summary: `Llegaste al nivel ${wIdx + 1}-${stage + 1} con ${candies} golosinas.` });
    }

    function hud(force) {
      if (mode === 'select') { ctx.hud({ Mundos: `${data.cleared}/5` }); return; }
      ctx.hud({ Mundo: `${wIdx + 1}-${stage + 1}`, Vidas: lives, Golosinas: candies, Tiempo: Math.ceil(timeLeft), Puntos: score });
    }

    /* ---------- Selección de mundo ---------- */
    function updateSelect() {
      if (a.hit('left') || a.hit('up')) { selW = Math.max(0, selW - 1); ctx.sfx.tick(); }
      if (a.hit('right') || a.hit('down')) { selW = Math.min(data.maxWorld, selW + 1); ctx.sfx.tick(); }
      if (a.hit('a')) startWorld(selW);
    }
    function startWorld(w) {
      if (w > data.maxWorld) { ctx.sfx.error(); return; }
      mode = 'play'; lives = 3; score = 0; candies = 0; coins = 0; P = null; ctx.sfx.click();
      loadStage(w, 0);
    }
    function onPointer(type, x, y) {
      if (mode !== 'select' || type !== 'down') return;
      for (let i = 0; i < 5; i++) { const bx = 20 + i * 74; if (x > bx && x < bx + 68 && y > 70 && y < 170) { if (i === selW) startWorld(i); else { selW = Math.min(i, data.maxWorld); ctx.sfx.tick(); if (i === selW) startWorld(i); } } }
    }

    /* ---------- Dibujo ---------- */
    function drawBg(g, wv, w) {
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, wv.sky[0]); grd.addColorStop(1, wv.sky[1]);
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      const far = cam * .2, mid = cam * .5;
      g.fillStyle = wv.deco; g.globalAlpha = .35;
      if (w === 4) { g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { g.fillRect((i * 67 - far) % (W + 20), (i * 37) % 120, 2, 2); } g.fillStyle = wv.deco; }
      for (let i = -1; i < 7; i++) {
        const x = i * 90 - (far % 90);
        if (w === 0) { g.beginPath(); g.moveTo(x, 170); g.quadraticCurveTo(x + 45, 60, x + 90, 170); g.fill(); }
        else if (w === 1) { g.fillRect(x + 40, 110, 6, 70); g.beginPath(); g.arc(x + 43, 105, 22, 0, 7); g.fill(); }
        else if (w === 2) { for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + 45, 160 - k * 26, 40 - k * 8, 12, 0, 0, 7); g.fill(); } }
        else if (w === 3) { g.beginPath(); g.arc(x + 45, 120, 26, 0, 7); g.fill(); g.fillRect(x + 20, 140, 50, 40); }
        else { g.fillRect(x + 25, 90, 40, 90); g.beginPath(); g.moveTo(x + 20, 90); g.lineTo(x + 45, 55); g.lineTo(x + 70, 90); g.fill(); }
      }
      g.globalAlpha = .5;
      for (let i = -1; i < 6; i++) { const x = i * 110 - (mid % 110); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x + 50, 40 + (i % 2) * 18, 26, 9, 0, 0, 7); g.ellipse(x + 66, 36 + (i % 2) * 18, 18, 8, 0, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    }
    function drawTile(g, ch, x, y, c, r, wv) {
      if (ch === '#') {
        const top = tileAt(c, r - 1) !== '#';
        g.fillStyle = wv.ground; g.fillRect(x, y, T, T);
        if (wIdx === 2) { g.fillStyle = '#f3d9b1'; g.fillRect(x, y + 7, T, 3); }
        if (top) { g.fillStyle = wv.top; g.fillRect(x, y, T, 5); g.beginPath(); g.arc(x + 4 + (c % 3) * 3, y + 5, 3, 0, Math.PI); g.fill(); }
        else { g.fillStyle = 'rgba(0,0,0,.08)'; if ((c + r) % 2) g.fillRect(x + 3, y + 3, 4, 4); }
      } else if (ch === '=') {
        g.fillStyle = wv.brick; g.fillRect(x, y, T, T);
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, 7, 7); g.strokeRect(x + 8.5, y + .5, 7, 7); g.strokeRect(x + .5, y + 8.5, 15, 7);
      } else if (ch === '?' || ch === 'P') {
        roundRect(g, x + .5, y + .5, T - 1, T - 1, 3); g.fillStyle = '#ffd166'; g.fill(); g.strokeStyle = '#c98a00'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#7a3e2b'; g.font = `700 12px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x + 8, y + 8.5 + Math.sin(a.time * 4) * .8);
      } else if (ch === 'u') { roundRect(g, x + .5, y + .5, T - 1, T - 1, 3); g.fillStyle = '#b0704c'; g.fill(); }
      else if (ch === '-') { g.fillStyle = wv.top; roundRect(g, x, y, T, 5, 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x, y + 4, T, 1); }
      else if (ch === '^') { g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + k * 5.3, y + T); g.lineTo(x + k * 5.3 + 2.6, y + 6); g.lineTo(x + k * 5.3 + 5.3, y + T); g.fill(); g.fillStyle = k % 2 ? '#ffd166' : '#ff6b35'; } }
    }
    function drawEnemy(g, e, wv) {
      const x = e.x, y = e.y, flip = e.dead ? -1 : 1;
      g.save(); g.translate(x + 7, y + 7); g.scale(1, flip);
      if (e.type === 'walker') { g.fillStyle = wv.enemy; g.beginPath(); g.arc(-4, -6, 3, 0, 7); g.arc(4, -6, 3, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 1, 7, 6, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(-4, -2, 3, 3); g.fillRect(1, -2, 3, 3); g.fillStyle = '#3b1f2b'; g.fillRect(-3 + (e.vx > 0 ? 1 : 0), -1, 1.5, 2); g.fillRect(2 + (e.vx > 0 ? 1 : 0), -1, 1.5, 2); g.fillRect(-3, 3, 6, 1); }
      else if (e.type === 'spiky') { g.fillStyle = '#d4e157'; g.beginPath(); g.arc(0, 1, 6, 0, 7); g.fill(); g.fillStyle = '#9e9d24'; for (let k = 0; k < 7; k++) { const an = Math.PI + k * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(an) * 5, 1 + Math.sin(an) * 5); g.lineTo(Math.cos(an) * 10, 1 + Math.sin(an) * 10); g.lineTo(Math.cos(an + .25) * 5, 1 + Math.sin(an + .25) * 5); g.fill(); } g.fillStyle = '#3b1f2b'; g.fillRect(-3, 0, 2, 2); g.fillRect(2, 0, 2, 2); }
      else if (e.type === 'jumper') { g.fillStyle = '#5b2d1f'; g.beginPath(); g.ellipse(0, 2, 7, 5.5, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-3, -3, 2.5, 0, 7); g.arc(3, -3, 2.5, 0, 7); g.fill(); g.fillStyle = '#3b1f2b'; g.beginPath(); g.arc(-3, -3, 1.2, 0, 7); g.arc(3, -3, 1.2, 0, 7); g.fill(); g.fillStyle = '#ef476f'; g.fillRect(-3, 4, 6, 1.5); }
      else { const fl = Math.sin(e.t * 20) * 3; g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-6, -3 - fl, 5, 3, -.4, 0, 7); g.ellipse(6, -3 - fl, 5, 3, .4, 0, 7); g.fill(); g.fillStyle = '#ffb000'; g.beginPath(); g.arc(0, 1, 6, 0, 7); g.fill(); g.fillStyle = '#3b1f2b'; g.fillRect(-4, -1, 8, 2); g.fillRect(-2, 3, 4, 1.5); }
      g.restore();
    }
    function drawItem(g, it) {
      if (it.kind === 'candy') { const b = Math.sin(it.t * 4) * 1.5; g.fillStyle = ['#ef476f', '#ffd166', '#06d6a0'][Math.floor(it.x / 16) % 3]; g.beginPath(); g.ellipse(it.x + 4, it.y + 4 + b, 4, 3.4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(it.x + 2.6, it.y + 2.6 + b, 1.4, .8, -.5, 0, 7); g.fill(); return; }
      if (it.kind === 'spring') { g.fillStyle = '#fff'; roundRect(g, it.x + 1, it.y + 2 + it.sq * 4, 14, 6 - it.sq * 3, 3); g.fill(); g.fillStyle = '#ff8fb1'; g.fillRect(it.x + 3, it.y + 6, 10, 2); return; }
      if (it.kind === 'check') { g.fillStyle = '#f3e6d8'; g.fillRect(it.x + 5, it.y + 6, 2, 26); g.fillStyle = it.on ? '#06d6a0' : '#ccc'; g.beginPath(); g.arc(it.x + 6, it.y + 6, 6, 0, 7); g.fill(); return; }
      if (it.kind === 'goal') {
        g.fillStyle = '#f3e6d8'; g.fillRect(it.x + 7, it.y + 20, 3, 60);
        g.save(); g.translate(it.x + 8, it.y + 14); g.rotate(a.time * 1.5);
        ['#ef476f', '#fff', '#ffd166', '#fff'].forEach((c2, i) => { g.fillStyle = c2; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 14, i * Math.PI / 2, (i + 1) * Math.PI / 2); g.fill(); });
        g.restore(); return;
      }
      if (it.kind === 'life') { g.fillStyle = '#06d6a0'; g.beginPath(); g.arc(it.x + 6, it.y + 6, 6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `700 8px ${FONT}`; g.textAlign = 'center'; g.fillText('1+', it.x + 6, it.y + 7); return; }
      // poderes
      const cx = it.x + 6, cy = it.y + 6;
      if (it.power === 'chicle') { g.fillStyle = '#ff8fb1'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 2, cy - 2, 1.6, 0, 7); g.fill(); }
      if (it.power === 'alfajor') { g.fillStyle = '#4a2318'; g.beginPath(); g.ellipse(cx, cy + 2, 7, 3, 0, 0, 7); g.fill(); g.fillStyle = '#f3d9b1'; g.fillRect(cx - 7, cy - 1, 14, 2); g.fillStyle = '#6b3524'; g.beginPath(); g.ellipse(cx, cy - 2, 7, 3, 0, 0, 7); g.fill(); }
      if (it.power === 'veloz') { g.fillStyle = '#ffd166'; g.beginPath(); g.ellipse(cx, cy, 6, 4.5, 0, 0, 7); g.fill(); g.fillStyle = '#ff6b35'; g.beginPath(); g.moveTo(cx - 10, cy); g.lineTo(cx - 6, cy - 3); g.lineTo(cx - 6, cy + 3); g.fill(); g.beginPath(); g.moveTo(cx + 10, cy); g.lineTo(cx + 6, cy - 3); g.lineTo(cx + 6, cy + 3); g.fill(); }
      if (it.power === 'confites') { [['#ef476f', -3, 1], ['#06d6a0', 3, 1], ['#ffd166', 0, -3]].forEach(([c2, dx, dy]) => { g.fillStyle = c2; g.beginPath(); g.ellipse(cx + dx, cy + dy, 3.5, 2.8, 0, 0, 7); g.fill(); }); }
    }
    function drawBoss(g, b, wv) {
      if (b.inv > 0 && Math.floor(b.inv * 12) % 2) return;
      g.save(); g.translate(b.x + 17, b.y + 17); if (b.dead) g.scale(1, -1);
      const sq = b.onGround ? 1 : 1.08;
      g.scale(1 / sq, sq);
      g.fillStyle = wv.enemy; g.beginPath(); g.ellipse(0, 2, 17, 15, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-6, -6, 6, 3, -.5, 0, 7); g.fill();
      g.fillStyle = '#ffd166'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * 7 - 4, -11); g.lineTo(k * 7, -20); g.lineTo(k * 7 + 4, -11); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-6, -2, 4.5, 0, 7); g.arc(6, -2, 4.5, 0, 7); g.fill();
      g.fillStyle = '#3b1f2b'; const look = Math.sign(P.x - b.x) * 1.5; g.beginPath(); g.arc(-6 + look, -1, 2.2, 0, 7); g.arc(6 + look, -1, 2.2, 0, 7); g.fill();
      g.lineWidth = 2; g.strokeStyle = '#3b1f2b'; g.beginPath(); g.moveTo(-10, -8); g.lineTo(-3, -5); g.moveTo(10, -8); g.lineTo(3, -5); g.stroke();
      g.fillStyle = '#3b1f2b'; g.fillRect(-6, 8, 12, 2);
      g.restore();
      // vida del jefe
      if (!b.dead && b.awake) { for (let i = 0; i < 3; i++) { g.fillStyle = i < b.hp ? '#ef476f' : 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(b.x + 9 + i * 8 - cam, b.y - 8, 3, 0, 7); g.fill(); } }
    }

    function draw(g) {
      if (mode === 'select') return drawSelect(g);
      const wv = WORLDS[wIdx];
      drawBg(g, wv, wIdx);
      g.save(); g.translate(-Math.round(cam), 0);
      const c0 = Math.floor(cam / T), c1 = Math.min(cols - 1, c0 + Math.ceil(W / T) + 1);
      for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) { const ch = tiles[r][c]; if (ch !== '.') drawTile(g, ch, c * T, r * T, c, r, wv); }
      for (const p of plats) { roundRect(g, p.x, p.y, p.w, p.h, 4); g.fillStyle = wv.top; g.fill(); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(p.x + 2, p.y + 5, p.w - 4, 2); }
      for (const it of items) if (it.x > cam - 40 && it.x < cam + W + 20) drawItem(g, it);
      for (const e of ents) if (e.x > cam - 20 && e.x < cam + W + 20) drawEnemy(g, e, wv);
      for (const s of shots) { g.fillStyle = ['#ef476f', '#ffd166', '#06d6a0'][Math.floor(s.life * 10) % 3]; g.beginPath(); g.ellipse(s.x, s.y, 3.5, 2.8, 0, 0, 7); g.fill(); }
      g.restore();
      if (boss) { g.save(); g.translate(-Math.round(cam), 0); drawBoss(g, boss, wv); g.restore(); }
      // Bongi
      if (!(P.inv > 0 && Math.floor(P.inv * 14) % 2)) {
        const mood = state === 'dead' ? 'hurt' : state === 'clear' ? 'happy' : 'ok';
        const sx = P.x - cam + P.w / 2, sy = P.y + P.h - 9;
        if (P.shield) { g.strokeStyle = 'rgba(243,217,177,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(sx, sy - 1, 13, 0, 7); g.stroke(); }
        if (P.speedT > 0) { g.fillStyle = 'rgba(255,209,102,.5)'; g.fillRect(sx - P.dir * 14, sy - 3, -P.dir * 8, 2); g.fillRect(sx - P.dir * 14, sy + 2, -P.dir * 6, 2); }
        drawBongi(g, sx, sy, 9, { dir: P.dir, walk: P.onGround ? P.walk : 0, mood, blink: P.blink, squash: P.onGround ? P.squash : (P.vy < 0 ? .85 : 1.08) });
      }
      // marcador en pantalla
      g.fillStyle = 'rgba(59,31,43,.6)'; roundRect(g, 6, 6, 150, 18, 9); g.fill();
      g.fillStyle = '#fff'; g.font = `700 10px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(`♥ ${lives}   ● ${candies}   ${Math.ceil(timeLeft)} s${doubleUnlocked ? '   ⇈' : ''}${P.confites ? '   ✦' : ''}`, 14, 15.5);
    }
    function drawSelect(g) {
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#5a2d4a'); grd.addColorStop(1, '#2a1424'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd166'; g.font = `700 20px ${FONT}`; g.fillText('Elegí un mundo', W / 2, 30);
      g.fillStyle = '#f6dbe3'; g.font = `600 11px ${FONT}`; g.fillText('Cada mundo tiene 2 niveles y un jefe al final', W / 2, 50);
      for (let i = 0; i < 5; i++) {
        const wv = WORLDS[i], x = 20 + i * 74, open = i <= data.maxWorld, sel = i === selW;
        roundRect(g, x, 70 - (sel ? 6 : 0), 68, 100, 12);
        const gr = g.createLinearGradient(0, 70, 0, 170); gr.addColorStop(0, wv.sky[0]); gr.addColorStop(1, wv.sky[1]); g.fillStyle = open ? gr : '#5b4a52'; g.fill();
        if (sel) { g.strokeStyle = '#ffd166'; g.lineWidth = 3; g.stroke(); }
        g.fillStyle = open ? wv.ground : '#3b2f35'; g.fillRect(x, 140 - (sel ? 6 : 0), 68, 30 - 0); g.fillStyle = open ? wv.top : '#4b3f45'; g.fillRect(x, 140 - (sel ? 6 : 0), 68, 5);
        if (open) drawBongi(g, x + 34, 128 - (sel ? 6 : 0) + (sel ? Math.sin(a.time * 6) * 2 : 0), 9, { mood: sel ? 'happy' : 'ok' });
        g.fillStyle = '#fff'; g.font = `700 16px ${FONT}`; g.fillText(open ? String(i + 1) : '🔒', x + 34, 90 - (sel ? 6 : 0));
        g.font = `600 8px ${FONT}`; const words = wv.name.split(' de ');
        g.fillText(words[0], x + 34, 182); if (words[1]) g.fillText('de ' + words[1], x + 34, 192);
        if (i < data.cleared) { g.fillStyle = '#06d6a0'; g.font = `700 12px ${FONT}`; g.fillText('✓', x + 58, 80); }
      }
      g.fillStyle = '#f6dbe3'; g.font = `600 10px ${FONT}`; g.fillText('Tocá un mundo (o ◀ ▶ y Saltar) para empezar', W / 2, 212);
    }

    const a = arcade(root, ctx, {
      width: W, height: H, label: 'Pantalla de Bongi World', update, draw, onPointer,
      controls: { dirs: ['left', 'right'], buttons: [{ id: 'b', label: 'Correr' }, { id: 'a', label: 'Saltar' }] },
      help: ['◀ ▶ para moverte, Saltar para saltar (mantenelo para llegar más alto).', 'Mantené Correr para ir más rápido. Con confites, Correr también los lanza.', 'Saltá sobre los enemigos. Los erizos ácidos no se pisan: esquivalos o tirales confites.']
    });
    root._debug = {
      get state() { return { mode, wIdx, stage, state, lives, x: P?.x | 0, cols, candies, score }; },
      start: w => startWorld(w), clear: () => { if (state === 'play') { const g2 = items.find(i => i.kind === 'goal'); if (g2) { P.x = g2.x - 2; P.y = g2.y + 40; } else if (boss) { boss.hp = 1; boss.inv = 0; hitBoss(); } } },
      kill: () => die(), god: v => (god = v)
    };
    if (ctx.again && data.pending != null && data.pending <= data.maxWorld) { const w = data.pending; delete data.pending; ctx.save(); startWorld(w); }
    else { delete data.pending; hud(); }
    a.start();
    return { destroy: () => a.destroy(), togglePause: () => a.togglePause(), pause: () => a.pause() };
  }
};
