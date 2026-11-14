// Globo de Chicle: mantené apretado para inflar y soltá cuando el globo toque
// el aro dorado. Si te pasás, ¡explota! 10 rondas, cada vez más rápidas.
const ROUNDS = 10;

export default {
  mount(root, ctx) {
    let alive = true, raf = 0, round = 0, score = 0, perfects = 0, streak = 0, pops = 0;
    let size = 0, target = 0, speed = 0, holding = false, phase = 'ready', last = 0, soundT = 0;

    root.innerHTML = `<div class="globo">
      <p class="globo__msg" data-msg aria-live="polite">Mantené apretado para inflar</p>
      <div class="globo__stage" data-globo role="button" tabindex="0" aria-label="Inflar el globo de chicle: mantené apretado o mantené presionada la barra espaciadora">
        <svg viewBox="0 0 300 340" aria-hidden="true">
          <circle data-ring cx="150" cy="150" r="80" fill="none" stroke="#ffd166" stroke-width="6" stroke-dasharray="10 9"/>
          <g data-bubble><circle cx="150" cy="150" r="10" fill="#ff8fb1"/><ellipse data-shine cx="130" cy="130" rx="6" ry="3" fill="#fff" opacity=".6" transform="rotate(-30 130 130)"/></g>
          <g data-face transform="translate(150 280)">
            <circle r="44" fill="#4a2318"/><path d="M-30 -14q30-22 60 0" stroke="#7a3e2b" stroke-width="5" fill="none" stroke-linecap="round"/>
            <circle cx="-15" cy="-4" r="7" fill="#fff"/><circle cx="15" cy="-4" r="7" fill="#fff"/><circle cx="-14" cy="-3" r="3.4" fill="#3b1f2b"/><circle cx="16" cy="-3" r="3.4" fill="#3b1f2b"/>
            <circle cx="0" cy="18" r="7" fill="#ff8fb1"/>
          </g>
          <g data-burst opacity="0"></g>
        </svg>
      </div>
      <p class="globo__hint">Soltá cuando el globo llegue al aro dorado · Barra espaciadora en teclado</p>
    </div>`;
    const $ = s => root.querySelector(s);
    const stageEl = $('[data-globo]'), bubble = $('[data-bubble] circle'), shine = $('[data-shine]'), ring = $('[data-ring]'), msg = $('[data-msg]'), burst = $('[data-burst]');
    const MAXR = 128;
    const hud = () => ctx.hud({ Ronda: `${Math.min(round, ROUNDS)}/${ROUNDS}`, Puntos: score, Perfectos: perfects });

    function nextRound() {
      if (round >= ROUNDS) return finish();
      round++; size = 12; phase = 'ready';
      target = 62 + Math.random() * 52;                 // radio meta
      speed = 34 + round * 7;                           // px por segundo (crece por ronda)
      ring.setAttribute('r', target.toFixed(1));
      burst.setAttribute('opacity', '0'); burst.innerHTML = '';
      paint(); hud();
      msg.textContent = round === 1 ? 'Mantené apretado para inflar' : `Ronda ${round}: ¡más rápido!`;
    }
    function paint() {
      const cy = 236 - size;                            // el globo crece desde la boca
      bubble.setAttribute('r', size.toFixed(1)); bubble.setAttribute('cy', cy.toFixed(1));
      ring.setAttribute('cy', (236 - target).toFixed(1));
      shine.setAttribute('cx', (150 - size * .4).toFixed(1)); shine.setAttribute('cy', (cy - size * .4).toFixed(1));
      shine.setAttribute('rx', (size * .22).toFixed(1)); shine.setAttribute('ry', (size * .1).toFixed(1));
      shine.setAttribute('transform', `rotate(-30 ${150 - size * .4} ${cy - size * .4})`);
    }

    function loop(t) {
      if (!alive) return;
      const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
      if (holding && phase === 'inflating') {
        size += speed * dt * (1 + size / 160);          // acelera a medida que crece
        soundT -= dt; if (soundT <= 0) { ctx.sfx.inflate(size / MAXR); soundT = .09; }
        const wobble = ctx.reduceMotion ? 0 : Math.sin(t / 40) * Math.max(0, size - target) * .05;
        bubble.setAttribute('stroke', size > target ? '#c41e4a' : 'none'); bubble.setAttribute('stroke-width', wobble + 2);
        if (size >= Math.min(MAXR, target * 1.06)) pop();
        paint();
      }
      raf = requestAnimationFrame(loop);
    }

    function press() { if (phase !== 'ready' || !alive) return; holding = true; phase = 'inflating'; msg.textContent = '¡Inflando…!'; }
    function release() {
      if (!holding) return; holding = false;
      if (phase !== 'inflating') return;
      phase = 'done';
      const ratio = size / target;
      let pts, text;
      if (ratio >= 0.97) { pts = 150 + streak * 25; perfects++; streak++; text = '¡Perfecto!'; ctx.sfx.combo(streak + 2); }
      else { pts = Math.round(100 * Math.pow(ratio, 3)); streak = 0; text = ratio > .85 ? '¡Muy cerca!' : ratio > .6 ? 'Le faltó aire' : 'Muy chiquito'; ctx.sfx.point(); }
      score += pts;
      const r = stageEl.getBoundingClientRect(), rr = root.getBoundingClientRect();
      ctx.float(r.left - rr.left + r.width / 2, r.top - rr.top + r.height * .3, `+${pts}`);
      msg.textContent = `${text} +${pts}`; hud();
      setTimeout(() => alive && nextRound(), 1100);
    }
    function pop() {
      phase = 'done'; holding = false; streak = 0; pops++;
      ctx.sfx.pop(); ctx.shake(stageEl); navigator.vibrate?.(70);
      const cy = 236 - size;
      burst.innerHTML = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<circle cx="${150 + Math.cos(a) * size}" cy="${cy + Math.sin(a) * size}" r="${8 + (i % 3) * 3}" fill="#ff8fb1"/>`; }).join('');
      burst.setAttribute('opacity', '1'); bubble.setAttribute('r', '0');
      msg.textContent = '¡PLOP! Se reventó: 0 puntos';
      setTimeout(() => alive && nextRound(), 1200);
    }

    stageEl.addEventListener('pointerdown', e => { e.preventDefault(); try { stageEl.setPointerCapture(e.pointerId); } catch { /* sin captura */ } press(); });
    stageEl.addEventListener('pointerup', release);
    stageEl.addEventListener('pointercancel', release);
    stageEl.addEventListener('contextmenu', e => e.preventDefault());
    const kd = e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) press(); } };
    const ku = e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); release(); } };
    addEventListener('keydown', kd); addEventListener('keyup', ku);

    function finish() {
      alive = false; cancelAnimationFrame(raf);
      ctx.end({ score, extra: { perfects, pops: ROUNDS - pops }, won: pops < 5, title: perfects >= 5 ? '¡Maestro del globo!' : '¡Último globo!',
        summary: `${perfects} globos perfectos y ${pops} reventados en ${ROUNDS} rondas.` });
    }

    nextRound();
    stageEl.focus();
    raf = requestAnimationFrame(t => { last = t; loop(t); });
    return { pause() { release(); }, resume() {}, destroy() { alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); } };
  }
};
