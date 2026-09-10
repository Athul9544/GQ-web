/* Golden Qube — local rebuild: icon sprite + UI behaviour */

(function () {
  'use strict';

  /* ------------------------------------------------------------- scheduler */
  /* One scroll listener and one animation frame for the whole page. Each
     scroll-driven effect registers an updater here instead of binding its own
     listener, so a scroll costs a single callback and a single style pass
     rather than one of each per effect. The listener is passive, so it never
     holds up the compositor. */
  var frameJobs = [];
  var framePending = false;

  function runFrame() {
    framePending = false;
    for (var i = 0; i < frameJobs.length; i++) frameJobs[i]();
  }

  function scheduleFrame() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(runFrame);
  }

  /** Register an updater to run once per frame while the page is scrolling. */
  function onScrollFrame(job) {
    frameJobs.push(job);
    job();                                  // place it correctly straight away
  }

  window.addEventListener('scroll', scheduleFrame, { passive: true });
  window.addEventListener('resize', scheduleFrame, { passive: true });
  window.addEventListener('orientationchange', scheduleFrame, { passive: true });

  /* ---------------------------------------------------------------- icons */
  var SPRITE = [
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">',
    ico('phone', '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"/>'),
    ico('mail', '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 7.2L4.4 6.4A1 1 0 0 0 4 6v.3l8 5 8-5V6a1 1 0 0 0-.4-.1z"/>'),
    ico('clock', '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.6V6h-2v7.4l5.2 3.1 1-1.7z"/>'),
    ico('pin', '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'),
    ico('check', '<path d="M9.6 16.6 5 12l1.4-1.4 3.2 3.2 8-8L19 7.2z"/>'),
    ico('arrow', '<path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L20 12z"/>'),
    ico('play', '<path d="M8 5v14l11-7z"/>'),
    ico('target', '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>'),
    ico('spark', '<path d="M12 2 14 9l7 2-7 2-2 7-2-7-7-2 7-2z"/>'),
    ico('user', '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/>'),
    ico('chart', '<path d="M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z"/>'),
    ico('ig', '<path d="M12 2.2c3.2 0 3.6 0 4.9.07 3.3.15 4.8 1.7 4.96 4.96.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.15 3.25-1.66 4.8-4.96 4.96-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-3.3-.15-4.8-1.7-4.96-4.96C2.07 15.6 2.06 15.2 2.06 12s0-3.6.07-4.9C2.28 3.85 3.8 2.3 7.1 2.14 8.4 2.08 8.8 2.2 12 2.2zm0 3.6a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.44 1.44 0 1 0 0 2.9 1.44 1.44 0 0 0 0-2.9z"/>'),
    ico('fb', '<path d="M14 9V7c0-.9.3-1.4 1.5-1.4H17V2.2h-2.6C11.2 2.2 10 4 10 6.7V9H7.8v3.5H10V22h4v-9.5h2.7l.4-3.5z"/>'),
    ico('in', '<path d="M6.9 21H3.3V9.3h3.6zM5.1 7.7a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM21 21h-3.6v-5.7c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V21H9.6V9.3H13v1.6h.05a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5z"/>'),
    ico('yt', '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>'),
    ico('chat', '<path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6a11 11 0 0 1-2.6-.3L4 21l1.3-3.7A7.3 7.3 0 0 1 3 10.6C3 6.4 7 3 12 3zm-4 6.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm4 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm4 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/>'),
    ico('close', '<path d="m18.3 7.1-1.4-1.4-4.9 4.9-4.9-4.9-1.4 1.4 4.9 4.9-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9z"/>'),
    ico('send', '<path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/>'),
    ico('quote', '<path d="M7.2 6C4.9 6 3 7.9 3 10.2s1.9 4.2 4.2 4.2c.4 0 .8-.1 1.2-.2-.5 1.8-2 3.2-3.9 3.6l.4 2.2c3.6-.7 6.4-3.9 6.4-7.8V10.2C11.3 7.9 9.5 6 7.2 6zm9.6 0c-2.3 0-4.2 1.9-4.2 4.2s1.9 4.2 4.2 4.2c.4 0 .8-.1 1.2-.2-.5 1.8-2 3.2-3.9 3.6l.4 2.2c3.6-.7 6.4-3.9 6.4-7.8V10.2C20.9 7.9 19.1 6 16.8 6z"/>'),

    /* Services: bullseye struck by an arrow, and a briefcase. */
    ico('goal', '<path d="M20.9 4.5V1.8l-2.6 2.6v1.8l-3.1 3.1A4 4 0 0 0 8 12a4 4 0 1 0 6.7-3l3.1-3.1h1.8l2.6-2.6zM12 18a6 6 0 0 1-.6-12v2A4 4 0 1 0 16 12h2a6 6 0 0 1-6 6zm0 4a10 10 0 0 1-.5-20v2A8 8 0 1 0 20 12h2A10 10 0 0 1 12 22z"/>'),
    ico('briefcase', '<path d="M9.5 2h5A2.5 2.5 0 0 1 17 4.5V6h3a2 2 0 0 1 2 2v3.2a24 24 0 0 1-10 2.2 24 24 0 0 1-10-2.2V8a2 2 0 0 1 2-2h3V4.5A2.5 2.5 0 0 1 9.5 2zm0 2a.5.5 0 0 0-.5.5V6h6V4.5a.5.5 0 0 0-.5-.5zM2 13.4A26 26 0 0 0 11 15v1.6h2V15a26 26 0 0 0 9-1.6V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>'),

    /* DMAPT: magnifier over bars, clipboard checklist, graduation cap. */
    ico('audit', '<path d="M10.5 2a8.5 8.5 0 1 1-5.1 15.3l-2.7 2.7-1.4-1.4 2.7-2.7A8.5 8.5 0 0 1 10.5 2zm0 2a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM7.6 11.4h1.5v3.1H7.6zm2.4-3.2h1.5v6.3H10zm2.4 2h1.5v4.3h-1.5zM17.9 17.4l1.5-1.5 4.1 4.1-1.5 1.5z"/>'),
    ico('plan', '<path d="M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1zm1 2v1h4V4zm-.6 14.2-3.1-3.1 1.4-1.4 1.7 1.7 4.4-4.4 1.4 1.4z"/>'),
    ico('train', '<path d="M12 3 1 9l4 2.2V17c0 .4.2.7.5.9L12 21l6.5-3.1c.3-.2.5-.5.5-.9v-5.8L21 10v6h2V9zm0 2.3 7.1 3.7L12 12.7 4.9 9zm5 7.4v3.7l-5 2.4-5-2.4v-3.7l4.5 2.4c.3.2.7.2 1 0z"/>'),

    /* Brand marks keep their own fills, so they bypass the currentColor helper. */
    raw('google-g', '0 0 24 24',
      '<path fill="#4285F4" d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55z"/>' +
      '<path fill="#34A853" d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.75H1.69v2.98A11.5 11.5 0 0 0 12 24z"/>' +
      '<path fill="#FBBC05" d="M5.54 14.67a6.9 6.9 0 0 1 0-4.42V7.27H1.69a11.5 11.5 0 0 0 0 10.38l3.85-2.98z"/>' +
      '<path fill="#EA4335" d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.2 15.11 0 12 0 7.48 0 3.57 2.59 1.69 6.36l3.85 2.98C6.45 6.62 9 4.75 12 4.75z"/>'),

    raw('google-logo', '0 0 272 92',
      '<path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>' +
      '<path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>' +
      '<path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>' +
      '<path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>' +
      '<path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>' +
      '<path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>'),

    raw('verified', '0 0 24 24',
      '<path fill="#4285F4" d="m12 1.6 2.5 1.9 3.1-.3 1 3 2.7 1.5-.9 3 .9 3-2.7 1.5-1 3-3.1-.3-2.5 1.9-2.5-1.9-3.1.3-1-3-2.7-1.5.9-3-.9-3 2.7-1.5 1-3 3.1.3z"/>' +
      '<path fill="#fff" d="m10.8 15.3-3-3 1.3-1.3 1.7 1.7 4.1-4.1 1.3 1.3z"/>'),

    raw('star', '0 0 24 24', '<path fill="#F4B400" d="m12 17.3-6.2 3.7 1.7-7L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.5 4.8 1.7 7z"/>'),
    '</svg>'
  ].join('');

  function ico(id, path) {
    return '<symbol id="i-' + id + '" viewBox="0 0 24 24" fill="currentColor">' + path + '</symbol>';
  }

  function raw(id, viewBox, content) {
    return '<symbol id="i-' + id + '" viewBox="' + viewBox + '">' + content + '</symbol>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.body.insertAdjacentHTML('afterbegin', SPRITE);
    initNav();
    initHero();
    initFaq();
    initTestimonials();
    initCounters();
    initReveal();
    initForm();
    initYear();
    initChatbot();
    initBlogFeed();
    initAnimations();
    initServiceStack();
    initDmaptAccordion();
    initPointGroups();
    initFooterMark();
    initZoomOut();
    initHorizontalSlide();
  });

  /* ------------------------------------------------------------ footer mark */
  /* Aims the wordmark's spotlight at the cursor. The light itself is a radial
     gradient clipped to the letters in CSS; this only reports where it is. */
  function initFooterMark() {
    var marks = document.querySelectorAll('.footer__mark');
    if (!marks.length) return;

    for (var i = 0; i < marks.length; i++) {
      (function (el) {
        var pending = false;
        var x = 0;
        var y = 0;

        function paint() {
          pending = false;
          el.style.setProperty('--mx', x + 'px');
          el.style.setProperty('--my', y + 'px');
        }

        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          x = e.clientX - r.left;
          y = e.clientY - r.top;
          if (pending) return;
          pending = true;
          requestAnimationFrame(paint);
        });

        // Park it off-canvas so the light goes out when the cursor leaves.
        el.addEventListener('mouseleave', function () {
          el.style.removeProperty('--mx');
          el.style.removeProperty('--my');
        });
      })(marks[i]);
    }

    /* The wordmark is one unbroken line, so any size that is even slightly too
       big loses letters off the end — "GOLDEN QU". Rather than guess a font
       size in vw that happens to fit, measure what the line actually needs and
       scale to that, which also means it fills the width exactly. */
    function fit() {
      for (var i = 0; i < marks.length; i++) {
        var el = marks[i];
        el.style.fontSize = '';                       // back to the CSS size
        var room = el.clientWidth;
        var needed = el.scrollWidth;
        if (!room || !needed || needed <= room) continue;
        var size = parseFloat(window.getComputedStyle(el).fontSize);
        el.style.fontSize = (size * room / needed * 0.995).toFixed(2) + 'px';
      }
    }

    var queued = false;
    function refit() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fit(); });
    }

    fit();
    window.addEventListener('resize', refit);
    // Web fonts land after this runs and change the metrics underneath it.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  /* --------------------------------------------------- horizontal hand-off */
  /* One pin, two moves. The track's scroll runs the sideways travel first
     (--h), then zooms the photo that arrived into its column (--p), with a
     short hold at each end so neither move feels clipped. */
  function initHorizontalSlide() {
    var tracks = document.querySelectorAll('[data-hslide]');
    if (!tracks.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;


    function stage(raw, from, to) {
      var v = (raw - from) / (to - from);
      if (v < 0) v = 0;
      if (v > 1) v = 1;
      return v;
    }

    function update() {
      for (var i = 0; i < tracks.length; i++) {
        var el = tracks[i];
        var rect = el.getBoundingClientRect();
        var travel = rect.height - window.innerHeight;
        var raw = travel > 0 ? -rect.top / travel : 0;
        var s = STAGES[el.getAttribute('data-hslide')] || STAGES[''];

        el.style.setProperty('--h', stage(raw, s.h[0], s.h[1]).toFixed(4));
        el.style.setProperty('--p', ease(stage(raw, s.p[0], s.p[1])).toFixed(4));
        if (s.p2) {
          el.style.setProperty('--p2', ease(stage(raw, s.p2[0], s.p2[1])).toFixed(4));
        }
      }
    }

    onScrollFrame(update);
  }

  /* Where each move sits along a track's travel, keyed by its data-hslide
     value. The default runs the sideways slide first and picks the zoom up
     straight after it. "zoom-first" carries a zoom on each side of the slide,
     so the incoming panel gets its own progress value (--p2) rather than
     sharing one with the panel leaving. */
  var STAGES = {
    '': { h: [.08, .40], p: [.42, .78] },
    'zoom-first': { p: [.04, .26], h: [.34, .55], p2: [.60, .84] }
  };

  /* Ease out, so a frame lets go quickly and settles gently. */
  function ease(v) { return 1 - Math.pow(1 - v, 2.2); }

  /* -------------------------------------------------------- scroll zoom-out */
  /* Writes how far the pinned frame has been pulled back (0 = filling the
     viewport, 1 = resting card) for the CSS to size against. */
  /* Share of the track's travel spent zooming; the rest holds the finished
     layout. Matches the 210vh track and 100vh stage set in the stylesheet,
     which leaves 110vh of travel, 70vh of it for the zoom. */
  var ZOOM_SPAN = 70 / 110;

  function initZoomOut() {
    var tracks = document.querySelectorAll('[data-zoom]');
    if (!tracks.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;


    function update() {
      for (var i = 0; i < tracks.length; i++) {
        var rect = tracks[i].getBoundingClientRect();
        var travel = rect.height - window.innerHeight;
        var p = travel > 0 ? -rect.top / travel : 0;
        // The zoom finishes inside the first two thirds of the track; the rest
        // holds the finished layout on screen before the pin lets go.
        p = p / ZOOM_SPAN;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        // Ease out, so the frame lets go quickly and settles gently.
        var eased = 1 - Math.pow(1 - p, 2.2);
        tracks[i].style.setProperty('--p', eased.toFixed(4));
      }
    }

    onScrollFrame(update);
  }

  /* --------------------------------------------------------- feature points */
  /* Blades keep exactly one card open: hover opens it on a pointer device,
     click and keyboard focus work everywhere. Turn cards flip on hover in CSS
     and need a tap or keypress everywhere else. Lift cards are pure CSS. */
  function initPointGroups() {
    initBlades();
    initTurnCards();
    initTapReveals();
  }

  function initBlades() {
    var groups = document.querySelectorAll('[data-points]');

    for (var g = 0; g < groups.length; g++) {
      (function (group) {
        var cards = group.querySelectorAll('.blade');
        if (cards.length < 2) return;

        var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');

        function open(card) {
          if (card.classList.contains('is-active')) return;
          for (var i = 0; i < cards.length; i++) {
            var on = cards[i] === card;
            cards[i].classList.toggle('is-active', on);
            cards[i].setAttribute('aria-expanded', on ? 'true' : 'false');
          }
        }

        for (var i = 0; i < cards.length; i++) {
          (function (card) {
            card.addEventListener('click', function () { open(card); });
            card.addEventListener('focus', function () { open(card); });
            card.addEventListener('mouseenter', function () {
              if (hoverable.matches) open(card);
            });
          })(cards[i]);
        }
      })(groups[g]);
    }
  }

  /* Wipe cards and team rows light on hover, which a finger cannot do. On a
     touch device a tap sets the same state so the animation still plays. */
  function initTapReveals() {
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var groups = [
      document.querySelectorAll('.wipe'),
      document.querySelectorAll('.team-row')
    ];

    groups.forEach(function (nodes) {
      for (var i = 0; i < nodes.length; i++) {
        (function (el) {
          el.addEventListener('click', function () {
            var lit = el.classList.contains('is-lit');
            for (var j = 0; j < nodes.length; j++) nodes[j].classList.remove('is-lit');
            if (!lit) el.classList.add('is-lit');
          });
        })(nodes[i]);
      }
    });
  }

  function initTurnCards() {
    var cards = document.querySelectorAll('.turn');

    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('click', function () {
          var turned = card.classList.toggle('is-turned');
          card.setAttribute('aria-pressed', turned ? 'true' : 'false');
        });
        // Leaving the card puts it back face-up, so hover and tap agree.
        card.addEventListener('mouseleave', function () {
          card.classList.remove('is-turned');
          card.setAttribute('aria-pressed', 'false');
        });
      })(cards[i]);
    }
  }


  /* ------------------------------------------------------ DMAPT accordion */
  /* Exactly one panel is open at a time. Hover opens it on a pointer device,
     click and keyboard focus work everywhere. Below 900px the CSS shows every
     panel expanded, so the script stands down. */
  function initDmaptAccordion() {
    var acc = document.querySelector('.dmapt-acc');
    if (!acc) return;
    var panels = acc.querySelectorAll('.dmapt-panel');
    if (!panels.length) return;

    var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');

    function open(panel) {
      if (panel.classList.contains('is-open')) return;
      for (var i = 0; i < panels.length; i++) {
        var on = panels[i] === panel;
        panels[i].classList.toggle('is-open', on);
        panels[i].setAttribute('aria-expanded', on ? 'true' : 'false');
      }
    }

    for (var i = 0; i < panels.length; i++) {
      (function (panel) {
        panel.addEventListener('click', function () { open(panel); });
        panel.addEventListener('focus', function () { open(panel); });
        panel.addEventListener('mouseenter', function () {
          if (hoverable.matches) open(panel);
        });
      })(panels[i]);
    }
  }

  /* --------------------------------------------------- services card stack */
  /* The service cards are sticky, so each one is covered by the next as you
     scroll. Writing --svc-p (0 → 1, how far the next card has covered this
     one) lets the CSS scale and dim the card underneath, which turns the
     overlap into a sense of depth. */
  function initServiceStack() {
    var cards = document.querySelectorAll('.svc-card');
    if (cards.length < 2) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;


    function update() {
      // Sticky is switched off on narrow/short viewports; keep the cards flat.
      if (window.innerWidth <= 760 || window.innerHeight <= 620) {
        for (var j = 0; j < cards.length; j++) cards[j].style.setProperty('--svc-p', '0');
        return;
      }
      for (var i = 0; i < cards.length - 1; i++) {
        var rect = cards[i].getBoundingClientRect();
        var next = cards[i + 1].getBoundingClientRect();
        var p = rect.height ? (rect.bottom - next.top) / rect.height : 0;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        cards[i].style.setProperty('--svc-p', p.toFixed(3));
      }
    }

    onScrollFrame(update);
  }

  /* ------------------------------------------------------------- blog feed */
  /* Posts published through /admin. If the API is unreachable — for example
     when the folder is opened as plain files — the "coming soon" notice
     already in the markup stays put. */
  function initBlogFeed() {
    var deck = document.getElementById('blog-deck');
    var empty = document.getElementById('blog-empty');
    if (!deck || !window.fetch) return;

    // Live server first; on a static host (Vercel) the API 404s, so fall back
    // to the committed data/posts.json that ships with the build.
    fetch('/api/posts', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (posts) {
        if (Array.isArray(posts)) return posts;
        return fetch('data/posts.json', { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : []; })
          .catch(function () { return []; });
      })
      .then(function (posts) {
        if (!Array.isArray(posts) || !posts.length) return;
        posts.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

        deck.innerHTML =
          '<div class="deck__glow"></div>' +
          posts.map(function (p) {
            var date = postDate(p);
            var media = p.image
              ? '<img src="' + encodeURI(p.image) + '" alt="' + escapeHtml(p.title) + '" loading="lazy">'
              : '';

            return '<article class="deck__card">' +
              '<span class="deck__tag">' + escapeHtml(p.category || 'Golden Qube') + '</span>' +
              '<button class="deck__next" type="button" aria-label="Read this post">' +
                '<svg width="14" height="14"><use href="#i-arrow"></use></svg>' +
              '</button>' +
              '<h3 class="deck__title">' + escapeHtml(p.title) + '</h3>' +
              '<div class="deck__media">' + media +
                '<span class="deck__badge">' + date + '</span>' +
              '</div>' +
              '<p class="deck__text">' + escapeHtml(p.description) + '</p>' +
            '</article>';
          }).join('') +
          '<div class="deck__nav">' +
            posts.map(function (p, i) {
              return '<button class="deck__dot" type="button" data-go="' + i +
                     '" aria-label="Show post ' + (i + 1) + '"></button>';
            }).join('') +
          '</div>';

        deck.hidden = false;
        // The whole notice section goes, padding and all, not just the card.
        var emptyWrap = document.getElementById('blog-empty-wrap');
        if (emptyWrap) emptyWrap.remove();
        else if (empty) empty.remove();

        deck.querySelectorAll('img').forEach(retryImage);
        runDeck(deck, posts);
      })
      .catch(function () { /* leave the notice in place */ });
  }

  function postDate(p) {
    return new Date(p.createdAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  /* A card shows three lines of its post; opening one lifts the whole thing
     into a panel over the page. */
  function openPost(post) {
    var view = document.createElement('div');
    view.className = 'post-view';
    view.innerHTML =
      '<div class="post-view__scrim" data-close></div>' +
      '<article class="post-view__panel" role="dialog" aria-modal="true" aria-label="' +
          escapeHtml(post.title) + '">' +
        (post.image
          ? '<img src="' + encodeURI(post.image) + '" alt="' + escapeHtml(post.title) + '">'
          : '') +
        '<button class="post-view__close" type="button" data-close aria-label="Close">&times;</button>' +
        '<div class="post-view__body">' +
          '<span class="post-view__meta">' + escapeHtml(post.category || 'Golden Qube') +
            ' &nbsp;&bull;&nbsp; ' + postDate(post) + '</span>' +
          '<h2>' + escapeHtml(post.title) + '</h2>' +
          '<p>' + escapeHtml(post.description) + '</p>' +
        '</div>' +
      '</article>';

    document.body.appendChild(view);
    // The page behind is scroll-driven; freezing it keeps the deck put.
    var scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';

    var img = view.querySelector('img');
    if (img) retryImage(img);
    view.querySelector('.post-view__close').focus();

    function close() {
      view.remove();
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') close(); }

    view.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) close();
    });
    document.addEventListener('keydown', onKey);
  }

  /* The stack itself. Each card is placed by its distance from the front, so
     turning one over is a matter of renumbering and letting the transition run.
     The card that leaves drops out of frame first, then rejoins at the back.

     Which card is in front comes from the scroll position: the track around the
     pinned stage is one screen tall per post, so scrolling deals them one by
     one and the page continues to the footer once the last one is up. */
  function runDeck(deck, posts) {
    var cards = [].slice.call(deck.querySelectorAll('.deck__card'));
    var dots = [].slice.call(deck.querySelectorAll('.deck__dot'));
    var glow = deck.querySelector('.deck__glow');
    var total = cards.length;
    if (!total) return;

    /* Offset, tilt and scale for the front card and the three behind it;
       anything deeper is parked out of sight. */
    var LAYOUT = [
      { x: 0, y: 0, r: -2, s: 1, o: 1 },
      { x: 24, y: -18, r: 5.5, s: .955, o: 1 },
      { x: -20, y: -30, r: -7, s: .92, o: 1 },
      { x: 8, y: -40, r: 2.5, s: .89, o: .85 }
    ];
    var GONE = { x: 0, y: -46, r: 0, s: .86, o: 0 };

    var track = document.getElementById('blog-track');
    var active = 0;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function place(card, spot) {
      card.style.transform =
        'translate(calc(-50% + ' + spot.x + 'px), calc(-50% + ' + spot.y + 'px)) ' +
        'rotate(' + spot.r + 'deg) scale(' + spot.s + ')';
      card.style.opacity = spot.o;
    }

    function layout() {
      cards.forEach(function (card, i) {
        var depth = (i - active + total) % total;
        card.dataset.depth = depth;
        card.style.zIndex = total - depth;
        card.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
        // Only the readable card takes the keyboard.
        card.querySelector('.deck__next').tabIndex = depth === 0 ? 0 : -1;
        if (!card.classList.contains('is-leaving')) {
          place(card, LAYOUT[depth] || GONE);
        }
      });

      if (glow) {
        glow.style.setProperty('--tint', cards[active].dataset.tint || 'rgba(212, 160, 23, .5)');
      }
      dots.forEach(function (dot, i) { dot.classList.toggle('is-on', i === active); });
    }

    /* Sending the front card away and bringing it back at the rear has to
       happen in two steps: the drop is animated, the return to the back of the
       stack is not — otherwise it would fly back across the card face. */
    function go(next) {
      if (next === active) return;
      var leaving = next === (active + 1) % total ? cards[active] : null;
      active = next;

      if (leaving && !still) {
        leaving.classList.add('is-leaving');
        setTimeout(function () {
          leaving.style.transition = 'none';
          leaving.classList.remove('is-leaving');
          leaving.style.filter = '';
          place(leaving, LAYOUT[(cards.indexOf(leaving) - active + total) % total] || GONE);
          // Two frames, so the snap is painted before transitions come back.
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { leaving.style.transition = ''; });
          });
        }, 620);
      }
      layout();
    }

    /* Every way of asking for another card goes through the scroll position,
       so nothing can disagree with where the page actually is. */
    function span() { return track ? track.offsetHeight - window.innerHeight : 0; }

    function stepTo(i) {
      if (!track || span() <= 0) { go(i); return; }
      var top = window.pageYOffset + track.getBoundingClientRect().top +
                span() * ((i + 0.5) / total);
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({ top: top, behavior: still ? 'auto' : 'smooth' });
      } else {
        window.scrollTo(0, top);
      }
    }

    function fromScroll() {
      var length = span();
      if (length <= 0) return;
      var p = -track.getBoundingClientRect().top / length;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      var i = Math.floor(p * total);
      if (i > total - 1) i = total - 1;
      if (i !== active) go(i);
    }

    function sizeTrack() {
      if (!track) return;
      // A screen of scrolling per card, plus one for reading the last one.
      track.style.height = (total + 1) * window.innerHeight + 'px';
      fromScroll();
    }

    /* An average of the image gives the glow behind the stack its colour, so
       the page picks up the tone of whichever post is in front. */
    cards.forEach(function (card) {
      var img = card.querySelector('img');
      if (!img) return;
      var sample = function () {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = canvas.height = 8;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 8, 8);
          var d = ctx.getImageData(0, 0, 8, 8).data;
          var r = 0, g = 0, b = 0, n = 0;
          for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
          card.dataset.tint = 'rgba(' + Math.round(r / n) + ',' + Math.round(g / n) + ',' +
                              Math.round(b / n) + ',.72)';
          if (cards[active] === card) layout();
        } catch (e) { /* keep the default gold */ }
      };
      if (img.complete && img.naturalWidth) sample();
      else img.addEventListener('load', sample);
    });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { stepTo(+dot.dataset.go); });
    });

    // The arrow on the face of a card opens it; it is the card's own affordance.
    cards.forEach(function (card, i) {
      card.querySelector('.deck__next').addEventListener('click', function (e) {
        e.stopPropagation();
        openPost(posts[i]);
      });
    });

    /* A tap on the readable card opens it, a tap on one behind brings it
       forward, and a drag in any direction deals the next one. */
    var from = null;
    deck.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.deck__next, .deck__dot')) return;
      from = { x: e.clientX, y: e.clientY, card: e.target.closest('.deck__card') };
    });
    deck.addEventListener('pointerup', function (e) {
      if (!from) return;
      var start = from;
      from = null;

      if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 48) {
        return stepTo((active + 1) % total);
      }
      if (!start.card) return;
      var i = cards.indexOf(start.card);
      if (i === active) openPost(posts[i]);
      else if (i > -1) stepTo(i);
    });

    onScrollFrame(fromScroll);
    window.addEventListener('resize', sizeTrack, { passive: true });

    layout();
    sizeTrack();
  }

  /* A post's text is live the moment it is committed, but its image is a static
     file that only exists once that commit has redeployed — about a minute — so
     it 404s until then. Retry on a widening delay so the card fills itself in
     instead of leaving a broken icon nobody knows to refresh away. */
  function retryImage(img) {
    var tries = 0;
    img.addEventListener('error', function () {
      if (tries >= 4) { img.remove(); return; }
      var wait = 8000 * Math.pow(2, tries);          // 8s, 16s, 32s, 64s
      tries++;
      setTimeout(function () {
        img.src = img.src.split('?')[0] + '?r=' + Date.now();
      }, wait);
    });
  }

  /* ------------------------------------------------------------------- nav */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.nav');
    var header = document.querySelector('.header');

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          nav.classList.remove('is-open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (header) {
      // Only touch the class when the state actually changes: writing it on
      // every scroll event invalidates style for the whole header each time.
      var stuck = null;
      onScrollFrame(function () {
        var now = window.pageYOffset > 10;
        if (now === stuck) return;
        stuck = now;
        header.classList.toggle('is-stuck', now);
      });
    }
  }

  /* ------------------------------------------------------------ hero slider */
  function initHero() {
    var slides = document.querySelectorAll('.hero__slide');
    var dotsWrap = document.querySelector('.hero__dots');
    if (!slides.length || !dotsWrap) return;

    var current = 0;
    var timer;

    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = dotsWrap.querySelectorAll('button');

    function go(i) {
      current = i;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === i); });
    }
    function next() { go((current + 1) % slides.length); }
    function restart() { clearInterval(timer); timer = setInterval(next, 6000); }

    go(0);
    restart();
  }

  /* ------------------------------------------------------------------- faq */
  function initFaq() {
    document.querySelectorAll('.faq__item').forEach(function (item) {
      var btn = item.querySelector('.faq__q');
      var panel = item.querySelector('.faq__a');
      if (!btn || !panel) return;
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        item.parentElement.querySelectorAll('.faq__item').forEach(function (o) {
          o.classList.remove('is-open');
          o.querySelector('.faq__a').style.maxHeight = null;
        });
        if (!open) {
          item.classList.add('is-open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
    var first = document.querySelector('.faq__item');
    if (first) first.querySelector('.faq__q').click();
  }

  /* ---------------------------------------------------------- testimonials */
  function initTestimonials() {
    var track = document.querySelector('.ttrack');
    if (!track) return;
    var prev = document.querySelector('[data-t="prev"]');
    var next = document.querySelector('[data-t="next"]');
    var index = 0;

    function perView() {
      if (window.innerWidth <= 700) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }
    function maxIndex() {
      return Math.max(0, track.children.length - perView());
    }
    function step() {
      // Measure from the layout itself so the gap is never hard-coded.
      var a = track.children[0];
      var b = track.children[1];
      if (!a) return 0;
      if (b) return b.offsetLeft - a.offsetLeft;
      return a.getBoundingClientRect().width;
    }
    function render() {
      index = Math.min(index, maxIndex());
      track.style.transform = 'translateX(' + (-index * step()) + 'px)';
    }

    if (next) next.addEventListener('click', function () { index = index >= maxIndex() ? 0 : index + 1; render(); });
    if (prev) prev.addEventListener('click', function () { index = index <= 0 ? maxIndex() : index - 1; render(); });
    window.addEventListener('resize', render);
    render();

    initReviewCards();
    initReviewsFeed();
  }

  /* Pull the review feed from assets/data/reviews.json so refreshed Google data
     shows up without touching the markup. The cards already in the HTML act as
     the fallback if the file is missing or the fetch fails. */
  function initReviewsFeed() {
    var track = document.querySelector('.ttrack');
    if (!track || !window.fetch) return;

    fetch('assets/data/reviews.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.reviews) || !data.reviews.length) return;
        renderReviews(track, data);
      })
      .catch(function () { /* keep the markup that shipped with the page */ });
  }

  function renderReviews(track, data) {
    var stars = '<span class="rcard__stars">' +
      '<svg viewBox="0 0 24 24"><use href="#i-star"></use></svg>'.repeat(5) +
      '</span>';

    track.innerHTML = data.reviews.map(function (r) {
      var initials = r.author.split(/\s+/).map(function (w) { return w[0]; })
        .join('').slice(0, 2).toUpperCase();
      var avatar = r.avatar
        ? '<img class="rcard__avatar" src="' + r.avatar + '" alt="' + escapeHtml(r.author) +
          '" width="48" height="48" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'rcard__avatar rcard__avatar--initials\',textContent:\'' + initials + '\'}))">'
        : '<span class="rcard__avatar rcard__avatar--initials">' + initials + '</span>';

      return '<article class="rcard">' +
        '<div class="rcard__head">' + avatar +
          '<div class="rcard__id">' +
            '<div class="rcard__name">' + escapeHtml(r.author) + '</div>' +
            '<time class="rcard__date" data-ago="' + (r.time || '') + '"></time>' +
          '</div>' +
          '<svg class="rcard__g" viewBox="0 0 24 24" aria-label="Posted on Google"><use href="#i-google-g"></use></svg>' +
        '</div>' +
        '<div class="rcard__rating">' + stars +
          '<svg class="rcard__verified" viewBox="0 0 24 24" aria-label="Verified review"><use href="#i-verified"></use></svg>' +
        '</div>' +
        '<p class="rcard__text">' + escapeHtml(r.text) + '</p>' +
        '<button class="rcard__more" type="button">Read more</button>' +
      '</article>';
    }).join('');

    var count = document.querySelector('.reviews__count');
    if (count && data.totalReviews) {
      count.innerHTML = 'Based on <strong>' + data.totalReviews + ' reviews</strong>';
    }
    var verdict = document.querySelector('.reviews__verdict');
    if (verdict && data.verdict) verdict.textContent = data.verdict;

    initReviewCards();
  }

  /* Review cards: relative dates from the original Google timestamps, and
     expanding long reviews in place. */
  function initReviewCards() {
    document.querySelectorAll('[data-ago]').forEach(function (el) {
      var ts = Number(el.dataset.ago);
      if (!ts) return;
      var d = new Date(ts * 1000);
      el.setAttribute('datetime', d.toISOString().slice(0, 10));
      el.textContent = relative(d);
    });

    document.querySelectorAll('.rcard').forEach(function (card) {
      var body = card.querySelector('.rcard__text');
      var btn = card.querySelector('.rcard__more');
      if (!body || !btn) return;

      // Only offer the toggle when the text is actually clipped.
      if (body.scrollHeight <= body.clientHeight + 2) {
        btn.hidden = true;
        return;
      }
      btn.addEventListener('click', function () {
        var open = card.classList.toggle('is-expanded');
        btn.textContent = open ? 'Read less' : 'Read more';
      });
    });
  }

  function relative(date) {
    var days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days < 7) return days + (days === 1 ? ' day ago' : ' days ago');
    if (days < 30) {
      var w = Math.floor(days / 7);
      return w + (w === 1 ? ' week ago' : ' weeks ago');
    }
    if (days < 365) {
      var m = Math.floor(days / 30);
      return m + (m === 1 ? ' month ago' : ' months ago');
    }
    var y = Math.floor(days / 365);
    return y + (y === 1 ? ' year ago' : ' years ago');
  }

  /* -------------------------------------------------------------- counters */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: .4 });

    nodes.forEach(function (n) { io.observe(n); });

    function run(el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var start = performance.now();
      var dur = 1400;
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }
  }

  /* ---------------------------------------------------------------- reveal */
  function initReveal() {
    var nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }

    /* Threshold 0 with a margin off the bottom edge, rather than a fraction of
       the element: a block taller than the viewport can never reach a large
       ratio, which left tall sections stuck invisible on small screens. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach(function (n, i) {
      /* The default is a rolling four-step stagger, which suits a page of
         unrelated blocks. An element that declares its own --i is part of an
         ordered set and sets its delay from that in CSS, so leave it alone —
         an inline delay here would override it and scramble the order. */
      if (!n.style.getPropertyValue('--i')) {
        n.style.transitionDelay = (i % 4) * 80 + 'ms';
      }
      io.observe(n);
    });

    // Anything already on screen should not wait for a scroll event.
    requestAnimationFrame(function () {
      nodes.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) n.classList.add('is-visible');
      });
    });
  }

  /* ------------------------------------------------------------ animations */
  /* Text rises line by line and images settle out of a slight zoom, applied by
     scanning the markup so no page needs extra classes. */
  function initAnimations() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var TEXT_ZONES = [
      '.hero__inner', '.breadcrumb .container', '.sec-head', '.feature__body',
      '.contact-form-card', '.contact-aside', '.cta-box__body', '.legal',
      '.blog-empty', '.reviews__summary'
    ];
    var TEXT_BITS = 'h1, h2, h3, h4, h5, p, .eyebrow, .hero__eyebrow, .breadcrumb__path, .checklist, .hero__actions, .btn, .contact-list, .socials';

    document.querySelectorAll(TEXT_ZONES.join(',')).forEach(function (zone) {
      var step = 0;
      zone.querySelectorAll(TEXT_BITS).forEach(function (el) {
        // Skip anything already inside another animated element.
        if (el.closest('.anim-text') !== null && el.closest('.anim-text') !== el) return;
        if (el.classList.contains('anim-text')) return;
        el.classList.add('anim-text');
        el.style.transitionDelay = Math.min(step, 6) * 90 + 'ms';
        step++;
      });
    });

    document.querySelectorAll([
      '.feature__media img', '.role__media img', '.founder img',
      '.card__photo', '.month', '.card', '.role', '.career', '.price', '.tool',
      '.contact-tile', '.faq__item', '.blog-empty__icon', '.map',
      /* .stat and .cta-box are left out: they run their own arrival moves,
         and the media transform would override them. */
      '.rcard'
    ].join(',')).forEach(function (el) {
      el.classList.add('anim-media');
    });

    var targets = document.querySelectorAll('.anim-text, .anim-media');
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (t) { io.observe(t); });

    // Above-the-fold content should not wait for a scroll event.
    requestAnimationFrame(function () {
      targets.forEach(function (t) {
        if (t.getBoundingClientRect().top < window.innerHeight) t.classList.add('is-in');
      });
    });
  }

  /* ------------------------------------------------------------------ form */
  function initForm() {
    var form = document.querySelector('.form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form__note');
      var name = form.querySelector('[name="name"]');
      if (note) {
        note.classList.add('ok');
        note.textContent = 'Thanks' + (name && name.value ? ', ' + name.value.split(' ')[0] : '') +
          '! Your message has been received successfully. We’ll get back to you soon.';
      }
      form.reset();
    });
  }

  /* ------------------------------------------------------------------ year */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* --------------------------------------------------------------- chatbot */
  /* A rule-based assistant: it matches keywords against the site's own
     content, so it answers offline with no API and never invents facts. */

  /* wa.me wants the number with no plus or spaces. Same line as everywhere
     else on the site. */
  var WHATSAPP_URL = 'https://wa.me/916235502722?text=' +
    encodeURIComponent('Hi Golden Qube, I would like to know more about your digital marketing services.');

  var KB = [
    {
      id: 'fees',
      keys: ['fee', 'fees', 'price', 'cost', 'charge', 'payment', 'installment', 'rupee', 'money', 'how much'],
      answer: 'The Digital Marketing course runs for <strong>3 months</strong>, with each month a complete module. For current fees and payment options, call <strong><a href="tel:+916235502722">+91 62355 02722</a></strong> or send us your details on the <a href="contact.html">contact page</a>.',
      chips: ['What is the syllabus?', 'How do I enroll?']
    },
    {
      id: 'course',
      keys: ['course', 'syllabus', 'curriculum', 'module', 'topic', 'subject', 'learn', 'teach', 'duration', 'months', 'training'],
      answer: 'It is a <strong>3-month AI-driven program</strong>:<br>' +
        '<strong>Month 1</strong> — Social media mastery: Facebook, Instagram, LinkedIn, YouTube, WhatsApp automation, Meta Ads analytics.<br>' +
        '<strong>Month 2</strong> — WordPress, SEO (local, international, semantic, AI/GEO), Google Ads, Analytics, Search Console.<br>' +
        '<strong>Month 3</strong> — Automation, growth hacking, e-commerce, Shopify, Amazon, agentic AI.',
      chips: ['What does it cost?', 'What tools will I learn?']
    },
    {
      id: 'tools',
      keys: ['tool', 'tools', 'software', 'platform', 'semrush', 'ahrefs', 'analytics', 'canva', 'chatgpt'],
      answer: 'You will work hands-on with <strong>Google Analytics, Tag Manager, Search Console, Google Ads, SEMrush, Ahrefs, Moz, Screaming Frog, HubSpot, WordPress, Yoast, Canva, Mailchimp, Hootsuite, ChatGPT</strong> and more — 21 tools in total.',
      chips: ['What jobs can I get?', 'What does it cost?']
    },
    {
      id: 'jobs',
      keys: ['job', 'jobs', 'career', 'placement', 'salary', 'hire', 'work', 'opportunity', 'internship'],
      answer: 'Graduates move into roles like <strong>Digital Marketing Manager, SEO Specialist, Social Media Manager, PPC / Google Ads Specialist, Content Marketing Manager</strong> and <strong>Email Marketing Specialist</strong>. The program includes a professional corporate internship and portfolio building.',
      chips: ['Who can enroll?', 'How do I enroll?']
    },
    {
      id: 'eligibility',
      keys: ['who can', 'eligible', 'eligibility', 'qualification', 'requirement', 'beginner', 'student', 'fresher', 'background', 'join'],
      answer: 'Anyone — <strong>students from any background</strong>, graduates, career changers, freelancers, working professionals, startup founders, content creators and business owners. No prior marketing experience is needed.',
      chips: ['What is the syllabus?', 'How do I enroll?']
    },
    {
      id: 'business',
      keys: ['business owner', 'my business', 'company', 'brand', 'service', 'agency', 'audit', 'dmapt', 'plan', 'consult', 'roi', 'lead'],
      answer: 'For businesses we offer <strong>Goal-Based Digital Marketing</strong> (ROI-driven, performance-based campaigns), <strong>one-on-one training for business owners</strong>, and <strong>DMAPT</strong> — Digital Marketing Auditing, Planning &amp; Training.',
      chips: ['Book a consultation', 'Where are you located?']
    },
    {
      id: 'enroll',
      keys: ['enroll', 'enrol', 'admission', 'register', 'sign up', 'apply', 'start', 'book', 'consultation', 'demo', 'brochure'],
      answer: 'Call <strong><a href="tel:+916235502722">+91 62355 02722</a></strong>, email <strong><a href="mailto:info@goldenqube.com">info@goldenqube.com</a></strong>, or send us your details on the <a href="contact.html">contact page</a> and the team will get back to you.',
      chips: ['Where are you located?', 'What are your timings?']
    },
    {
      id: 'contact',
      keys: ['contact', 'phone', 'call', 'number', 'email', 'mail', 'reach', 'talk'],
      answer: 'Phone: <strong><a href="tel:+916235502722">+91 62355 02722</a></strong><br>Email: <strong><a href="mailto:info@goldenqube.com">info@goldenqube.com</a></strong>',
      chips: ['Where are you located?', 'What are your timings?']
    },
    {
      id: 'location',
      keys: ['location', 'address', 'where', 'office', 'kochi', 'cochin', 'kerala', 'reach you', 'directions'],
      answer: 'We are in Kochi:<br><strong>Thoms Heritage, Vakkattu Road, Near Holiday Inn, Chakkaraparambu, Thammanam PO, Cochin - 682032</strong>',
      chips: ['What are your timings?', 'How do I enroll?']
    },
    {
      id: 'hours',
      keys: ['time', 'timing', 'hours', 'open', 'when', 'schedule', 'weekend', 'flexible'],
      answer: 'We are open <strong>Monday to Saturday, 10.00 AM - 6.30 PM</strong>. Training timings are flexible — we schedule around what suits you.',
      chips: ['How do I enroll?', 'What does it cost?']
    },
    {
      id: 'trainers',
      keys: ['trainer', 'teacher', 'faculty', 'mentor', 'founder', 'who teaches', 'sarun', 'shalu', 'libin'],
      answer: 'You will learn from the founders: <strong>Sarun Stani</strong> (12+ years, 100+ brands), <strong>Shalu Stani</strong> (multi-channel campaign specialist) and <strong>Libin Sam Paul</strong> (software analyst, founder of Magic Codz Solutions).',
      chips: ['What is the syllabus?', 'How do I enroll?']
    },
    {
      id: 'greeting',
      keys: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaskaram'],
      answer: 'Hello! How can I help you today?',
      chips: ['What does the course cost?', 'What is the syllabus?', 'Where are you located?']
    },
    {
      id: 'thanks',
      keys: ['thanks', 'thank you', 'ok', 'okay', 'great', 'nice', 'bye'],
      answer: 'Happy to help! Reach us any time on <strong><a href="tel:+916235502722">+91 62355 02722</a></strong>.',
      chips: ['How do I enroll?']
    }
  ];

  var FALLBACK = {
    answer: 'I am not sure about that one. Our team can answer it properly — call <strong><a href="tel:+916235502722">+91 62355 02722</a></strong> or use the <a href="contact.html">contact form</a>.',
    chips: ['What does the course cost?', 'What is the syllabus?', 'Where are you located?']
  };

  var OPENING_CHIPS = ['What does the course cost?', 'What is the syllabus?', 'What jobs can I get?', 'Where are you located?'];

  function initChatbot() {
    var el = document.createElement('div');
    el.className = 'chatbot';
    el.innerHTML =
      '<button class="chatbot__launch" type="button" aria-label="Chat with us" aria-expanded="false">' +
        '<img class="chatbot__icon-open" src="assets/img/favicon.png" alt="">' +
        '<svg class="chatbot__icon-close" width="22" height="22"><use href="#i-close"></use></svg>' +
      '</button>' +
      '<div class="chatbot__panel" role="dialog" aria-label="Golden Qube assistant" hidden>' +
        '<div class="chatbot__head">' +
          '<div class="chatbot__avatar"><img src="assets/img/favicon.png" alt=""></div>' +
          '<div>' +
            '<strong>Golden Qube Assistant</strong>' +
            '<span>Typically replies instantly</span>' +
          '</div>' +
          '<button class="chatbot__x" type="button" aria-label="Close chat">' +
            '<svg width="16" height="16"><use href="#i-close"></use></svg>' +
          '</button>' +
        '</div>' +
        '<div class="chatbot__log" aria-live="polite"></div>' +
        '<div class="chatbot__chips"></div>' +
        '<form class="chatbot__form">' +
          '<input type="text" placeholder="Ask about courses, fees, timings…" aria-label="Your message" autocomplete="off">' +
          '<button type="submit" aria-label="Send">' +
            '<svg width="17" height="17"><use href="#i-send"></use></svg>' +
          '</button>' +
        '</form>' +
        '<a class="chatbot__wa" href="' + WHATSAPP_URL + '" target="_blank" rel="noopener">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
            '<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.8s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.1 11.1 0 0 0 4.3 3.8c.6.3 1.1.4 1.4.5a3.4 3.4 0 0 0 1.6.1 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/>' +
          '</svg>' +
          'Chat on WhatsApp' +
        '</a>' +
      '</div>';
    document.body.appendChild(el);

    var launch = el.querySelector('.chatbot__launch');
    var panel = el.querySelector('.chatbot__panel');
    var log = el.querySelector('.chatbot__log');
    var chips = el.querySelector('.chatbot__chips');
    var form = el.querySelector('.chatbot__form');
    var input = form.querySelector('input');
    var started = false;

    function open() {
      panel.hidden = false;
      requestAnimationFrame(function () { el.classList.add('is-open'); });
      launch.setAttribute('aria-expanded', 'true');
      if (!started) {
        started = true;
        say('bot', 'Hi! I am the Golden Qube assistant. Ask me about our courses, fees, timings or services.');
        setChips(OPENING_CHIPS);
      }
      setTimeout(function () { input.focus(); }, 260);
    }

    function close() {
      el.classList.remove('is-open');
      launch.setAttribute('aria-expanded', 'false');
      setTimeout(function () { panel.hidden = true; }, 220);
    }

    launch.addEventListener('click', function () {
      if (el.classList.contains('is-open')) close(); else open();
    });
    el.querySelector('.chatbot__x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('is-open')) close();
    });

    function say(who, html) {
      var msg = document.createElement('div');
      msg.className = 'chatbot__msg chatbot__msg--' + who;
      msg.innerHTML = '<div class="chatbot__bubble">' + html + '</div>';
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;
      return msg;
    }

    function setChips(list) {
      chips.innerHTML = '';
      (list || []).forEach(function (label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chatbot__chip';
        b.textContent = label;
        b.addEventListener('click', function () { send(label); });
        chips.appendChild(b);
      });
    }

    function match(text) {
      var q = text.toLowerCase();
      var best = null;
      var bestScore = 0;

      KB.forEach(function (entry) {
        var score = 0;
        entry.keys.forEach(function (k) {
          if (q.indexOf(k) !== -1) score += k.length; // longer key = stronger signal
        });
        if (score > bestScore) { bestScore = score; best = entry; }
      });

      return best || FALLBACK;
    }

    function send(text) {
      text = (text || '').trim();
      if (!text) return;

      say('me', escapeHtml(text));
      setChips([]);
      input.value = '';

      var typing = say('bot', '<span class="chatbot__dots"><i></i><i></i><i></i></span>');
      var hit = match(text);

      setTimeout(function () {
        typing.querySelector('.chatbot__bubble').innerHTML = hit.answer;
        log.scrollTop = log.scrollHeight;
        setChips(hit.chips || FALLBACK.chips);
      }, 480);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send(input.value);
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
