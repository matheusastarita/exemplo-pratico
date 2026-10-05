/*
 * Fábrica de Clientes · comportamento da página
 * 1. Botões de compra -> checkout da Kiwify, preservando os parâmetros do anúncio
 * 2. Consentimento de cookies e medição (Pixel/GA4 só depois do "Aceitar")
 * 3. Acordeões (módulos e perguntas frequentes)
 * 4. Barra de progresso de leitura
 * 5. Botão fixo no celular
 * 6. Aviso no console sobre marcadores [[PREENCHER]] ainda na página
 */
(function () {
  'use strict';

  const cfg = window.FC_CONFIG || {};
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // localStorage/sessionStorage podem não existir (aba anônima, bloqueio de dados do site).
  function storage(kind) {
    try {
      const s = window[kind];
      s.setItem('__fc', '1');
      s.removeItem('__fc');
      return s;
    } catch (e) {
      return null;
    }
  }
  const local = storage('localStorage');
  const session = storage('sessionStorage');
  const read = (s, k) => { try { return s ? s.getItem(k) : null; } catch (e) { return null; } };
  const write = (s, k, v) => { try { if (s) s.setItem(k, v); } catch (e) { /* sem armazenamento */ } };

  /* ---------- 1. checkout com parâmetros do anúncio ---------- */
  const CAMPAIGN_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id',
    'fbclid', 'gclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid',
    'src', 'sck' // parâmetros de rastreio aceitos pela Kiwify
  ];

  // Se a URL trouxe parâmetros, eles valem (e ficam guardados na sessão).
  // Se não trouxe, usa os guardados, para quem navegou e voltou sem a query.
  function campaignParams() {
    const qs = new URLSearchParams(window.location.search);
    const fromUrl = {};
    CAMPAIGN_KEYS.forEach((k) => {
      const v = qs.get(k);
      if (v) fromUrl[k] = v;
    });
    if (Object.keys(fromUrl).length) {
      write(session, 'fc_params', JSON.stringify(fromUrl));
      return fromUrl;
    }
    try { return JSON.parse(read(session, 'fc_params') || '{}') || {}; } catch (e) { return {}; }
  }

  function checkoutUrl() {
    let url;
    try { url = new URL(cfg.checkoutUrl); } catch (e) { return null; }
    if (url.protocol !== 'https:') return null;
    const params = campaignParams();
    Object.keys(params).forEach((k) => {
      if (!url.searchParams.has(k)) url.searchParams.set(k, params[k]);
    });
    return url.toString();
  }

  const checkout = checkoutUrl();
  if (checkout) {
    $$('[data-checkout]').forEach((a) => { a.href = checkout; });
    $$('[data-todo-checkout]').forEach((el) => el.remove());
  } else {
    console.warn('[Fábrica de Clientes] checkoutUrl vazio ou inválido em js/config.js: os botões de compra levam à seção da oferta.');
  }

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-checkout]');
    if (!a) return;
    track('checkout_click', { cta_position: a.getAttribute('data-cta') || '' });
  });

  /* ---------- 2. consentimento e medição ---------- */
  const services = [];
  if (cfg.metaPixelId) services.push('Meta Pixel');
  if (cfg.ga4Id) services.push('Google Analytics');
  const hasTracking = services.length > 0;
  const CONSENT_KEY = 'fc_consent';
  const banner = document.querySelector('.cookies');
  const prefsBtn = document.querySelector('[data-cookie-prefs]');

  function loadMeta(id) {
    if (window.fbq) return;
    const n = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments);
      else n.queue.push(arguments);
    };
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function loadGA(id) {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  function loadTracking() {
    if (cfg.metaPixelId) loadMeta(String(cfg.metaPixelId));
    if (cfg.ga4Id) loadGA(String(cfg.ga4Id));
  }

  // Ao retirar o consentimento, apaga os cookies de medição conhecidos e recarrega
  // a página para descarregar os scripts.
  function clearTrackingCookies() {
    const names = document.cookie.split(';').map((c) => c.split('=')[0].trim())
      .filter((n) => /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc)/.test(n));
    const host = window.location.hostname;
    const parts = host.split('.');
    const domains = ['', host];
    for (let i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    names.forEach((n) => {
      domains.forEach((d) => {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function track(name, data) {
    if (read(local, CONSENT_KEY) !== 'granted') return;
    if (name === 'checkout_click') {
      if (window.fbq) window.fbq('track', 'InitiateCheckout');
      if (window.gtag) window.gtag('event', 'begin_checkout', data);
    } else if (name === 'faq_open') {
      if (window.fbq) window.fbq('trackCustom', 'FaqOpen', data);
      if (window.gtag) window.gtag('event', 'faq_open', data);
    }
  }

  function showBanner(show) {
    if (!banner) return;
    banner.hidden = !show;
    document.documentElement.classList.toggle('cookies-open', show);
    updateSticky();
  }

  /* ---------- 3. acordeões ---------- */
  $$('[data-accordion]').forEach((acc) => {
    const isFaq = acc.hasAttribute('data-faq');
    $$('.acc__btn', acc).forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
        if (!open && isFaq) {
          const title = btn.querySelector('.acc__title');
          track('faq_open', { question: title ? title.textContent.trim() : '' });
        }
      });
    });
  });

  /* ---------- 4. barra de progresso ---------- */
  const bar = document.querySelector('.progress span');
  let ticking = false;
  function paintProgress() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  if (bar) {
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(paintProgress); }
    }, { passive: true });
    paintProgress();
  }

  /* ---------- 5. botão fixo no celular ---------- */
  // Aparece quando os botões da primeira dobra saem da tela; some quando a oferta, a chamada final ou o rodapé
  // estão na tela (já existe um botão ali) e enquanto o aviso de cookies está aberto.
  const sticky = document.querySelector('.sticky-cta');
  const heroCta = document.querySelector('.hero .cta-row');
  const blockers = $$('#oferta, #final, .footer');
  let heroVisible = true;
  const blockerVisible = new Set();

  function updateSticky() {
    if (!sticky) return;
    const cookiesOpen = banner && !banner.hidden;
    const show = !heroVisible && blockerVisible.size === 0 && !cookiesOpen;
    sticky.classList.toggle('is-visible', show);
  }

  if (sticky && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      // "visível" = os botões da dobra ainda estão na tela ou abaixo dela
      entries.forEach((e) => { heroVisible = e.isIntersecting || e.boundingClientRect.top > 0; });
      updateSticky();
    }).observe(heroCta);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) blockerVisible.add(e.target);
        else blockerVisible.delete(e.target);
      });
      updateSticky();
    });
    blockers.forEach((el) => io.observe(el));
  }

  /* ---------- inicia o consentimento (depois do botão fixo, que depende dele) ---------- */
  if (hasTracking && banner) {
    const label = banner.querySelector('[data-cookie-services]');
    if (label) label.textContent = 'medição (' + services.join(' e ') + ')';
    if (prefsBtn) {
      prefsBtn.hidden = false;
      prefsBtn.addEventListener('click', () => showBanner(true));
    }
    $$('[data-consent]', banner).forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-consent');
        const before = read(local, CONSENT_KEY);
        write(local, CONSENT_KEY, choice);
        showBanner(false);
        if (choice === 'granted') loadTracking();
        else if (before === 'granted') { clearTrackingCookies(); window.location.reload(); }
      });
    });
    const consent = read(local, CONSENT_KEY);
    if (consent === 'granted') loadTracking();
    else if (consent !== 'denied') showBanner(true);
  }

  /* ---------- 6. marcadores pendentes ---------- */
  const pending = (document.body.textContent.match(/\[\[(PREENCHER|IMAGEM)/g) || []).length;
  if (pending) {
    console.warn('[Fábrica de Clientes] ' + pending + ' marcadores [[PREENCHER]]/[[IMAGEM]] ainda visíveis na página. Veja RELATORIO.md.');
  }
})();
