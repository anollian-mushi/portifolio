(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  html.classList.add(hasGSAP ? 'has-gsap' : 'no-gsap');

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Split text ---------- */
  // Hero name → one span per letter
  $$('.hero-word').forEach((word) => {
    const text = word.textContent.trim();
    word.textContent = '';
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      word.appendChild(s);
    }
  });

  // Scale the hero name so it spans the full width exactly
  const heroName = $('.hero-name');
  function fitName() {
    if (!heroName) return;
    const words = $$('.hero-word', heroName);
    const stacked = getComputedStyle(heroName).flexDirection === 'column';
    const parent = heroName.parentElement;
    const cs = getComputedStyle(parent);
    const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    heroName.style.fontSize = '100px';
    const widths = words.map((w) => w.scrollWidth);
    const gap = stacked ? 0 : parseFloat(getComputedStyle(heroName).columnGap) || 0;
    const total = stacked ? Math.max(...widths) : widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    heroName.style.fontSize = Math.floor(100 * (avail / total) * 0.995 * 10) / 10 + 'px';
  }
  fitName();
  addEventListener('resize', fitName);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);

  // Statement → one span per word (keeps the serif <em> words)
  const statement = $('[data-split]');
  if (statement) {
    const frag = document.createDocumentFragment();
    statement.childNodes.forEach((node) => {
      const isEm = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const el = document.createElement(isEm ? 'em' : 'span');
        el.className = 'w';
        el.textContent = part;
        frag.appendChild(el);
      });
    });
    statement.textContent = '';
    statement.appendChild(frag);
  }

  /* ---------- Nav: hide on scroll down, active section ---------- */
  const nav = $('.nav');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!body.classList.contains('menu-open')) {
      if (y > lastY + 8 && y > 160) nav.classList.add('hide');
      else if (y < lastY - 8 || y < 160) nav.classList.remove('hide');
    }
    lastY = y;
  }, { passive: true });

  const navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#mobile-menu');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    menu.hidden = !open;
    body.classList.toggle('menu-open', open);
    if (open) nav.classList.remove('hide');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(menu.hidden));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    addEventListener('resize', () => { if (innerWidth > 1024 && !menu.hidden) setMenu(false); });
  }

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast.textContent = 'Email copied';
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
      } catch (_) {
        location.href = 'mailto:' + btn.dataset.copy;
      }
    });
  });

  /* ---------- Cursor + magnetic buttons (mouse only) ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = $('.cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add('on'); });
    document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
    (function follow() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(follow);
    })();
    $$('a, button').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('big'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('big'));
    });

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  if (!hasGSAP) return;

  /* =========================================================
     GSAP + ScrollTrigger
     ========================================================= */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const preloader = $('.preloader');
  const plCount = $('.pl-count');
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1025px)',
    },
    (ctx) => {
      const { motion, desktop } = ctx.conditions;

      if (!motion) {
        gsap.set(preloader, { display: 'none' });
        return;
      }

      /* ---- Intro: count to 100, wipe up, letters rise ---- */
      const counter = { v: 0 };
      gsap.timeline()
        .to(counter, {
          v: 100,
          duration: 1.3,
          ease: 'power2.inOut',
          onUpdate: () => { plCount.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
        })
        .to(preloader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
        .from('.hero-word .ch', { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, '-=0.55')
        .from(['.hero-top', '.hero-row'], { opacity: 0, y: 28, duration: 1.1, ease: 'power3.out', stagger: 0.12 }, '-=1.1')
        .set(preloader, { display: 'none' });

      /* ---- Hero leaves: name drifts down, copy fades ---- */
      gsap.to('.hero-name', {
        yPercent: 35,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to(['.hero-row', '.hero-top'], {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '20% top', end: '70% top', scrub: true },
      });

      /* ---- Statement: pinned, words light up as you scroll ---- */
      const words = $$('.statement-text .w');
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: '.statement', start: 'top top', end: '+=150%', pin: true, scrub: 0.6 },
      });

      /* ---- Work: sideways scroll on large screens ---- */
      const work = $('.work');
      const track = $('.work-track');
      if (desktop && work && track) {
        work.classList.add('h-scroll');
        const viewport = $('.work-viewport');
        const bar = $('.work-progress span');
        const distance = () => {
          const pad = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
          return Math.max(0, track.scrollWidth - (viewport.clientWidth - pad * 2));
        };
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: work,
            start: 'top top',
            end: () => '+=' + distance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
          },
        });
      } else {
        $$('.panel').forEach((panel) => {
          gsap.from(panel, {
            y: 60,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: panel, start: 'top 90%', once: true },
          });
        });
      }

      /* ---- Reveal on scroll ---- */
      $$('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 56,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      /* ---- Numbers count up ---- */
      $$('[data-count]').forEach((el) => {
        const end = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        const o = { v: 0 };
        el.textContent = '0' + suffix;
        gsap.to(o, {
          v: end,
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US') + suffix; },
        });
      });

      /* ---- Marquee leans with scroll speed ---- */
      const skew = gsap.quickTo('.marquee', 'skewX', { duration: 0.6, ease: 'power3' });
      ScrollTrigger.create({
        trigger: '.skills',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => skew(gsap.utils.clamp(-10, 10, self.getVelocity() / -300)),
        onLeave: () => skew(0),
        onLeaveBack: () => skew(0),
      });

      /* ---- Contact headline grows in ---- */
      gsap.from('.contact-title', {
        scale: 0.86,
        yPercent: 18,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: '.contact', start: 'top 85%', end: 'top 20%', scrub: true },
      });

      ScrollTrigger.sort();
      return () => { if (work) work.classList.remove('h-scroll'); };
    }
  );

  // Fonts change text sizes, so measure again once they're in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
