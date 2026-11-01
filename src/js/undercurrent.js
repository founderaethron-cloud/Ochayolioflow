// THE UNDERCURRENT: a quiet secondary layer. Pointer depth (tilt, hidden layers) and two
// scroll-drawn contour effects. Everything is transform/opacity/stroke; reduced motion keeps the
// finished static state and touch devices skip the pointer effects.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const TILT = '[data-tilt], .store-product-card__visual, .artist-frame';
const LAYER = '.booking__option, .release-card, .event-row';

export function initUndercurrent() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let frame = 0;
    let last = null;
    const apply = () => {
      frame = 0;
      const { target, x, y } = last;
      const tilt = target.closest(TILT);
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = clamp((x - r.left) / r.width) - 0.5;
        const py = clamp((y - r.top) / r.height) - 0.5;
        tilt.style.setProperty('--px', px.toFixed(3));
        tilt.style.setProperty('--py', py.toFixed(3));
        tilt.style.setProperty('--rx', (-py * 9).toFixed(2));
        tilt.style.setProperty('--ry', (px * 11).toFixed(2));
      }
      const layer = target.closest(LAYER);
      if (layer) {
        const r = layer.getBoundingClientRect();
        layer.style.setProperty('--mx', `${(x - r.left).toFixed(0)}px`);
        layer.style.setProperty('--my', `${(y - r.top).toFixed(0)}px`);
      }
    };
    document.addEventListener('pointermove', (e) => {
      if (!(e.target instanceof Element)) return;
      last = { target: e.target, x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const el = e.target instanceof Element ? e.target.closest(TILT) : null;
      if (el && !el.contains(e.relatedTarget)) ['--px', '--py', '--rx', '--ry'].forEach((n) => el.style.removeProperty(n));
    }, { passive: true });
  }

  // Scroll-controlled contour drawing (events) and convergence (footer).
  const events = document.querySelector('[data-events]');
  const footer = document.querySelector('[data-footer]');
  if (!events && !footer) return;
  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    if (events) {
      const r = events.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) events.style.setProperty('--ev', clamp((vh * 0.85 - r.top) / (vh * 0.9)).toFixed(3));
    }
    if (footer) {
      const r = footer.getBoundingClientRect();
      if (r.top < vh) footer.style.setProperty('--fc', clamp((vh - r.top) / (r.height * 0.85)).toFixed(3));
    }
  };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}
