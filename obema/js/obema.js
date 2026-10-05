(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lenis = null;

  /* ---------- peças que não dependem de animação ---------- */

  function scrollToTarget(el) {
    if (lenis) lenis.scrollTo(el, { duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
      if (id === 'conteudo') el.setAttribute('tabindex', '-1');
    });
  }

  var burger = $('.nav__burger');
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    if (lenis) lenis.start();
  }
  function initMenu() {
    burger.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      if (!open) { closeMenu(); return; }
      document.body.classList.add('menu-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fechar menu');
      if (lenis) lenis.stop();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  function initCopy() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function (msg) {
          btn.textContent = msg;
          setTimeout(function () { btn.textContent = 'Copiar'; }, 1800);
        };
        var fallback = function () {
          var target = btn.parentNode.querySelector('.foot__mail');
          var range = document.createRange();
          range.selectNodeContents(target);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          done('Selecionado');
        };
        try {
          navigator.clipboard.writeText(text).then(function () { done('Copiado'); }, fallback);
        } catch (err) { fallback(); }
      });
    });
  }

  function initVideos() {
    var voices = $$('.voice');
    voices.forEach(function (v) {
      var video = $('video', v);
      var bar = $('.voice__bar i', v);
      var play = function () {
        voices.forEach(function (o) { var ov = $('video', o); if (ov !== video) ov.pause(); });
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      };
      $('.voice__play', v).addEventListener('click', function (e) { e.stopPropagation(); play(); });
      $('.voice__frame', v).addEventListener('click', function () { if (video.paused) play(); else video.pause(); });
      video.addEventListener('play', function () { v.classList.add('is-playing', 'is-started'); });
      video.addEventListener('pause', function () { v.classList.remove('is-playing'); });
      video.addEventListener('ended', function () { v.classList.remove('is-playing', 'is-started'); video.currentTime = 0; });
      video.addEventListener('error', function () { v.classList.remove('is-playing', 'is-started'); });
      video.addEventListener('timeupdate', function () {
        if (video.duration) bar.style.transform = 'scaleX(' + (video.currentTime / video.duration) + ')';
      });
    });
  }

  /* agenda: estado por etapa do método */
  var agBlocks = $$('.ag');
  var agCount = $('[data-count]');
  var shownCount = 0;
  function setPhase(n) {
    $$('.step').forEach(function (s, i) { s.classList.toggle('is-active', i === n); });
    var total = 0;
    agBlocks.forEach(function (b) {
      var p = +b.getAttribute('data-phase');
      var on = p <= n + 1;
      b.classList.toggle('is-on', on);
      b.classList.toggle('is-new', p === n + 1 && n > 0);
      if (on) total++;
    });
    if (window.gsap && !reduce) {
      var o = { v: shownCount };
      gsap.to(o, { v: total, duration: .8, ease: 'power2.out', onUpdate: function () { agCount.textContent = Math.round(o.v); } });
    } else {
      agCount.textContent = total;
    }
    shownCount = total;
  }

  initMenu();
  initCopy();
  initVideos();

  if (!window.gsap || !window.ScrollTrigger) {
    initAnchors();
    setPhase($$('.step').length - 1);
    if (window.ObemaRing) { if (!window.ObemaRing($('.hero__ring'), { reduce: true })) doc.classList.add('no-webgl'); }
    return;
  }

  /* ---------- motor de animação ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (!reduce) {
    doc.classList.add('motion');
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  initAnchors();

  /* navegação: tom da seção, esconder ao descer, link atual */
  var nav = $('.nav');
  function setTone(t) { nav.setAttribute('data-on', t); doc.setAttribute('data-on', t); }
  $$('[data-tone]').forEach(function (sec) {
    if (sec === nav) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 40px', end: 'bottom 40px',
      onToggle: function (self) { if (self.isActive) setTone(sec.getAttribute('data-tone')); }
    });
  });
  var navLinks = $$('.nav__links a');
  navLinks.forEach(function (a) {
    var sec = document.getElementById(a.getAttribute('href').slice(1));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: function (self) { a.classList.toggle('is-current', self.isActive); }
    });
  });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 30);
      if (!document.body.classList.contains('menu-open')) {
        nav.classList.toggle('is-hidden', self.direction === 1 && y > 520);
      }
    }
  });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* anel 3D */
  var ringCanvas = $('.hero__ring');
  var ring = window.ObemaRing ? window.ObemaRing(ringCanvas, { reduce: reduce }) : null;
  if (!ring) doc.classList.add('no-webgl');
  if (ring) {
    window.addEventListener('pointermove', function (e) {
      ring.pointer(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    }, { passive: true });
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom top',
      onUpdate: function (s) { ring.scroll(s.progress); }
    });
  }

  /* entrada do hero */
  var stretchEl = $('.stretch');
  if (!reduce) {
    gsap.to('.hero__stage', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    var st = { v: 62 };
    var setStretch = function () { stretchEl.style.fontStretch = st.v + '%'; };
    setStretch();
    gsap.timeline({ defaults: { ease: 'expo.out' }, delay: .15 })
      .from('.hero__title .line > span', { yPercent: 112, duration: 1.4, stagger: .1 }, 0)
      .to(st, { v: 125, duration: 1.9, ease: 'expo.inOut', onUpdate: setStretch }, .35)
      .from('.hero .pill', { y: 14, opacity: 0, duration: 1 }, .1)
      .from('.hero__stage', { opacity: 0, scale: .9, duration: 2.2, ease: 'power3.out' }, 0)
      .from(['.hero__lede', '.hero__ctas'], { y: 26, opacity: 0, duration: 1.1, stagger: .08 }, .6)
      .from('.facts > div', { y: 26, opacity: 0, duration: 1.1, stagger: .07 }, .75)
      .from('.band > *', { y: 60, opacity: 0, duration: 1.3, stagger: .09 }, .85);
  }

  /* marquee guiado pela velocidade da rolagem */
  var mTrack = $('.marquee__track');
  if (mTrack && !reduce) {
    var mx = 0, mdir = -1, mVisible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { mVisible = es[0].isIntersecting; }).observe(mTrack);
    }
    gsap.ticker.add(function (time, dt) {
      if (!mVisible) return;
      var v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > .4) mdir = v > 0 ? -1 : 1;
      var speed = (0.75 + Math.min(Math.abs(v) * 0.22, 9)) * (dt / 16.67);
      mx += speed * mdir;
      var w = mTrack.scrollWidth / 2;
      if (mx <= -w) mx += w;
      if (mx > 0) mx -= w;
      mTrack.style.transform = 'translate3d(' + mx.toFixed(2) + 'px,0,0)';
    });
  }

  /* revelações: sempre a partir de um estado visível */
  if (!reduce) {
    $$('[data-reveal]').forEach(function (el, i) {
      gsap.from(el, {
        y: 46, opacity: .35, duration: 1.2, ease: 'expo.out', delay: (i % 4) * .06,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function () {
      if (window.SplitText) {
        $$('[data-split]').forEach(function (el) {
          SplitText.create(el, {
            type: 'lines', linesClass: 'sl', autoSplit: true,
            onSplit: function (self) {
              return gsap.from(self.lines, {
                yPercent: 55, opacity: .25, rotate: 1.2, transformOrigin: '0% 100%',
                duration: 1.3, stagger: .09, ease: 'expo.out',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true }
              });
            }
          });
        });
        var m = $('[data-words]');
        if (m) {
          SplitText.create(m, {
            type: 'words', wordsClass: 'w', autoSplit: true,
            onSplit: function (self) {
              return gsap.fromTo(self.words, { opacity: .22 }, {
                opacity: 1, ease: 'none', stagger: .1,
                scrollTrigger: { trigger: m, start: 'top 82%', end: 'bottom 52%', scrub: true }
              });
            }
          });
        }
      }
      ScrollTrigger.refresh();
    });
  }

  /* serviços: trilho horizontal no desktop */
  var mm = gsap.matchMedia();
  var svcSection = $('.services');
  var svcTrack = $('.services__track');
  var svcCards = $$('.svc');
  var svcCount = $('.services__count b');
  var svcBar = $('.services__bar i');

  mm.add('(min-width: 960px) and (prefers-reduced-motion: no-preference)', function () {
    svcSection.classList.add('is-horizontal');
    var dist = function () { return Math.max(0, svcTrack.scrollWidth - window.innerWidth); };
    var setH = function () { svcSection.style.height = (window.innerHeight + dist()) + 'px'; };
    setH();
    ScrollTrigger.addEventListener('refreshInit', setH);
    var tween = gsap.to(svcTrack, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: svcSection, start: 'top top', end: function () { return '+=' + dist(); },
        scrub: .7, invalidateOnRefresh: true,
        onUpdate: function (self) {
          var idx = Math.min(svcCards.length, Math.max(1, Math.round(self.progress * (svcCards.length - 1)) + 1));
          svcCount.textContent = (idx < 10 ? '0' : '') + idx;
          svcBar.style.transform = 'scaleX(' + (0.125 + self.progress * 0.875) + ')';
        }
      }
    });
    svcCards.forEach(function (card) {
      gsap.fromTo($('.scene__in', card), { xPercent: 9 }, {
        xPercent: -9, ease: 'none',
        scrollTrigger: { containerAnimation: tween, trigger: card, start: 'left right', end: 'right left', scrub: true }
      });
      ScrollTrigger.create({
        containerAnimation: tween, trigger: card, start: 'left 88%',
        onEnter: function () { card.classList.add('is-in'); }
      });
    });
    return function () {
      ScrollTrigger.removeEventListener('refreshInit', setH);
      svcSection.classList.remove('is-horizontal');
      svcSection.style.height = '';
      gsap.set(svcTrack, { clearProps: 'transform' });
    };
  });
  mm.add('(max-width: 959px), (prefers-reduced-motion: reduce)', function () {
    svcCards.forEach(function (card) {
      ScrollTrigger.create({ trigger: card, start: 'top 85%', once: true, onEnter: function () { card.classList.add('is-in'); } });
    });
  });

  /* método: a agenda enche conforme as etapas */
  var steps = $$('.step');
  if (!reduce) {
    $('.agenda').classList.add('is-live');
    setPhase(0);
    var phase = 0;
    ScrollTrigger.create({
      trigger: '.steps', start: 'top 62%', end: 'bottom 62%',
      onUpdate: function (self) {
        var idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        if (idx !== phase) { phase = idx; setPhase(idx); }
      }
    });
  } else {
    setPhase(steps.length - 1);
  }

  /* case: antes e depois na rolagem */
  if (!reduce) {
    var caseScroll = $('.case__scroll');
    caseScroll.classList.add('is-scrub');
    var after = $('.ig-after');
    var scan = $('.case__scan');
    var states = $$('.case__state span');
    states[0].classList.add('is-on');
    states[1].classList.remove('is-on');
    gsap.set(after, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(scan, { opacity: 0, top: '100%' });
    var ctl = gsap.timeline({
      scrollTrigger: {
        trigger: caseScroll, start: 'top top', end: 'bottom bottom', scrub: .6,
        onUpdate: function (self) {
          var depois = self.progress > .52;
          states[0].classList.toggle('is-on', !depois);
          states[1].classList.toggle('is-on', depois);
        }
      }
    });
    ctl.to({}, { duration: .18 })
      .to('.case__notes--before li', { opacity: .18, x: -24, duration: .3, stagger: .06, ease: 'power2.inOut' }, .18)
      .to(after, { clipPath: 'inset(0% 0% 0% 0%)', duration: .5, ease: 'none' }, .25)
      .fromTo(scan, { top: '100%', opacity: 1 }, { top: '0%', duration: .5, ease: 'none', immediateRender: false }, .25)
      .to(scan, { opacity: 0, duration: .06 }, .75)
      .from('.case__notes--after li', { opacity: .2, x: 24, duration: .3, stagger: .1, ease: 'power2.out' }, .55)
      .to({}, { duration: .2 });
  }

  /* depoimentos: velocidades diferentes por vídeo */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    $$('.voice').forEach(function (v) {
      var sp = parseFloat(v.getAttribute('data-speed')) || 0;
      gsap.fromTo(v, { yPercent: -sp }, {
        yPercent: sp, ease: 'none',
        scrollTrigger: { trigger: '.voices__row', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  });

  /* rodapé: a marca se expande ao chegar */
  if (!reduce) {
    var mark = $('.foot__mark');
    var fm = { v: 70 };
    gsap.to(fm, {
      v: 125, ease: 'none',
      onUpdate: function () { mark.style.fontStretch = fm.v + '%'; },
      scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom bottom', scrub: .6 }
    });
  }

  /* botões magnéticos e cursor */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .7, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: .7, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .3);
        yTo((e.clientY - r.top - r.height / 2) * .45);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });

    doc.classList.add('has-cursor');
    var cur = $('.cursor');
    var curLabel = $('.cursor__label');
    var cx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); cur.classList.remove('is-out'); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      var link = e.target.closest('a, button');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-link', !lab && !!link);
      if (lab) curLabel.textContent = lab.getAttribute('data-cursor');
    });
    document.documentElement.addEventListener('pointerleave', function () { cur.classList.add('is-out'); });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
