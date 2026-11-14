// Frascos Musicales: mirá y escuchá la secuencia de frascos y repetila.
// Cada ronda suma un frasco más y la secuencia va más rápido. Tenés una segunda oportunidad.
import { candySVG } from '../../candies.js';

const JARS = [
  { candy: 'caramelo', color: '#ef476f', name: 'frasco de caramelos', key: '1' },
  { candy: 'gomita', color: '#06d6a0', name: 'frasco de gomitas', key: '2' },
  { candy: 'chupetin', color: '#ff6b35', name: 'frasco de chupetines', key: '3' },
  { candy: 'confite', color: '#7ae0ff', name: 'frasco de confites', key: '4' }
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default {
  mount(root, ctx) {
    let alive = true, seq = [], pos = 0, score = 0, lives = 2, best = 0, listening = false;

    root.innerHTML = `<div class="frascos">
      <p class="globo__msg" data-msg aria-live="polite">Mirá y escuchá…</p>
      <div class="frascos__grid">${JARS.map((j, i) => `
        <button type="button" class="frasco" data-i="${i}" style="--jc:${j.color}" aria-label="${j.name} (tecla ${j.key})" disabled>
          <span class="frasco__lid"></span><span class="frasco__glass">${candySVG(j.candy)}${candySVG(j.candy)}${candySVG(j.candy)}</span><span class="frasco__key" aria-hidden="true">${j.key}</span>
        </button>`).join('')}</div>
      <p class="globo__hint">Tocá los frascos en el mismo orden · Teclas 1 a 4</p>
    </div>`;
    const msg = root.querySelector('[data-msg]');
    const btns = [...root.querySelectorAll('.frasco')];
    const hud = () => ctx.hud({ Secuencia: seq.length, Puntos: score, Vidas: '❤'.repeat(lives) || '—' });

    async function light(i, ms) {
      const b = btns[i];
      b.classList.add('is-lit'); ctx.sfx.note(i, ms / 1000);
      await sleep(ms); b.classList.remove('is-lit');
    }

    async function playSeq() {
      listening = false; btns.forEach(b => (b.disabled = true));
      msg.textContent = 'Mirá y escuchá…';
      await sleep(650);
      const ms = Math.max(240, 560 - seq.length * 25);
      for (const i of seq) { if (!alive) return; await light(i, ms); await sleep(ms * .35); }
      if (!alive) return;
      pos = 0; listening = true; btns.forEach(b => (b.disabled = false)); btns[seq[0]].focus({ preventScroll: true });
      msg.textContent = '¡Tu turno!';
    }

    async function nextRound() {
      seq.push((Math.random() * 4) | 0);
      hud(); await playSeq();
    }

    async function tap(i) {
      if (!listening || !alive) return;
      light(i, 220);
      if (i === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          listening = false;
          const pts = seq.length * 10; score += pts; best = Math.max(best, seq.length);
          const r = btns[i].getBoundingClientRect(), rr = root.getBoundingClientRect();
          ctx.float(r.left - rr.left + r.width / 2, r.top - rr.top, `+${pts}`);
          msg.textContent = `¡Bien! Secuencia de ${seq.length}`;
          if (seq.length % 5 === 0) ctx.sfx.combo(seq.length / 5 + 2);
          hud(); await sleep(500); if (alive) nextRound();
        }
      } else {
        listening = false; lives--; ctx.sfx.error(); ctx.shake(btns[i]); hud();
        if (lives <= 0) return finish();
        msg.textContent = '¡Ups! Te la mostramos otra vez';
        await sleep(900); if (alive) playSeq();
      }
    }

    root.addEventListener('click', e => { const b = e.target.closest('.frasco'); if (b) tap(Number(b.dataset.i)); });
    const kd = e => { const i = ['1', '2', '3', '4'].indexOf(e.key); if (i >= 0) { e.preventDefault(); tap(i); } };
    addEventListener('keydown', kd);

    function finish() {
      alive = false;
      ctx.end({ score, extra: { seq: best }, won: best >= 5, title: best >= 10 ? '¡Oído de oro!' : '¡Fin de la melodía!',
        summary: `Tu secuencia más larga fue de ${best} frascos.` });
    }

    nextRound();
    return { destroy() { alive = false; removeEventListener('keydown', kd); } };
  }
};
