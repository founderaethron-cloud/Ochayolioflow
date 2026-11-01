// THE BLACKOUT: one scroll-driven sequence on the hero.
// Scroll position through a tall sticky track becomes a single number (--bo, 0 to 1).
// All motion is CSS reading that number (transform and opacity only).
// Phases: signal 0-20%, breakdown 20-50%, blackout 50-60%, drop 60-80%, fly-through 80-100%.
const PHASES = [
  [0.2, 'SIGNAL'],
  [0.5, 'BREAKDOWN'],
  [0.6, 'BLACKOUT'],
  [0.8, 'THE DROP'],
  [1.01, 'FLY-THROUGH']
];

export function initBlackout() {
  const track = document.querySelector('[data-blackout]');
  if (!track) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  let phase = null;
  let slow = 0;
  let last = 0;

  const emit = (label) => {
    if (label === phase) return;
    phase = label;
    document.dispatchEvent(new CustomEvent('ochayoli:phase', { detail: { label } }));
  };

  const update = (now) => {
    ticking = false;
    const span = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top;
    const p = span > 0 ? Math.min(1, Math.max(0, -top / span)) : 0;
    track.style.setProperty('--bo', p.toFixed(4));
    track.classList.toggle('is-split', p > 0.2 && p < 0.55);
    track.classList.toggle('is-live', p > 0 && p < 0.5);

    // Show phase names in the HUD only while the sequence is on screen.
    if (p > 0 && p < 1) emit(PHASES.find(([end]) => p < end)[1]);
    else emit(null);

    // Low-power guard: if scroll frames are consistently slow, drop the split/glitch layer.
    if (last && now - last > 45) slow += 1;
    else slow = Math.max(0, slow - 1);
    if (slow > 12) track.classList.add('is-lite');
    last = now;
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  request();
}
