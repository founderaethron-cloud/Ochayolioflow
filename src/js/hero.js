// Hero behaviour: let visitors skip the intro with the first input.
// (Scroll-linked motion lives in blackout.js.)
export function initHero() {
  const root = document.documentElement;

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
}
