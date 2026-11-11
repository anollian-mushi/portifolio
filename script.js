(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Text scramble ---------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function scramble(el, duration = 900) {
    const final = el.dataset.text || el.textContent;
    el.dataset.text = final;
    if (reduceMotion) { el.textContent = final; return; }
    const start = performance.now();
    const reveal = [...final].map((_, i) => (i / final.length) * 0.6 + Math.random() * 0.4);

    function frame(now) {
      const t = clamp((now - start) / duration, 0, 1);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        if (final[i] === ' ' || t >= reveal[i]) out += final[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }

  const logo = $('.logo-mark');
  if (logo) logo.closest('a').addEventListener('mouseenter', () => scramble(logo, 500));

  /* ---------- Preloader → hero entrance ---------- */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    body.classList.add('loaded');
    setTimeout(() => $$('.hero-title [data-scramble]').forEach((el, i) =>
      setTimeout(() => scramble(el, 1100), i * 180)), 350);
  }
  const minDelay = reduceMotion ? 0 : 950;
  const t0 = performance.now();
  const go = () => setTimeout(start, Math.max(0, minDelay - (performance.now() - t0)));
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
  setTimeout(start, 2500); // never wait longer than this

  /* ---------- Sound-wave hero canvas ---------- */
  const canvas = $('.hero-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    let w = 0, h = 0, dpr = 1, running = true, raf = 0;
    const mouse = { x: 0.6, y: 0.5, tx: 0.6, ty: 0.5, energy: 0 };
    const small = innerWidth < 700;
    const particles = Array.from({ length: small ? 38 : 80 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025, vy: (Math.random() - 0.5) * 0.00025,
      r: Math.random() * 1.4 + 0.4,
    }));

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time) {
      const t = time * 0.001;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      mouse.energy *= 0.96;

      ctx.clearRect(0, 0, w, h);

      // Particle network
      const linkDist = small ? 90 : 130;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1;
        if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x * w, ay = a.y * h;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = ax - b.x * w, dy = ay - b.y * h;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(129,140,248,${(1 - d / linkDist) * 0.18})`;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(ax, ay, a.r, 0, Math.PI * 2); ctx.fill();
      }

      // Sound waves
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      // fade out on the left on wide screens so the waves don't run behind the intro text
      grad.addColorStop(0, 'rgba(34,211,238,0)');
      grad.addColorStop(small ? 0.2 : 0.42, small ? 'rgba(34,211,238,1)' : 'rgba(34,211,238,0.15)');
      grad.addColorStop(0.6, 'rgba(129,140,248,1)');
      grad.addColorStop(0.85, 'rgba(232,121,249,1)');
      grad.addColorStop(1, 'rgba(232,121,249,0)');
      ctx.strokeStyle = grad;

      const lines = 6;
      const baseY = h * (small ? 0.78 : 0.7);
      for (let l = 0; l < lines; l++) {
        ctx.globalAlpha = 0.65 - l * 0.09;
        ctx.lineWidth = l === 0 ? 2 : 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const nx = x / w;
          const near = Math.exp(-((nx - mouse.x) ** 2) / 0.025);
          const amp = (h * 0.045) * (0.6 + 0.4 * Math.sin(t * 0.7 + l)) * (1 + near * (1.4 + mouse.energy * 2));
          const y = baseY
            + Math.sin(nx * (9 + l * 1.3) + t * (1.2 + l * 0.15) + l * 0.8) * amp
            + Math.sin(nx * 23 - t * 2.1 + l) * amp * 0.25;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function loop(time) {
      draw(time);
      if (running && !reduceMotion) raf = requestAnimationFrame(loop);
    }

    resize();
    addEventListener('resize', resize);
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
      mouse.energy = Math.min(1, mouse.energy + 0.08);
    });

    new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(loop);
    }).observe(hero);

    if (reduceMotion) draw(4000);
  }

  /* ---------- Statement: split into words ---------- */
  const statementText = $('[data-split]');
  if (statementText) {
    const frag = document.createDocumentFragment();
    statementText.childNodes.forEach((node) => {
      const accent = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const span = document.createElement('span');
        span.className = 'word' + (accent ? ' accent' : '');
        span.textContent = part;
        frag.appendChild(span);
      });
    });
    statementText.textContent = '';
    statementText.appendChild(frag);
  }
  const words = $$('.statement-text .word');
  const statement = $('.statement');
  if (reduceMotion) words.forEach((w) => w.classList.add('lit'));

  /* ---------- Scroll-driven effects ---------- */
  const progressBar = $('.scroll-progress span');
  const navWrap = $('.nav-wrap');
  const timeline = $('.timeline-wrap');
  const fill = $('.timeline-fill');
  const jobs = $$('.job');
  let lastY = scrollY;
  let ticking = false;

  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // Hide nav when scrolling down, show when scrolling up
    if (navWrap && !body.classList.contains('menu-open')) {
      if (y > lastY + 6 && y > 200) navWrap.classList.add('hide');
      else if (y < lastY - 6 || y < 200) navWrap.classList.remove('hide');
    }
    lastY = y;

    // Statement words light up
    if (statement && words.length && !reduceMotion) {
      const r = statement.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
      const n = Math.round(p * words.length * 1.15);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    }

    // Timeline fill
    if (timeline && fill) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((innerHeight * 0.6 - r.top) / r.height, 0, 1);
      fill.style.transform = `scaleY(${p})`;
      const lineY = innerHeight * 0.6;
      jobs.forEach((job) => {
        const dot = job.querySelector('.job-dot').getBoundingClientRect();
        job.classList.toggle('active', dot.top < lineY);
      });
    }
    ticking = false;
  }
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    const dur = 1800;
    const s = performance.now();
    (function tick(now) {
      const t = clamp((now - s) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (t < 1) requestAnimationFrame(tick);
    })(s);
  }
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav-links a');
  const sectionIds = navLinks.map((a) => a.getAttribute('href').slice(1));
  if ('IntersectionObserver' in window) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionIds.forEach((id) => { const s = document.getElementById(id); if (s) nio.observe(s); });
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#mobile-menu');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    body.classList.toggle('menu-open', open);
    if (open) navWrap.classList.remove('hide');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(menu.hidden));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    addEventListener('resize', () => { if (innerWidth > 960 && !menu.hidden) setMenu(false); });
  }

  /* ---------- Pointer effects (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    // Soft glow that follows the cursor
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('on');
    });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
    (function follow() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(follow);
    })();

    // Spotlight border + gentle 3D tilt on cards
    $$('.spot').forEach((card) => {
      const tilt = card.matches('.card, .feature, .tile, .edu-card');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        if (tilt && card.classList.contains('in')) {
          const strength = card.matches('.feature') ? 3 : 6;
          const rx = ((y / r.height) - 0.5) * -strength;
          const ry = ((x / r.width) - 0.5) * strength;
          card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // Magnetic buttons
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast('Email copied to clipboard ✓');
      } catch (_) {
        location.href = 'mailto:' + btn.dataset.copy;
      }
    });
  });
})();
