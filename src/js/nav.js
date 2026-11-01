// Mobile menu (toggle, Escape, close on navigate) and scroll-spy for in-page links.
export function initNav() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;
  const label = toggle.querySelector('.menu-toggle__label');

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Menu';
  };

  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Scroll-spy: mark the nav link whose section is currently in view.
  const links = [...menu.querySelectorAll('a[data-section]')];
  const targets = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of links) {
          const current = a.dataset.section === entry.target.id;
          a.classList.toggle('is-current', current);
          if (current) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  targets.forEach((el) => spy.observe(el));
}
