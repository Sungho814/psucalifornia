// ── Smooth scroll ──────────────────────────────────────────────
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ── Card entrance animation ────────────────────────────────────
function animateCards() {
  const wh = window.innerHeight;
  document.querySelectorAll('.card').forEach(card => {
    if (card.getBoundingClientRect().top < wh - 50) {
      card.classList.add('visible');
    }
  });
}

// ── Footer year ────────────────────────────────────────────────
function updateYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Publications: filter + search ─────────────────────────────
(function initPublications() {
  const searchInput  = document.getElementById('pub-search');
  const filterBtns   = document.querySelectorAll('.pub-filter');
  const items        = document.querySelectorAll('.pub-item');
  const yearGroups   = document.querySelectorAll('.pub-year-group');
  const emptyMsg     = document.getElementById('pub-empty');

  let activeFilter = 'all';
  let searchQuery  = '';

  function applyFilters() {
    items.forEach(item => {
      const journal   = item.dataset.journal || '';
      const title     = item.querySelector('.pub-title')?.textContent.toLowerCase() || '';
      const matchFilter = activeFilter === 'all' || journal === activeFilter;
      const matchSearch = title.includes(searchQuery);
      item.classList.toggle('hidden', !(matchFilter && matchSearch));
    });

    // Hide year-group headers if all their items are hidden
    yearGroups.forEach(group => {
      const visible = [...group.querySelectorAll('.pub-item')].some(i => !i.classList.contains('hidden'));
      group.style.display = visible ? '' : 'none';
    });

    // Empty state
    const anyVisible = [...items].some(i => !i.classList.contains('hidden'));
    if (emptyMsg) emptyMsg.style.display = anyVisible ? 'none' : '';
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }
})();

// ── Org chart: toggle / expand / collapse / search ────────────
(function initOrgChart() {
  document.querySelectorAll('#members .toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const list      = document.getElementById(btn.getAttribute('aria-controls'));
      const collapsed = list.classList.toggle('collapsed');
      btn.textContent = btn.textContent.replace(/[▾▸]/, '') + (collapsed ? ' ▸' : ' ▾');
    });
  });

  const expandAll  = document.getElementById('expand-all');
  const collapseAll = document.getElementById('collapse-all');
  if (expandAll)   expandAll.onclick  = () => document.querySelectorAll('#members .members-list').forEach(l => l.classList.remove('collapsed'));
  if (collapseAll) collapseAll.onclick = () => document.querySelectorAll('#members .members-list').forEach(l => l.classList.add('collapsed'));

  const orgSearch = document.getElementById('org-search');
  if (orgSearch) {
    orgSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#members .members-list li').forEach(m => {
        m.style.display = m.textContent.toLowerCase().includes(q) ? '' : 'none';
        if (q) m.closest('.members-list').classList.remove('collapsed');
      });
    });
  }
})();

// ── Nav & button smooth scroll ─────────────────────────────────
document.querySelectorAll('.main-nav a, .btn').forEach(link => {
  link.addEventListener('click', event => {
    const target = link.getAttribute('href');
    if (target && target.startsWith('#')) {
      event.preventDefault();
      scrollToSection(target.substring(1));
    }
  });
});

// ── Init ───────────────────────────────────────────────────────
window.addEventListener('load',   () => { animateCards(); updateYear(); });
window.addEventListener('scroll', animateCards);