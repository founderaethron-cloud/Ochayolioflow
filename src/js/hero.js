// Hero behaviour: let visitors skip the intro, and drive the slow parallax
// push on the hero artwork from scroll position (one CSS variable, rAF-throttled).
export function initHero() {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Skip the intro on first input during the first few seconds.
  if (!root.classList.contains('skip-intro')) {
    const skip = () => {
      root.classList.add('skip-intro');
      cleanup();
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, skip));
    events.forEach((e) => window.addEventListener(e, skip, { passive: true, once: true }));
    window.setTimeout(cleanup, 4500);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const p = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
    hero.style.setProperty('--hero-p', p.toFixed(3));
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true }
  );
}
