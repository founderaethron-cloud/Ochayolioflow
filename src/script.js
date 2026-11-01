// Entry point. Each module is a small, independent behaviour; add new ones here.
// Bundled and hashed by scripts/build.mjs (no framework, no inline code).
import { initNav } from './js/nav.js';
import { initReleases } from './js/releases.js';
import { initContactForm } from './js/contact-form.js';
import { initReveal } from './js/reveal.js';

initNav();
initReleases();
initContactForm();
initReveal();
