// Viewfinder HUD: running timecode and the name of the scene on screen.
// Decorative only (aria-hidden); scenes come from [data-scene] attributes.
export function initHud() {
  const hud = document.querySelector('[data-hud]');
  if (!hud) return;
  const time = hud.querySelector('[data-hud-time]');
  const scene = hud.querySelector('[data-hud-scene]');
  const started = Date.now();
  const pad = (n) => String(n).padStart(2, '0');

  const tick = () => {
    const s = Math.floor((Date.now() - started) / 1000);
    time.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  };
  tick();
  window.setInterval(() => {
    if (!document.hidden) tick();
  }, 1000);

  const sections = [...document.querySelectorAll('[data-scene]')];
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const total = sections.length;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = sections.indexOf(entry.target) + 1;
        scene.textContent = `SCENE ${index}/${total} · ${entry.target.dataset.scene}`;
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((el) => observer.observe(el));
}
