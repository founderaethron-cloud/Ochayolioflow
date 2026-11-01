// Water reflection: SMIL ripple and glints run only while the tagline card is on screen.
export function initWater() {
  const water = document.querySelector('[data-water]');
  const defs = document.querySelector('.water__defs');
  if (!water || !defs || !('IntersectionObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { defs.pauseAnimations?.(); return; }
  defs.pauseAnimations?.();
  new IntersectionObserver(([entry]) => {
    water.classList.toggle('is-live', entry.isIntersecting);
    if (entry.isIntersecting) defs.unpauseAnimations?.(); else defs.pauseAnimations?.();
  }, { threshold: 0.15 }).observe(water);
}
