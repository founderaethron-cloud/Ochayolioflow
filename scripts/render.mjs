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

// Ochayoli-themed vinyl placeholder (original artwork: ink disc, grooves, rust label with the slash).
const vinyl = (id, n) => `<svg viewBox="0 0 120 120" role="presentation" focusable="false" aria-hidden="true">
              <defs><clipPath id="lab-${esc(id)}"><circle cx="60" cy="60" r="22" /></clipPath></defs>
              <circle cx="60" cy="60" r="58" fill="#0b0b0a" stroke="#2c2a26" stroke-width="1" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#eee7d9" stroke-opacity=".12" />
              <circle cx="60" cy="60" r="47" fill="none" stroke="#eee7d9" stroke-opacity=".08" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#eee7d9" stroke-opacity=".12" />
              <circle cx="60" cy="60" r="37" fill="none" stroke="#eee7d9" stroke-opacity=".08" />
              <circle cx="60" cy="60" r="31" fill="none" stroke="#eee7d9" stroke-opacity=".1" />
              <path d="M60 6 A54 54 0 0 1 110 40" fill="none" stroke="#d8ff3f" stroke-width="1.4" stroke-linecap="round" />
              <path d="M60 60 L112 38 A58 58 0 0 0 98 18 Z" fill="#eee7d9" fill-opacity=".05" />
              <circle cx="60" cy="60" r="22" fill="#c94a32" />
              <g clip-path="url(#lab-${esc(id)})"><rect x="54" y="30" width="9" height="60" fill="#0b0b0a" transform="rotate(28 60 60)" /></g>
              <text class="disc__num" x="60" y="108" text-anchor="middle">${String(n).padStart(2, '0')}</text>
              <circle cx="60" cy="60" r="2.4" fill="#eee7d9" />
            </svg>`;

// THE UNDERCURRENT: deterministic abstract contour lines (organic closed curves), no external assets.
const f = (n) => Math.round(n * 10) / 10;
function blob(cx, cy, rx, ry, amp, pts = 10) {
  const ph = [1.3, 4.1, 2.2];
  const P = [];
  for (let i = 0; i < pts; i++) {
    const t = (i / pts) * Math.PI * 2;
    const k = 1 + amp * (Math.sin(2 * t + ph[0]) * 0.6 + Math.sin(3 * t + ph[1]) * 0.4 + Math.sin(5 * t + ph[2]) * 0.2);
    P.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < pts; i++) {
    const p0 = P[(i - 1 + pts) % pts], p1 = P[i], p2 = P[(i + 1) % pts], p3 = P[(i + 2) % pts];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

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
            <span class="release-card__disc">${vinyl(r.id, i + 1)}</span>
            <h3 class="release-card__title">${esc(r.title)}</h3>
            <p class="release-card__artist mono">${meta}</p>
            <button class="release-card__button" type="button" aria-expanded="false" aria-label="Show note for ${esc(r.title)}">↗</button>
            <div class="release-card__details"><p>${esc(r.note)}</p>${links ? `<p class="release-card__links">${links}</p>` : ''}</div>
          </article>`;
      })
      .join('\n'),

  'footer-field': () => {
    const rings = Array.from({ length: 8 }, (_, i) => `<path class="fc-ring fc-r${i + 1}" d="${blob(0, 0, 46 + i * 52, 22 + i * 24, 0.05 + i * 0.012)}" />`).join('\n          ');
    return `<svg class="fc-svg" viewBox="-500 -200 1000 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs><clipPath id="fc-clip"><circle r="30" /></clipPath></defs>
          ${rings}
          <g class="fc-mark"><circle r="30" fill="#c94a32" /><g clip-path="url(#fc-clip)"><rect x="-5" y="-44" width="10" height="88" fill="#0b0b0a" transform="rotate(28)" /></g></g>
        </svg>`;
  },

  events: (c) => {
    const rows = c.events.length
      ? c.events
          .map((e, i) => {
            const meta = esc([e.date || e.dateLabel, e.venue, e.city].filter(Boolean).join(' · '));
            const badge = e.status === 'soon' ? '<span class="event-row__badge">Coming soon</span>' : '';
            const action = e.ticketUrl
              ? `<a class="event-row__action mono" href="${esc(e.ticketUrl)}" rel="noopener" target="_blank">Tickets <span aria-hidden="true">↗</span></a>`
              : `<a class="event-row__action mono" href="/?topic=${e.status === 'soon' ? 'other' : 'booking'}&amp;message=${encodeURIComponent(e.status === 'soon' ? `Keep me posted about: ${e.title}` : `Question about: ${e.title}`)}#connect">${e.status === 'soon' ? 'Get updates' : 'Ask about this'}</a>`;
            return `          <div class="event-row${e.status === 'soon' ? ' event-row--soon' : ''}" data-reveal>
            <span class="event-row__number mono">${String(i + 1).padStart(3, '0')}</span>
            <h3>${esc(e.title)}</h3>
            <p class="mono">${badge}${meta}</p>
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
    const f = b.formats;
    const formats = f
      ? `            <h4 class="booking__sub mono">${esc(f.heading)}</h4>
            <div class="booking__grid booking__grid--formats">
${f.options.map((o) => `              <a class="booking__option booking__option--format" href="/?topic=booking&amp;message=${encodeURIComponent(o.prefill)}#connect"><span class="booking__label">${esc(o.label)}</span><span class="booking__tag serif">${esc(o.detail)}</span><span class="booking__go mono" aria-hidden="true">Enquire ↗</span></a>`).join('\n')}
            </div>
${options ? '            <h4 class="booking__sub mono">Or tell us the occasion</h4>' : ''}`
      : '';
    const contours = Array.from({ length: 7 }, (_, i) => `<path pathLength="1" d="${blob(720, 300, 70 + i * 62, 40 + i * 38, 0.06 + i * 0.015)}" />`).join('');
    return `      <section class="events section" id="events" data-scene="Events" data-events aria-labelledby="events-title">
        <svg class="ev-contours" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${contours}</svg>
        <div class="shell">
          <div class="section-bar"><h2 id="events-title" data-reveal="split">Events</h2><span class="section-number mono">04</span></div>
${rows}
          <div class="booking" id="book" data-reveal>
            <h3 class="booking__heading" data-reveal="split">${esc(b.heading)}</h3>
            <p class="booking__intro serif">${esc(b.intro)}</p>
${formats}${options ? `
            <div class="booking__grid">
${options}
            </div>` : ''}
          </div>
        </div>
      </section>`;
  },

  workshops: (c) => {
    const w = c.workshops;
    if (!w) return '';
    return `      <section class="workshops section section--paper" id="workshops" data-scene="Workshops" aria-labelledby="workshops-title">
        <div class="shell">
          <div class="section-bar"><h2 id="workshops-title" data-reveal="split">${esc(w.heading)}</h2><span class="section-number mono">05</span></div>
          <div class="workshops__card" data-reveal>
            <span class="workshops__badge mono">${esc(w.status)}</span>
            <p class="workshops__intro serif">${esc(w.intro)}</p>
            <a class="workshops__cta mono" href="/?topic=workshops&amp;message=${encodeURIComponent(w.prefill)}#connect">Register your interest <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>`;
  },

  artists: (c) => {
    if (!c.artists?.length) return '';
    const items = c.artists
      .map((a) => `            <li><a class="artist-link" href="${esc(a.spotify)}" rel="noopener" target="_blank"><span class="artist-link__name">${esc(a.name)}</span><span class="artist-link__go mono">Spotify <span aria-hidden="true">↗</span></span></a></li>`)
      .join('\n');
    const frames = c.artists
      .map((a) => `            <li class="artist-frame" data-tilt><span class="artist-frame__layer artist-frame__layer--3"></span><span class="artist-frame__layer artist-frame__layer--2"></span><span class="artist-frame__front"><span class="artist-frame__note mono">Portrait to be added</span><span class="artist-frame__name">${esc(a.name)}</span></span></li>`)
      .join('\n');
    return `          <ul class="artist-frames" aria-hidden="true">
${frames}
          </ul>
          <ul class="artist-links" aria-label="O'Flow artists on Spotify">
${items}
          </ul>`;
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
