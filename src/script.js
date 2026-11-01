// Entry point. Each module is a small, independent behaviour; add new ones here.
// Bundled and hashed by scripts/build.mjs (no framework, no inline code).
import { initNav } from './js/nav.js';
import { initReleases } from './js/releases.js';
import { initContactForm } from './js/contact-form.js';
import { initReveal } from './js/reveal.js';
import { initHero } from './js/hero.js';
import { initHud } from './js/hud.js';
import { initBlackout } from './js/blackout.js';
import { initWater } from './js/water.js';

initNav();
initReleases();
initContactForm();
initReveal();
initHero();
initHud();
initBlackout();
initWater();
