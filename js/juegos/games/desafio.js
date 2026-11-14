// El desafío Bongi: 45 segundos de consignas rápidas en tres modalidades.
import { candySVG, CANDIES, SWEET_IDS } from '../../candies.js?v=cfab42284a';

const PHOTOS = [
  ['alfajores', 'dulce'], ['chocolates', 'dulce'], ['gomitas', 'dulce'], ['chupetines', 'dulce'], ['caramelos', 'dulce'],
  ['bombones', 'dulce'], ['confites', 'dulce'], ['chicles', 'dulce'], ['malvaviscos', 'dulce'], ['regaliz', 'dulce'],
  ['papas-fritas', 'copetin'], ['chizitos', 'copetin'], ['mani-salado', 'copetin'], ['palitos-salados', 'copetin'], ['cascarones', 'copetin']
];
const MODES = {
  mixto: { label: 'Mixto', note: 'Un poco de todo' },
  clasificar: { label: '¿Dulce o copetín?', note: 'Clasificá las fotos de la vidriera' },
  reconocer: { label: '¿Qué golosina es?', note: 'Reconocé la ilustración' },
  contar: { label: 'Contá los confites', note: 'Memorizá cuántos aparecen' }
};
const DOT_COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#ff6b35', '#7ae0ff', '#3b1f2b'];
const TIME = 45;
const pick = a => a[(Math.random() * a.length) | 0];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

export default {
  mount(root, ctx) {
    let alive = true, interval = 0, timeouts = [], paused = false;
    const later = (fn, ms) => timeouts.push(setTimeout(() => alive && fn(), ms));

    function setup() {
      root.innerHTML = `<div class="setup"><h3>Elegí la modalidad</h3><div class="setup__options">${Object.entries(MODES).map(([k, m]) =>
        `<button class="opt" type="button" data-m="${k}"><span>${m.label}<small>${m.note}</small></span><span aria-hidden="true">▶</span></button>`).join('')}</div></div>`;
      root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { ctx.sfx.click(); start(b.dataset.m); }));
      root.querySelector('[data-m]').focus();
    }

    function start(mode) {
      let time = TIME, score = 0, streak = 0, correct = 0, wrong = 0, lastPhoto = '';
      const hud = () => ctx.hud({ Tiempo: `${time} s`, Puntos: score, Aciertos: correct });
      hud();
      interval = setInterval(() => {
        if (paused) return;
        time--; hud();
        if (time <= 5 && time > 0) ctx.sfx.tick();
        if (time <= 0) finish();
      }, 1000);

      function next() {
        if (!alive || time <= 0) return;
        const m = mode === 'mixto' ? pick(['clasificar', 'reconocer', 'contar']) : mode;
        ({ clasificar, reconocer, contar })[m]();
      }

      function frame(visual, question, options, cols2) {
        root.innerHTML = `<div class="quiz">
          <div class="quiz__meta"><span>${MODES[mode].label}</span>${streak >= 3 ? `<span class="streak-badge">Racha x${streak}</span>` : '<span></span>'}</div>
          <div class="quiz__visual${visual.cls ? ' ' + visual.cls : ''}">${visual.html}</div>
          <p class="quiz__q" id="dq">${question}</p>
          <div class="quiz__opts${cols2 ? ' quiz__opts--2' : ''}" role="group" aria-labelledby="dq">${options.map((o, k) => `<button class="answer${cols2 ? ' answer--big' : ''}" type="button" data-k="${k}" ${o.disabled ? 'disabled' : ''}>${o.text}</button>`).join('')}</div></div>`;
        const bs = [...root.querySelectorAll('.answer')];
        bs.forEach(b => b.addEventListener('click', () => resolve(options[Number(b.dataset.k)].ok, b, bs, options)));
        bs.find(b => !b.disabled)?.focus();
        return bs;
      }

      function resolve(ok, btn, all, options) {
        all.forEach((b, i) => { b.disabled = true; if (options[i].ok) b.classList.add('is-right'); });
        const r = btn.getBoundingClientRect(), rr = root.getBoundingClientRect();
        if (ok) {
          streak++; correct++;
          const pts = 10 + Math.min(streak, 10) * 2;
          score += pts; ctx.sfx.pick(Math.min(streak, 10)); ctx.float(r.left - rr.left + r.width / 2, r.top - rr.top, `+${pts}`);
        } else {
          btn.classList.add('is-wrong'); streak = 0; wrong++; score = Math.max(0, score - 5); ctx.sfx.error();
        }
        hud();
        later(next, ok ? 380 : 900);
      }

      function clasificar() {
        let p; do { p = pick(PHOTOS); } while (p[0] === lastPhoto); lastPhoto = p[0];
        frame({ html: `<img src="/assets/img/productos/${p[0]}-360.webp" width="360" height="450" alt="Foto de producto de la vidriera">` },
          '¿Va en el sector dulce o en el copetín?',
          [{ text: 'Dulce', ok: p[1] === 'dulce' }, { text: 'Copetín', ok: p[1] === 'copetin' }], true);
      }

      function reconocer() {
        const id = pick(SWEET_IDS);
        const others = shuffle(SWEET_IDS.filter(x => x !== id)).slice(0, 3);
        frame({ html: candySVG(id) }, '¿Qué golosina es?',
          shuffle([id, ...others]).map(x => ({ text: CANDIES[x].name, ok: x === id })), true);
      }

      function contar() {
        const n = 3 + ((Math.random() * Math.min(9, 4 + Math.floor(correct / 3))) | 0);
        const color = pick(DOT_COLORS);
        const dots = [];
        while (dots.length < n) {
          const x = 14 + Math.random() * 72, y = 14 + Math.random() * 72;
          if (dots.every(d => Math.hypot(d.x - x, d.y - y) > 15)) dots.push({ x, y });
        }
        const opts = shuffle([...new Set([n, n + 1, n - 1, n + 2].filter(v => v > 0))]).slice(0, 4);
        if (!opts.includes(n)) opts[0] = n;
        const shown = Math.max(900, 2200 - correct * 60);
        const bs = frame({ cls: 'quiz__visual--dots', html: dots.map(d => `<span class="dot" style="left:${d.x}%;top:${d.y}%;background:${color}"></span>`).join('') },
          '¿Cuántos confites había?', shuffle(opts).map(v => ({ text: String(v), ok: v === n, disabled: true })), true);
        root.querySelector('.quiz__q').textContent = 'Memorizá los confites…';
        later(() => {
          root.querySelector('.quiz__visual').innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="/assets/brand/iconos.svg#logo-caramelo"/></svg>';
          root.querySelector('.quiz__q').textContent = '¿Cuántos confites había?';
          bs.forEach(b => (b.disabled = false)); bs[0].focus();
        }, shown);
      }

      function finish() {
        clearInterval(interval);
        alive = false; timeouts.forEach(clearTimeout);
        ctx.end({ score, extra: { correct }, won: correct > wrong, title: correct >= 15 ? '¡Ojo de halcón!' : '¡Tiempo!',
          summary: `${correct} aciertos y ${wrong} errores en ${MODES[mode].label.toLowerCase()}.` });
      }
      next();
    }

    setup();
    return { pause() { paused = true; }, resume() { paused = false; }, destroy() { alive = false; clearInterval(interval); timeouts.forEach(clearTimeout); } };
  }
};
