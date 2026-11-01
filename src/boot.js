// Runs before first paint (tiny, blocking, in <head>). Decides whether the
// cinematic intro plays: once per browser session, never for reduced motion.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('skip-intro');
    else if (window.sessionStorage.getItem('ochayoli-intro')) root.classList.add('skip-intro');
    else window.sessionStorage.setItem('ochayoli-intro', '1');
  } catch (e) {
    /* storage blocked: play the intro every time */
  }
})();
