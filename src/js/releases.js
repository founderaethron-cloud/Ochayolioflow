// Release rows are rendered into the HTML at build time (content/site.json).
// This only adds the open/close behaviour for each row's note.
export function initReleases() {
  const list = document.querySelector('[data-release-list]');
  if (!list) return;
  list.addEventListener('click', (event) => {
    const button = event.target.closest('.release-card__button');
    if (!button) return;
    const card = button.closest('.release-card');
    const open = card.classList.toggle('is-open');
    const title = card.querySelector('.release-card__title').textContent;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} note for ${title}`);
    button.textContent = open ? '−' : '↗';
  });
}
