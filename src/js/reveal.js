// Scroll reveals. Elements marked [data-reveal] animate in once:
//   data-reveal           soft fade and rise
//   data-reveal="cut"     hard cut with a slow push-in (title-card feel)
//   data-reveal="split"   headline words rise out of a mask, staggered
// Nothing is hidden unless this runs, and reduced-motion users see everything at once.

// Wrap every word of an element (keeping <em>, <br> and other inline tags) in a
// masked span. The heading keeps its full text for screen readers.
function splitWords(element) {
  const label = element.textContent.replace(/\s+/g, ' ').trim();
  element.setAttribute('aria-label', label);
  let index = 0;
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(' '));
            continue;
          }
          const outer = document.createElement('span');
          outer.className = 'w';
          outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.className = 'w__i';
          inner.style.setProperty('--i', String(index++));
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    }
  };
  walk(element);
}

export function initReveal() {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!items.length) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) return;

  // Anything already on screen stays visible (no flash), then arm the rest.
  const vh = window.innerHeight;
  const below = items.filter((el) => el.getBoundingClientRect().top > vh * 0.9);
  below.filter((el) => el.dataset.reveal === 'split').forEach(splitWords);
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15 }
  );
  below.forEach((el) => {
    el.setAttribute('data-reveal-armed', '');
    observer.observe(el);
  });
}
