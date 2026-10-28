/* PSU AI & Robotics Excellence Lab — homepage behaviour */
(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Kept global so any older inline onclick="scrollToSection('…')" still works
  window.scrollToSection = function (id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ── Footer year ───────────────────────────────────────────── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Header: shadow on scroll, mobile menu ─────────────────── */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navToggle = $('.nav-toggle');
  const nav = $('#site-nav');
  if (navToggle && nav) {
    const setOpen = open => {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); navToggle.focus(); }
    });
  }

  /* ── Highlight the nav link for the section in view ────────── */
  const navLinks = $$('.main-nav a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    const linkFor = id => navLinks.find(a => a.getAttribute('href') === '#' + id);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('is-active'));
        const link = linkFor(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => spy.observe(s));
  }

  /* ── Scroll progress bar under the header ──────────────────── */
  const progress = $('.scroll-progress i');
  if (progress) {
    const setProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    };
    setProgress();
    window.addEventListener('scroll', setProgress, { passive: true });
    window.addEventListener('resize', setProgress);
  }

  /* ── Partner logo band: duplicate the row so it scrolls seamlessly ─ */
  const marquee = $('.marquee');
  if (marquee && !reduceMotion) {
    const track = $('.marquee-track', marquee);
    Array.from(track.children).forEach(li => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
    marquee.style.setProperty('--marquee-time', Math.max(30, track.children.length * 3.2) + 's');
    marquee.classList.add('is-moving');
  }

  /* ── Logos: until a logo file exists, show a clean name wordmark ─ */
  $$('img[data-name]').forEach(img => {
    const swap = () => {
      const name = img.dataset.name;
      const word = document.createElement('span');
      word.className = 'logo-word';
      word.setAttribute('role', 'img');
      word.setAttribute('aria-label', img.alt || name);
      const mark = document.createElement('b');
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = name.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();
      word.append(mark, document.createTextNode(name));
      img.replaceWith(word);
    };
    const isSvg = /\.svg(\?|$)/i.test(img.getAttribute('src') || '');
    if (img.complete && img.naturalWidth === 0 && !isSvg) swap();
    else img.addEventListener('error', swap, { once: true });
  });

  /* ── Partnership KPIs follow the outreach chart and the partner cards ─ */
  (function syncKpis() {
    const set = (key, value) => {
      const el = $('[data-kpi="' + key + '"]');
      if (el) { el.dataset.count = value; el.textContent = value; }
    };
    const sum = cls => $$('.bars .bar.' + cls).reduce((total, bar) => {
      const v = parseFloat(bar.style.getPropertyValue('--v'));
      return total + (isNaN(v) ? 0 : v);
    }, 0);
    if ($('.bars')) {
      set('sent', sum('sent'));
      set('delivered', sum('delivered'));
      set('reply', sum('reply'));
    }
    const cards = $$('.partner-grid .partner-card').length;
    if (cards) set('programs', cards);
  })();

  /* ── Count-up numbers ([data-count]) ───────────────────────── */
  function countUp(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion || target === 0) { el.textContent = target + suffix; return; }
    const start = performance.now(), dur = 1100;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  window.__countUp = countUp;

  /* ── Reveal on scroll (.reveal, [data-count], chart) ───────── */
  const revealTargets = $$('.reveal, [data-count], .year-bars');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('is-in');
        if (el.dataset.count !== undefined) countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-in'));
  }

  /* ── Publications: counts, filter, search ──────────────────── */
  (function initPublications() {
    const list = $('#pub-list');
    if (!list) return;
    const search  = $('#pub-search');
    const buttons = $$('.pub-filter');
    const items   = $$('.pub-item', list);
    const groups  = $$('.pub-year-group', list);
    const empty   = $('#pub-empty');
    const status  = $('#pub-status');
    const clear   = $('#pub-clear');

    let filter = 'all';
    let query  = '';

    // Counts per venue are computed from the list, so they stay right as papers are added
    const counts = { all: items.length };
    items.forEach(i => { const j = i.dataset.journal || ''; counts[j] = (counts[j] || 0) + 1; });
    buttons.forEach(b => {
      const c = $('.count', b);
      if (c) c.textContent = counts[b.dataset.filter] || 0;
    });
    groups.forEach(g => {
      const label = $('.pub-year-label', g);
      if (label && !$('.year-count', label)) {
        const span = document.createElement('span');
        span.className = 'year-count';
        label.appendChild(span);
      }
    });

    function apply() {
      let shown = 0;
      items.forEach(item => {
        const text = (item.textContent || '').toLowerCase();
        const ok = (filter === 'all' || item.dataset.journal === filter) && (!query || text.includes(query));
        item.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      groups.forEach(g => {
        const n = $$('.pub-item:not(.hidden)', g).length;
        g.hidden = n === 0;
        const yc = $('.year-count', g);
        if (yc) yc.textContent = n === 1 ? '1 publication' : n + ' publications';
      });
      if (empty) empty.hidden = shown > 0;
      if (status) status.textContent = 'Showing ' + shown + ' of ' + items.length;
    }

    function setFilter(value) {
      filter = value;
      buttons.forEach(b => {
        const on = b.dataset.filter === value;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('#pub-chart .seg').forEach(s => s.classList.toggle('is-off', value !== 'all' && s.dataset.venue !== value));
      apply();
    }

    /* Publications per year, by venue — built from the list itself */
    (function buildChart() {
      const chart = $('#pub-chart');
      if (!chart) return;
      const VENUES = [['ieee', 'IEEE'], ['ijgca', 'IJGCA'], ['ijesa', 'IJESA'], ['conference', 'Conference']];
      const byYear = {};
      items.forEach(item => {
        const g = item.closest('.pub-year-group');
        const year = g ? g.dataset.year : '';
        if (!year) return;
        byYear[year] = byYear[year] || {};
        const v = item.dataset.journal || 'other';
        byYear[year][v] = (byYear[year][v] || 0) + 1;
      });
      const years = Object.keys(byYear).sort();
      const totals = years.map(y => Object.values(byYear[y]).reduce((a, b) => a + b, 0));
      const max = Math.max.apply(null, totals.concat(1));
      const tip = $('#pub-tip');
      const host = chart.closest('.pub-chart');

      years.forEach((year, idx) => {
        const row = document.createElement('div');
        row.className = 'year-row';
        const yr = document.createElement('span'); yr.className = 'yr'; yr.textContent = year;
        const track = document.createElement('div'); track.className = 'year-track';
        const fill = document.createElement('div'); fill.className = 'year-fill';
        fill.style.setProperty('--w', (totals[idx] / max * 100).toFixed(2) + '%');
        VENUES.forEach(([key, label]) => {
          const n = byYear[year][key] || 0;
          if (!n) return;
          const seg = document.createElement('button');
          seg.type = 'button';
          seg.className = 'seg ' + key;
          seg.dataset.venue = key;
          seg.style.flex = n + ' 1 0';
          seg.textContent = n;
          seg.setAttribute('aria-label', year + ', ' + label + ': ' + n + (n === 1 ? ' publication' : ' publications') + '. Show in list.');
          const show = () => {
            chart.classList.add('has-hover');
            $$('.seg', chart).forEach(s => s.classList.toggle('is-hover', s === seg));
            if (!tip || !host) return;
            tip.innerHTML = '<b>' + year + ' · ' + label + '</b> — ' + n + (n === 1 ? ' publication' : ' publications');
            const r = seg.getBoundingClientRect(), h = host.getBoundingClientRect();
            tip.style.left = (r.left - h.left + r.width / 2) + 'px';
            tip.style.top = (r.top - h.top) + 'px';
            tip.hidden = false;
          };
          const hide = () => {
            chart.classList.remove('has-hover');
            $$('.seg', chart).forEach(s => s.classList.remove('is-hover'));
            if (tip) tip.hidden = true;
          };
          seg.addEventListener('mouseenter', show);
          seg.addEventListener('focus', show);
          seg.addEventListener('mouseleave', hide);
          seg.addEventListener('blur', hide);
          seg.addEventListener('click', () => {
            setFilter(filter === key ? 'all' : key);
            const side = $('.pub-side');
            if (side && window.innerWidth <= 1000) side.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          });
          fill.appendChild(seg);
        });
        track.appendChild(fill);
        const tot = document.createElement('span'); tot.className = 'tot'; tot.textContent = totals[idx];
        row.append(yr, track, tot);
        chart.appendChild(row);
      });

      const total = totals.reduce((a, b) => a + b, 0);
      chart.setAttribute('aria-label', 'Publications per year by venue: ' +
        years.map((y, i) => y + ' ' + totals[i] + ' (' + VENUES.filter(([k]) => byYear[y][k]).map(([k, l]) => l + ' ' + byYear[y][k]).join(', ') + ')').join('; '));
      const totalEl = $('#pub-total');
      if (totalEl) { totalEl.dataset.count = total; totalEl.textContent = total; }

      const note = $('#pub-chart-note');
      if (note && years.length > 1) {
        const last = years[years.length - 1], prev = years[years.length - 2];
        const thisYear = String(new Date().getFullYear()) === last;
        note.textContent = totals[years.length - 1] + ' in ' + last + (thisYear ? ' so far' : '') +
          ', up from ' + totals[years.length - 2] + ' in ' + prev + '. Select a segment to filter the list.';
        if (totals[years.length - 1] <= totals[years.length - 2]) {
          note.textContent = totals[years.length - 1] + ' in ' + last + (thisYear ? ' so far' : '') + ' and ' +
            totals[years.length - 2] + ' in ' + prev + '. Select a segment to filter the list.';
        }
      }
    })();

    buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
    if (search) search.addEventListener('input', e => { query = e.target.value.toLowerCase().trim(); apply(); });
    if (clear) clear.addEventListener('click', () => {
      if (search) search.value = '';
      query = '';
      setFilter('all');
      if (search) search.focus();
    });

    apply();
  })();

  /* ── Org chart: avatars, counts, toggle, search ────────────── */
  (function initOrgChart() {
    const root = $('#members');
    if (!root) return;

    $$('.members-list li', root).forEach(li => {
      const name = li.textContent.trim();
      li.dataset.name = name.toLowerCase();
      const words = name.split(/\s+/).filter(w => /^[A-Za-z]/.test(w));
      const initials = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || '?').slice(0, 2);
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initials.toUpperCase();
      const label = document.createElement('span');
      label.textContent = name;
      li.textContent = '';
      li.append(avatar, label);
    });

    $$('.branch', root).forEach(b => {
      const c = $('.branch-count', b);
      const n = $$('.members-list li', b).length;
      if (c) c.textContent = n === 1 ? '1 member' : n + ' members';
    });

    const toggles = $$('.toggle', root);
    const setOpen = (btn, open) => {
      const list = document.getElementById(btn.getAttribute('aria-controls'));
      if (list) list.classList.toggle('collapsed', !open);
      btn.setAttribute('aria-expanded', String(open));
    };
    toggles.forEach(btn => btn.addEventListener('click', () => setOpen(btn, btn.getAttribute('aria-expanded') !== 'true')));

    const expandAll = $('#expand-all');
    const collapseAll = $('#collapse-all');
    if (expandAll)   expandAll.addEventListener('click', () => toggles.forEach(b => setOpen(b, true)));
    if (collapseAll) collapseAll.addEventListener('click', () => toggles.forEach(b => setOpen(b, false)));

    const orgSearch = $('#org-search');
    if (orgSearch) {
      orgSearch.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        if (q) toggles.forEach(b => setOpen(b, true));
        $$('.branch', root).forEach(branch => {
          let visible = 0;
          $$('.members-list li', branch).forEach(li => {
            const ok = !q || li.dataset.name.includes(q);
            li.hidden = !ok;
            if (ok) visible++;
          });
          let note = $('.branch-empty', branch);
          if (!visible) {
            if (!note) {
              note = document.createElement('p');
              note.className = 'branch-empty';
              note.textContent = 'No member matches this search.';
              branch.appendChild(note);
            }
          } else if (note) note.remove();
        });
      });
    }
  })();

  /* ── Hero: two-joint arm that reaches for the pointer ──────── */
  (function initArm() {
    const svg = $('#arm');
    if (!svg) return;
    const q = id => svg.getElementById ? svg.getElementById(id) : $('#' + id, svg);

    const BASE = { x: 128, y: 300 };
    const L1 = 165, L2 = 135;
    const MIN_R = Math.abs(L1 - L2) + 12, MAX_R = L1 + L2 - 2;

    const parts = {
      l1o: q('arm-l1o'), l1i: q('arm-l1i'), l2o: q('arm-l2o'), l2i: q('arm-l2i'),
      j1: q('arm-j1'), p1: q('arm-p1'), grip: q('arm-grip'),
      f1: q('arm-f1'), f2: q('arm-f2'),
      ext: q('arm-ext'), arc1: q('arm-arc1'), arc2: q('arm-arc2'),
      t1: q('arm-t1'), t2: q('arm-t2'), target: q('arm-target')
    };

    const fmt = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(0) + '°';
    const deg = r => r * 180 / Math.PI;
    const setLine = (el, x1, y1, x2, y2) => {
      el.setAttribute('x1', x1.toFixed(1)); el.setAttribute('y1', y1.toFixed(1));
      el.setAttribute('x2', x2.toFixed(1)); el.setAttribute('y2', y2.toFixed(1));
    };
    // arc between two world angles (radians, counter-clockwise, y up)
    const arc = (cx, cy, r, a0, a1) => {
      const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
      const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
      const sweep = a1 > a0 ? 0 : 1;
      return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' ' + sweep + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
    };
    const placeText = (el, cx, cy, r, a, text) => {
      el.setAttribute('x', (cx + r * Math.cos(a)).toFixed(1));
      el.setAttribute('y', (cy - r * Math.sin(a)).toFixed(1));
      el.textContent = text;
    };

    let grip = 11;           // finger opening
    let gripGoal = 11;

    function render(tx, ty) {
      parts.target.setAttribute('transform', 'translate(' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ')');

      let dx = tx - BASE.x, dy = BASE.y - ty;
      let d = Math.hypot(dx, dy) || 1;
      const r = Math.min(MAX_R, Math.max(MIN_R, d));
      dx = dx / d * r; dy = dy / d * r;

      // inverse kinematics, elbow-up solution
      const c2 = (r * r - L1 * L1 - L2 * L2) / (2 * L1 * L2);
      const q2 = -Math.acos(Math.max(-1, Math.min(1, c2)));
      const q1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2));

      const ex = BASE.x + L1 * Math.cos(q1), ey = BASE.y - L1 * Math.sin(q1);
      const a2 = q1 + q2;
      const hx = ex + L2 * Math.cos(a2), hy = ey - L2 * Math.sin(a2);

      setLine(parts.l1o, BASE.x, BASE.y, ex, ey); setLine(parts.l1i, BASE.x, BASE.y, ex, ey);
      setLine(parts.l2o, ex, ey, hx, hy);         setLine(parts.l2i, ex, ey, hx, hy);
      parts.j1.setAttribute('cx', ex.toFixed(1)); parts.j1.setAttribute('cy', ey.toFixed(1));
      parts.p1.setAttribute('cx', ex.toFixed(1)); parts.p1.setAttribute('cy', ey.toFixed(1));
      parts.grip.setAttribute('transform', 'translate(' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ') rotate(' + (-deg(a2)).toFixed(1) + ')');
      parts.f1.setAttribute('d', 'M2 ' + (-grip).toFixed(1) + ' H18 L26 ' + (-(grip - 7)).toFixed(1));
      parts.f2.setAttribute('d', 'M2 ' + grip.toFixed(1) + ' H18 L26 ' + (grip - 7).toFixed(1));

      setLine(parts.ext, ex, ey, ex + 46 * Math.cos(q1), ey - 46 * Math.sin(q1));
      parts.arc1.setAttribute('d', arc(BASE.x, BASE.y, 46, 0, q1));
      parts.arc2.setAttribute('d', arc(ex, ey, 34, q1, a2));
      placeText(parts.t1, BASE.x, BASE.y, 84, q1 / 2, 'θ₁ ' + fmt(deg(q1)));
      placeText(parts.t2, ex, ey, 62, q1 + q2 / 2, 'θ₂ ' + fmt(deg(q2)));
    }

    // pointer → SVG coordinates
    const toSvg = e => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const m = svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: 320, y: 170 };
    };
    const clampTarget = p => ({ x: Math.max(170, Math.min(456, p.x)), y: Math.max(24, Math.min(314, p.y)) });

    const idle = t => ({ x: 300 + 115 * Math.cos(t / 2300), y: 165 + 70 * Math.sin(t / 1700) });
    let goal = idle(0);
    let cur = { x: goal.x, y: goal.y };
    let pointerActive = false;
    let lastPointer = 0;

    svg.addEventListener('pointermove', e => {
      goal = clampTarget(toSvg(e));
      pointerActive = true; lastPointer = performance.now();
      if (reduceMotion) { cur = goal; render(cur.x, cur.y); }
    });
    svg.addEventListener('pointerdown', e => {
      goal = clampTarget(toSvg(e));
      pointerActive = true; lastPointer = performance.now();
      gripGoal = 4;
      if (reduceMotion) { grip = gripGoal; cur = goal; render(cur.x, cur.y); }
    });
    const release = () => {
      gripGoal = 11;
      if (reduceMotion) { grip = gripGoal; render(cur.x, cur.y); }
    };
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);
    svg.addEventListener('pointerleave', () => { pointerActive = false; release(); });

    render(cur.x, cur.y);
    if (reduceMotion) return;

    let running = false;
    let inView = true;
    let raf = 0;
    function frame(t) {
      if (!pointerActive && t - lastPointer > 1500) goal = idle(t);
      cur.x += (goal.x - cur.x) * 0.12;
      cur.y += (goal.y - cur.y) * 0.12;
      grip += (gripGoal - grip) * 0.25;
      render(cur.x, cur.y);
      if (running) raf = requestAnimationFrame(frame);
    }
    const start = () => { if (!running && inView && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } };
    const stop  = () => { running = false; cancelAnimationFrame(raf); };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => entries.forEach(en => {
        inView = en.isIntersecting;
        inView ? start() : stop();
      })).observe(svg);
    }
    start();
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  })();
})();
