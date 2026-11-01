// Build-time page rendering: shared templates + content/site.json -> final HTML.
//
// Page markers (in src/**/*.html):
//   <!--@page title="..." description="..." path="/x/" robots="index, follow"-->
//   <!--@include head-->            inserts templates/head.html
//   <!--@render releases-->         generated from content/site.json
// Template variables: {{site.url}}, {{page.title}} ... (HTML-escaped).
import { readFile } from 'node:fs/promises';

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function loadContent() {
  return JSON.parse(await readFile('content/site.json', 'utf8'));
}

const STREAMING = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  appleMusic: 'Apple Music'
};
const SOCIAL = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  instagram: 'Instagram',
  appleMusic: 'Apple Music',
  x: 'X'
};

const generators = {
  nav: (c) =>
    c.nav
      .map((item) => `          <a href="${esc(item.href)}"${item.section ? ` data-section="${esc(item.section)}"` : ''}>${esc(item.label)}</a>`)
      .join('\n'),

  social: (c) =>
    Object.entries(SOCIAL)
      .filter(([key]) => c.links[key])
      .map(([key, label]) => `          <a class="mono" href="${esc(c.links[key])}" rel="noopener" target="_blank">${label}</a>`)
      .join('\n'),

  releases: (c) =>
    c.releases
      .map((r, i) => {
        const links = Object.entries(STREAMING)
          .filter(([key]) => r.links?.[key])
          .map(([key, label]) => `<a class="release-card__link mono" href="${esc(r.links[key])}" rel="noopener" target="_blank">${label} <span aria-hidden="true">↗</span></a>`)
          .join('');
        const meta = links ? `${esc(r.artist)}` : `${esc(r.artist)} · listening link to be added`;
        return `          <article class="release-card" data-reveal id="release-${esc(r.id)}">
            <span class="release-card__index mono">${String(i + 1).padStart(2, '0')}</span>
            <h3 class="release-card__title">${esc(r.title)}</h3>
            <p class="release-card__artist mono">${meta}</p>
            <button class="release-card__button" type="button" aria-expanded="false" aria-label="Show note for ${esc(r.title)}">↗</button>
            <div class="release-card__details"><p>${esc(r.note)}</p>${links ? `<p class="release-card__links">${links}</p>` : ''}</div>
          </article>`;
      })
      .join('\n'),

  events: (c) => {
    const rows = c.events.length
      ? c.events
          .map((e, i) => {
            const meta = esc([e.date, e.venue, e.city].filter(Boolean).join(' · '));
            const action = e.ticketUrl
              ? `<a class="event-row__action mono" href="${esc(e.ticketUrl)}" rel="noopener" target="_blank">Tickets <span aria-hidden="true">↗</span></a>`
              : `<a class="event-row__action mono" href="/?topic=booking&amp;message=${encodeURIComponent(`Question about: ${e.title}`)}#connect">Ask about this</a>`;
            return `          <div class="event-row" data-reveal>
            <span class="event-row__number mono">${String(i + 1).padStart(3, '0')}</span>
            <h3>${esc(e.title)}</h3>
            <p class="mono">${meta}</p>
            ${action}
          </div>`;
          })
          .join('\n')
      : `          <div class="event-row event-row--empty" data-reveal>
            <span class="event-row__number mono">---</span>
            <h3>No dates yet.</h3>
            <p class="mono">Announcements coming soon</p>
          </div>`;
    const b = c.booking;
    const options = b.options
      .map((o) => {
        const href = `/?topic=booking&amp;message=${encodeURIComponent(o.prefill)}#connect`;
        return `            <a class="booking__option" href="${href}"><span class="booking__label">${esc(o.label)}</span><span class="booking__detail mono">${esc(o.detail)}</span><span class="booking__go mono" aria-hidden="true">Enquire ↗</span></a>`;
      })
      .join('\n');
    return `      <section class="events section" id="events" data-scene="Events" aria-labelledby="events-title">
        <div class="shell">
          <div class="section-bar"><h2 id="events-title" data-reveal="split">Events</h2><span class="section-number mono">04</span></div>
${rows}
          <div class="booking" id="book" data-reveal>
            <h3 class="booking__heading" data-reveal="split">${esc(b.heading)}</h3>
            <p class="booking__intro serif">${esc(b.intro)}</p>
            <div class="booking__grid">
${options}
            </div>
          </div>
        </div>
      </section>`;
  },

  'topics': (c) =>
    c.contactTopics.map((t) => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join('')
};

function get(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function parsePage(html) {
  const match = html.match(/<!--@page\s+([\s\S]*?)-->/);
  const page = { robots: 'index, follow', path: '/' };
  if (!match) return { html, page, hasPage: false };
  for (const [, key, value] of match[1].matchAll(/(\w+)="([^"]*)"/g)) page[key] = value;
  return { html: html.replace(match[0], '').replace(/^\s*\n/, ''), page, hasPage: true };
}

export async function renderHtml(source, content, templates) {
  const { html: body, page, hasPage } = parsePage(source);
  if (!hasPage && !/<!--@(include|render)/.test(body)) return source;

  let out = body.replace(/<!--@include\s+([\w-]+)\s*-->/g, (_, name) => {
    if (!(name in templates)) throw new Error(`Unknown include "${name}"`);
    return templates[name].replace(/\n$/, '');
  });
  out = out.replace(/<!--@render\s+([\w-]+)\s*-->/g, (_, name) => {
    if (!(name in generators)) throw new Error(`Unknown render block "${name}"`);
    return generators[name](content);
  });
  // Generators may emit nothing (e.g. no events): drop the blank line they leave.
  out = out.replace(/\n[ \t]*\n(?=[ \t]*\n)/g, '\n');
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = get({ site: content.site, auditions: content.auditions, page }, key);
    if (value == null) throw new Error(`Template variable {{${key}}} is not defined (page: ${page.path})`);
    return esc(value);
  });
  return out;
}

export async function loadTemplates() {
  const names = ['head', 'header', 'footer'];
  const entries = await Promise.all(names.map(async (n) => [n, await readFile(`templates/${n}.html`, 'utf8')]));
  return Object.fromEntries(entries);
}
