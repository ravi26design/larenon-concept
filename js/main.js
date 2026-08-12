/* ============================================================
   LA RENON — interactions
   ============================================================ */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const SNAP = location.search.includes('snap'); // verification: reveal everything instantly

  if (SNAP) {
    addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.reveal-up,[data-splt],[data-reveal],.mk,.hero__title').forEach(e => e.classList.add('in', 'lit'));
      document.querySelectorAll('.count').forEach(e => { e.textContent = e.dataset.to + (e.dataset.suffix || ''); });
      const l = document.getElementById('loader'); if (l) l.style.display = 'none';
      const hero = document.querySelector('.hero'); if (hero) hero.style.minHeight = '760px';
      const hs = document.querySelector('.hscroll'); if (hs) { hs.classList.add('is-native'); const vp = hs.querySelector('.hscroll__viewport'); if (vp) vp.style.overflow = 'visible'; }
    });
  }

  /* ---------------- Preloader ---------------- */
  const loader = document.getElementById('loader');
  const numEl = document.getElementById('loaderNum');
  const barEl = document.getElementById('loaderBar');
  const DURATION = 1500;             // time-based so it never stalls under rAF throttling
  let startT = null, finished = false;
  const setP = (p) => {
    if (numEl) numEl.textContent = String(Math.floor(p)).padStart(2, '0');
    if (barEl) barEl.style.width = p + '%';
  };
  const tick = (ts) => {
    if (startT === null) startT = ts;
    const prog = Math.min((ts - startT) / DURATION, 1);
    setP(prog * 100);
    if (prog < 1 && !finished) requestAnimationFrame(tick);
    else finish();
  };
  const finish = () => {
    if (finished) return; finished = true;
    setP(100);
    loader && loader.classList.add('done');
    document.body.classList.add('loaded');
    const t = document.querySelector('.hero__title');
    t && t.classList.add('in');
    revealNearTop();
  };
  if (reduce) { finish(); }
  else { requestAnimationFrame(tick); setTimeout(finish, DURATION + 400); } // hard safety cap

  /* ---------------- Custom cursor ---------------- */
  if (!isTouch) {
    const cur = document.querySelector('.cursor');
    const dot = document.querySelector('.cursor__dot');
    const ring = document.querySelector('.cursor__ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll('[data-cursor="hover"], a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cur.classList.remove('is-hover'));
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (!isTouch) {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
      const strength = 0.4;
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
      btn.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1)';
    });
  }

  /* ---------------- Split text into chars ---------------- */
  document.querySelectorAll('[data-splt]').forEach(el => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    const frag = document.createDocumentFragment();
    // preserve <em>/<span> children by walking nodes
    const wrap = (node, parent) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
          child.textContent.split('').forEach((ch, i) => {
            const s = document.createElement('span');
            s.className = 'char';
            s.style.transitionDelay = (i * 0.018) + 's';
            s.textContent = ch === ' ' ? ' ' : ch;
            parent.appendChild(s);
          });
        } else {
          const clone = child.cloneNode(false);
          parent.appendChild(clone);
          wrap(child, clone);
        }
      });
    };
    const holder = document.createElement('span');
    wrap(el, holder);
    el.textContent = '';
    el.appendChild(holder);
  });

  /* ---------------- Reveal on scroll ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        // highlight marker if present
        const mk = en.target.querySelector && en.target.querySelector('.mk');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal-up, [data-splt], [data-reveal]').forEach(el => io.observe(el));

  function revealNearTop() {
    document.querySelectorAll('.reveal-up, [data-splt], [data-reveal]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92) el.classList.add('in');
    });
  }

  // marker underline (statement)
  const mkIO = new IntersectionObserver((e) => {
    e.forEach(en => { if (en.isIntersecting) { en.target.classList.add('lit'); mkIO.unobserve(en.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('.mk').forEach(el => mkIO.observe(el));

  /* ---------------- Counters ---------------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const to = parseInt(el.dataset.to, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1600; let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const prog = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - prog, 3);
        el.textContent = Math.floor(eased * to) + (prog === 1 ? suffix : '');
        if (prog < 1) requestAnimationFrame(step);
        else el.textContent = to + suffix;
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.count').forEach(el => countIO.observe(el));

  /* ---------------- Accordion ---------------- */
  document.querySelectorAll('.acc__row').forEach(row => {
    row.querySelector('.acc__bar').addEventListener('click', () => {
      const open = row.classList.contains('open');
      document.querySelectorAll('.acc__row.open').forEach(r => r.classList.remove('open'));
      if (!open) row.classList.add('open');
    });
  });
  // open first by default
  const firstRow = document.querySelector('.acc__row');
  firstRow && firstRow.classList.add('open');

  /* ---------------- Nav hide on scroll down ---------------- */
  const nav = document.getElementById('nav');
  const scrollBar = document.getElementById('scrollBar');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (scrollBar) scrollBar.style.width = (y / h * 100) + '%';
    if (nav) {
      nav.classList.toggle('scrolled', y > 60);
      if (y > lastY && y > 400) nav.classList.add('hide');
      else nav.classList.remove('hide');
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- Smooth anchor scrolling ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id === '#top') { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const target = document.querySelector(id);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ---------------- Full-screen menu ---------------- */
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuToggle && menuToggle.setAttribute('aria-expanded', String(open));
    menu && menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && nav) nav.classList.remove('hide');
  };
  menuToggle && menuToggle.addEventListener('click', () => {
    setMenu(!document.body.classList.contains('menu-open'));
  });
  // close when a menu link is clicked (in-page anchors); external links still navigate
  menu && menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenu(false));
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------------- Molecular network canvas ---------------- */
  if (!reduce) initMolecule();
  function initMolecule() {
    const canvas = document.getElementById('molecule');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [];
    const COUNT = window.innerWidth < 700 ? 22 : 40;
    const LINK = 115;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const build = () => {
      nodes = Array.from({ length: COUNT }, () => ({
        x: rnd(0, w), y: rnd(0, h),
        vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25),
        r: rnd(1, 2.6)
      }));
    };
    let mouse = { x: -9999, y: -9999 };
    canvas.parentElement.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        // mouse repel
        const dxm = n.x - mouse.x, dym = n.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 120) { n.x += dxm / dm * 1.2; n.y += dym / dm * 1.2; }

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x, dy = n.y - m.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const o = (1 - d / LINK) * 0.5;
            ctx.strokeStyle = `rgba(255,75,63,${o * 0.55})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,224,216,.9)';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize(); build(); draw();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); build(); }, 200); });
  }

  /* ---------------- Subtle parallax on hero orb ---------------- */
  if (!reduce && !isTouch) {
    const orb = document.querySelector('.hero__orb');
    addEventListener('mousemove', e => {
      const x = (e.clientX / innerWidth - 0.5);
      const y = (e.clientY / innerHeight - 0.5);
      if (orb) orb.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
    });
  }

  /* ---------------- Events & Participation tabs ---------------- */
  (function initEventTabs() {
    const tabs = Array.from(document.querySelectorAll('.etab'));
    const panels = Array.from(document.querySelectorAll('.epanel'));
    if (!tabs.length) return;
    const activate = (i) => {
      tabs.forEach((t, n) => { t.classList.toggle('is-active', n === i); t.setAttribute('aria-selected', String(n === i)); });
      panels.forEach((p, n) => p.classList.toggle('is-active', n === i));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(i));
      t.addEventListener('mouseenter', () => { if (!isTouch) activate(i); }); // hover to preview on desktop
    });
  })();

  /* ---------------- Divisions: scroll-linked horizontal scroll ---------------- */
  (function initHScroll() {
    const sec = document.querySelector('.hscroll');
    const track = document.getElementById('hsTrack');
    const prog = document.getElementById('hsProgress');
    if (!sec || !track) return;

    // reduced motion → native horizontal swipe fallback (no pinning)
    if (reduce) { sec.classList.add('is-native'); return; }

    const enabled = () => window.matchMedia('(min-width: 821px)').matches && !sec.classList.contains('is-native');
    let extra = 0;

    const layout = () => {
      if (!enabled()) { sec.style.height = ''; track.style.transform = ''; if (prog) prog.style.width = ''; return; }
      extra = Math.max(0, track.scrollWidth - window.innerWidth);
      sec.style.height = (window.innerHeight + extra) + 'px';
      update();
    };
    const update = () => {
      if (!enabled() || extra <= 0) return;
      const rect = sec.getBoundingClientRect();
      const total = sec.offsetHeight - window.innerHeight;
      let p = total > 0 ? (-rect.top) / total : 0;
      p = Math.min(Math.max(p, 0), 1);
      track.style.transform = 'translate3d(' + (-p * extra).toFixed(2) + 'px,0,0)';
      if (prog) prog.style.width = (p * 100) + '%';
    };

    // wait for images to affect scrollWidth
    layout();
    window.addEventListener('load', layout);
    setTimeout(layout, 400);
    addEventListener('scroll', update, { passive: true });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  })();

})();
