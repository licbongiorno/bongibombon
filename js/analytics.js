// Capa de medición desacoplada.
// - Todos los eventos pasan por track(): se envían a window.dataLayer (GTM) y,
//   si existe, a gtag (GA4). Si no hay ninguna herramienta configurada, no se envía nada.
// - Para activar GA4: completar GA_MEASUREMENT_ID con el ID real (G-XXXXXXX) del dueño.
//   No se inventan identificadores. Con un ID cargado se pide consentimiento antes de medir.
// Eventos usados: whatsapp_click, maps_click, phone_click, social_click, category_view,
// favorite_add, list_send, game_start, game_end, game_record, achievement_unlock.

export const GA_MEASUREMENT_ID = ''; // ← pegar acá el ID real de GA4 cuando exista

const CONSENT_KEY = 'bb.consent';
window.dataLayer = window.dataLayer || [];

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }

export function track(event, params = {}) {
  const payload = { event, ...params };
  window.dataLayer.push(payload);
  if (typeof window.gtag === 'function') window.gtag('event', event, params);
  if (safeGet('bb.debug') === '1') console.info('[analytics]', payload);
}

function loadGA() {
  if (!GA_MEASUREMENT_ID || window.gtag) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.append(s);
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function consentBanner() {
  const box = document.createElement('div');
  box.className = 'consent';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Preferencias de medición');
  box.innerHTML = `<p>Usamos medición anónima para saber qué secciones se visitan y mejorar la web. ¿Nos dejás medir?</p>
    <div class="row"><button class="btn btn--sm" data-c="yes">Aceptar</button><button class="btn btn--sm btn--light" data-c="no">Rechazar</button></div>`;
  box.addEventListener('click', e => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (!c) return;
    safeSet(CONSENT_KEY, c);
    if (c === 'yes') loadGA();
    box.remove();
  });
  document.body.append(box);
}

export function initAnalytics() {
  if (GA_MEASUREMENT_ID) {
    const c = safeGet(CONSENT_KEY);
    if (c === 'yes') loadGA(); else if (!c) consentBanner();
  }
  // Delegación: cualquier elemento con data-track envía su evento al hacer clic.
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (el) track(el.dataset.track, { label: el.dataset.trackLabel || '', page: location.pathname });
  });
  // Visitante recurrente (dato local, sin identificar a la persona)
  const visits = Number(safeGet('bb.visits') || 0) + 1;
  safeSet('bb.visits', String(visits));
  track('page_context', { returning: visits > 1, page: location.pathname });
}
