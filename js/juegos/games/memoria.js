// Memoria Dulce: encontrar pares. Tres niveles que se desbloquean en orden.
import { candySVG, SWEET_IDS, CANDIES } from '../../candies.js?v=cfab42284a';

const LEVELS = [
  { n: 1, pairs: 6, cols: 4, label: 'Nivel 1 · 12 cartas' },
  { n: 2, pairs: 8, cols: 4, label: 'Nivel 2 · 16 cartas' },
  { n: 3, pairs: 10, cols: 5, label: 'Nivel 3 · 20 cartas' }
];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

export default {
  mount(root, ctx) {
    let timer = 0, alive = true;
    const unlocked = Math.min(3, (ctx.extra.level || 0) + 1);

    function setup() {
      root.innerHTML = `<div class="setup"><h3>Elegí el nivel</h3><div class="setup__options">${LEVELS.map(l =>
        `<button class="opt" type="button" data-lvl="${l.n}" ${l.n > unlocked ? 'disabled' : ''}><span>${l.label}<small>${l.n > unlocked ? `Superá el nivel ${l.n - 1} para desbloquearlo` : `${l.pairs} pares para encontrar`}</small></span><span aria-hidden="true">${l.n > unlocked ? '🔒' : '▶'}</span></button>`).join('')}</div></div>`;
      root.querySelectorAll('[data-lvl]').forEach(b => b.addEventListener('click', () => { ctx.sfx.click(); play(LEVELS[b.dataset.lvl - 1]); }));
      root.querySelector('[data-lvl]:not(:disabled)')?.focus();
    }

    function play(L) {
      const ids = shuffle([...SWEET_IDS]).slice(0, L.pairs);
      const deck = shuffle([...ids, ...ids]);
      let first = null, lock = false, moves = 0, found = 0, misses = 0, t0 = performance.now(), secs = 0;
      root.innerHTML = `<div class="mem-board" style="--cols:${L.cols}" role="grid" aria-label="Tablero de memoria"></div>`;
      const board = root.firstElementChild;
      deck.forEach((id, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'mem-card'; b.dataset.id = id;
        b.setAttribute('aria-label', `Carta ${i + 1}, boca abajo`);
        b.innerHTML = `<span class="mem-card__inner"><span class="mem-card__face mem-card__back"></span><span class="mem-card__face mem-card__front">${candySVG(id)}</span></span>`;
        board.append(b);
      });
      const hud = () => ctx.hud({ Nivel: L.n, Movimientos: moves, Pares: `${found}/${L.pairs}`, Tiempo: `${secs} s` });
      hud();
      timer = setInterval(() => { secs = Math.round((performance.now() - t0) / 1000); hud(); }, 1000);

      board.addEventListener('click', e => {
        const card = e.target.closest('.mem-card');
        if (!card || lock || card === first || card.classList.contains('is-matched') || card.classList.contains('is-flipped')) return;
        ctx.sfx.flip();
        card.classList.add('is-flipped');
        card.setAttribute('aria-label', `${CANDIES[card.dataset.id].name}, descubierta`);
        if (!first) { first = card; return; }
        moves++;
        if (first.dataset.id === card.dataset.id) {
          found++;
          [first, card].forEach(c => { c.classList.add('is-matched'); c.classList.remove('is-flipped'); c.setAttribute('aria-disabled', 'true'); });
          const r = card.getBoundingClientRect(), rr = root.getBoundingClientRect();
          ctx.float(r.left - rr.left + r.width / 2, r.top - rr.top, '¡Par!', '#06d6a0');
          ctx.sfx.combo(found);
          first = null; hud();
          if (found === L.pairs) setTimeout(() => done(L, moves, misses, secs), 650);
        } else {
          misses++; lock = true; const a = first; first = null; hud();
          setTimeout(() => {
            if (!alive) return;
            [a, card].forEach(c => { c.classList.remove('is-flipped'); c.setAttribute('aria-label', 'Carta boca abajo'); });
            lock = false; ctx.sfx.error();
          }, 800);
        }
      });
      board.querySelector('.mem-card').focus();
    }

    function done(L, moves, misses, secs) {
      clearInterval(timer);
      // Puntaje: base por par × nivel, bonus por rapidez, penalización por errores.
      const score = Math.max(50, Math.round(L.pairs * 100 * (1 + (L.n - 1) * 0.5) + Math.max(0, L.pairs * 7 - secs) * 10 - misses * 25));
      ctx.end({ score, extra: { level: L.n, perfect: misses === 0 ? 1 : 0 }, summary: `Nivel ${L.n}: ${moves} movimientos en ${secs} segundos${misses === 0 ? ', ¡sin errores!' : '.'}` });
    }

    setup();
    return { destroy() { alive = false; clearInterval(timer); } };
  }
};
