// Scroll reveal foundation for the motion phase. Elements marked [data-reveal]
// fade in once. Nothing is hidden unless JS runs, and reduced-motion users see
// everything immediately.
export function initReveal() {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!items.length) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) return;

  // Anything already on screen stays visible (no flash), then arm the rest.
  const vh = window.innerHeight;
  const below = items.filter((el) => el.getBoundingClientRect().top > vh * 0.9);
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12 }
  );
  below.forEach((el) => {
    el.setAttribute('data-reveal-armed', '');
    observer.observe(el);
  });
}
