// ¿Cuánto conocés de golosinas?: 10 preguntas con tiempo, rachas y curiosidades.
import { TRIVIA } from '../data/trivia.js';

const DIFF = {
  facil: { label: 'Fácil', time: 20, mult: 1, note: 'Para empezar a picar' },
  media: { label: 'Media', time: 16, mult: 1.5, note: 'Para golosos con experiencia' },
  dificil: { label: 'Difícil', time: 12, mult: 2, note: 'Solo para expertos en cacao' }
};
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default {
  mount(root, ctx) {
    let raf = 0, alive = true, paused = false;

    function setup() {
      root.innerHTML = `<div class="setup"><h3>Elegí la dificultad</h3><div class="setup__options">${Object.entries(DIFF).map(([k, d]) =>
        `<button class="opt" type="button" data-d="${k}"><span>${d.label}<small>${d.note} · ${d.time} s por pregunta</small></span><span aria-hidden="true">▶</span></button>`).join('')}</div></div>`;
      root.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { ctx.sfx.click(); start(b.dataset.d); }));
      root.querySelector('[data-d]').focus();
    }

    function start(key) {
      const D = DIFF[key];
      const qs = shuffle(TRIVIA[key]).slice(0, 10);
      let i = 0, score = 0, streak = 0, bestStreak = 0, correct = 0;

      const hud = () => ctx.hud({ Pregunta: `${Math.min(i + 1, 10)}/10`, Puntos: score, Racha: streak });

      function ask() {
        const item = qs[i];
        const opts = shuffle(item.a.map((text, k) => ({ text, ok: k === 0 })));
        root.innerHTML = `<div class="quiz">
          <div class="quiz__meta"><span>${D.label}</span>${streak >= 2 ? `<span class="streak-badge">Racha x${streak}</span>` : '<span></span>'}</div>
          <div class="timer" aria-hidden="true"><span></span></div>
          <p class="quiz__q" id="q">${esc(item.q)}</p>
          <div class="quiz__opts" role="group" aria-labelledby="q">${opts.map((o, k) => `<button class="answer" type="button" data-k="${k}">${esc(o.text)}</button>`).join('')}</div>
          <div data-fact></div></div>`;
        hud();
        const bar = root.querySelector('.timer span');
        const buttons = [...root.querySelectorAll('.answer')];
        buttons[0].focus();
        let left = D.time * 1000, last = performance.now(), answered = false;
        const tick = t => {
          if (!alive || answered) return;
          if (!paused) left -= t - last;
          last = t;
          bar.style.transform = `scaleX(${Math.max(0, left / (D.time * 1000))})`;
          bar.style.background = left < 4000 ? '#ff8fa8' : '';
          if (left <= 0) return answer(-1);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        buttons.forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.k))));

        function answer(k) {
          if (answered) return; answered = true; cancelAnimationFrame(raf);
          const ok = k >= 0 && opts[k].ok;
          buttons.forEach((b, j) => { b.disabled = true; if (opts[j].ok) b.classList.add('is-right'); else if (j === k) b.classList.add('is-wrong'); });
          if (ok) {
            correct++; streak++; bestStreak = Math.max(bestStreak, streak);
            const pts = Math.round((100 + Math.max(0, left) / 100) * D.mult + (streak >= 2 ? streak * 20 : 0));
            score += pts; ctx.sfx.point(); if (streak >= 3) ctx.sfx.combo(streak);
            const r = buttons[k].getBoundingClientRect(), rr = root.getBoundingClientRect();
            ctx.float(r.left - rr.left + r.width / 2, r.top - rr.top, `+${pts}`);
          } else { streak = 0; ctx.sfx.error(); }
          hud();
          root.querySelector('[data-fact]').innerHTML = `<div class="fact" role="status"><p><strong>${ok ? '¡Correcto!' : k < 0 ? '¡Se acabó el tiempo!' : 'No era esa.'}</strong> ${esc(item.why)}</p>
            <button class="btn btn--banana btn--sm" type="button" data-next>${i < 9 ? 'Siguiente pregunta' : 'Ver resultado'}</button></div>`;
          const next = root.querySelector('[data-next]');
          next.focus();
          next.addEventListener('click', () => { ctx.sfx.click(); i++; if (i < 10) ask(); else finish(); });
        }
      }

      function finish() {
        ctx.end({ score, won: correct >= 6, extra: { correct, streak: bestStreak }, title: correct >= 9 ? '¡Sos un experto dulce!' : correct >= 6 ? '¡Muy bien!' : '¡A seguir aprendiendo!',
          summary: `Respondiste bien ${correct} de 10 en dificultad ${D.label.toLowerCase()}. Mejor racha: ${bestStreak}.` });
      }
      ask();
    }

    setup();
    return { pause() { paused = true; }, resume() { paused = false; }, destroy() { alive = false; cancelAnimationFrame(raf); } };
  }
};
