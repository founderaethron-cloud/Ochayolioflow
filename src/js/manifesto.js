// STREET sequence: scroll-scrubbed, no libraries. One rAF-throttled scroll handler writes
// a few custom properties; all motion is transform/opacity driven from CSS.
// Without JS (or with reduced motion) the CSS defaults show the finished state.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const outBack = (t, c = 0.9) => { const x = t - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const outCubic = (t) => 1 - (1 - t) ** 3;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function initManifesto() {
  const section = document.querySelector('[data-manifesto]');
  if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const heading = section.querySelector('h2');
  const copy = section.querySelector('[data-mf-copy]');
  const orbit = section.querySelector('.mf-orbit');
  const dot = section.querySelector('.mf-dot');
  const band = document.querySelector('[data-mf-reveal]');
  section.querySelectorAll('.ml').forEach((el, i) => el.style.setProperty('--n', String(i)));

  const set = (el, name, value) => el.style.setProperty(name, typeof value === 'number' ? value.toFixed(4) : value);
  let queued = false;

  function update() {
    queued = false;
    const vh = window.innerHeight;
    const sr = section.getBoundingClientRect();
    if (sr.bottom > -vh * 0.2 && sr.top < vh * 1.2) {
      const ph = clamp((vh * 0.92 - heading.getBoundingClientRect().top) / (vh * 0.62));
      set(section, '--l1', outBack(seg(ph, 0, 0.28)));
      set(section, '--l2', outBack(seg(ph, 0.14, 0.42)));
      set(section, '--l3', outBack(seg(ph, 0.28, 0.56)));
      set(section, '--st', outBack(seg(ph, 0.5, 1), 0.8));
      const bell = Math.sin(Math.PI * seg(ph, 0.5, 1));
      set(section, '--tint', bell * bell * 0.9);
      const pc = clamp((vh * 0.92 - copy.getBoundingClientRect().top) / (vh * 0.5));
      set(section, '--pc', outCubic(pc));
      const y = window.scrollY;
      set(orbit, '--ra', `${(y * 0.06).toFixed(2)}deg`);
      set(orbit, '--rb', `${(-y * 0.045).toFixed(2)}deg`);
      set(orbit, '--rc', `${(y * 0.03 + 30).toFixed(2)}deg`);
      const t = y * 0.004 + 0.6;
      dot.setAttribute('cx', (100 * Math.cos(t)).toFixed(2));
      dot.setAttribute('cy', (50 * Math.sin(t)).toFixed(2));
    }
    if (band) {
      const br = band.getBoundingClientRect();
      if (br.bottom > 0 && br.top < vh) set(band, '--rv', inOut(clamp((vh - br.top) / (vh * 0.75))));
    }
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}
