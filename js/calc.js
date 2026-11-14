// Calculadora orientativa de golosinas para cumpleaños.
// Referencia para 3 h: chico = 8 golosinas de mesa + 50 g de snacks; adulto = 4 golosinas + 80 g.
// Sorpresita = 7 golosinas por chico. Se escala linealmente con la duración.
const form = document.querySelector('[data-calc]');
const cfg = JSON.parse(document.getElementById('bb-config').textContent);
const out = k => form.querySelector(`[data-out="${k}"]`);
const clamp = v => Math.max(0, Math.min(300, Math.round(Number(v) || 0)));

function calc() {
  const kids = clamp(form.kids.value), adults = clamp(form.adults.value);
  const f = Number(form.hours.value) / 3;
  const mesa = Math.ceil((kids * 8 + adults * 4) * f);
  const bolsitas = form.bags.value === '1' ? kids * 7 : 0;
  const snacks = Math.ceil(((kids * 50 + adults * 80) * f) / 50) * 50;
  const bolsas = Math.ceil(snacks / 500);
  out('mesa').textContent = mesa; out('bolsitas').textContent = bolsitas;
  out('snacks').textContent = snacks.toLocaleString('es-AR'); out('bolsas').textContent = bolsas;
  const msg = `¡Hola Bongi Bombón! Estoy armando un cumpleaños para ${kids} chicos y ${adults} adultos (${form.hours.value} h). ` +
    `Necesitaría unas ${mesa} golosinas para la mesa dulce` + (bolsitas ? `, ${bolsitas} para sorpresitas` : '') +
    ` y ${bolsas} bolsas de snacks de 500 g. ¿Qué me recomiendan y a qué precio?`;
  form.querySelector('[data-calc-send]').href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
}
form.addEventListener('input', calc);
calc();
