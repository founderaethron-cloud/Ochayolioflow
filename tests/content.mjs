// Validates content/site.json and the render step. This is the guard against
// invented or malformed content: links must be https on known hosts, ids unique.
import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import { loadContent, loadTemplates, renderHtml } from '../scripts/render.mjs';

const content = await loadContent();
const HOSTS = {
  spotify: ['open.spotify.com'],
  youtube: ['www.youtube.com', 'youtube.com', 'music.youtube.com', 'youtu.be'],
  instagram: ['www.instagram.com', 'instagram.com'],
  appleMusic: ['music.apple.com'],
  x: ['x.com', 'twitter.com']
};

function checkUrl(kind, url, where) {
  if (!url) return;
  const parsed = new URL(url); // throws on malformed input
  assert.equal(parsed.protocol, 'https:', `${where}: ${kind} link must be https`);
  assert.ok(HOSTS[kind].includes(parsed.hostname), `${where}: ${parsed.hostname} is not a known ${kind} host`);
}

for (const [kind, url] of Object.entries(content.links)) checkUrl(kind, url, 'links');

for (const artist of content.artists || []) {
  assert.ok(artist.name, 'artist needs a name');
  if (!artist.spotify) continue; // link may be pending
  const u = new URL(artist.spotify);
  assert.equal(u.hostname, 'open.spotify.com', `${artist.name}: not a Spotify link`);
  assert.match(u.pathname, /^\/artist\/[A-Za-z0-9]{22}$/, `${artist.name}: not a Spotify artist URL`);
}

const ids = new Set();
for (const release of content.releases) {
  assert.ok(release.id && release.title && release.artist, 'release needs id, title, artist');
  assert.ok(!ids.has(release.id), `duplicate release id: ${release.id}`);
  ids.add(release.id);
  for (const [kind, url] of Object.entries(release.links || {})) checkUrl(kind, url, `release ${release.id}`);
}
for (const event of content.events) {
  assert.ok(event.title && (event.date || event.dateLabel), 'event needs title and a date or date label');
  if (event.ticketUrl) assert.equal(new URL(event.ticketUrl).protocol, 'https:', 'ticket link must be https');
}
assert.ok(content.booking.formats.options.length === 3, 'three booking formats required');
for (const o of [...content.booking.formats.options, ...content.booking.options]) assert.ok(o.id && o.label && o.prefill, 'booking option needs id, label, prefill');
for (const item of content.nav) assert.ok(item.label && item.href, 'nav item needs label and href');
assert.ok(content.contactTopics.length > 0, 'contact topics required');

// Render check: the home page must come out fully resolved.
const templates = await loadTemplates();
const home = await renderHtml(await readFile('src/index.html', 'utf8'), content, templates);
assert.doesNotMatch(home, /<!--@|\{\{/, 'unrendered marker left in index.html');
assert.match(home, /THUVVAK/);
assert.match(home, /release-card__disc/);
assert.match(home, /data-blackout/);
assert.match(home, /class="artist-link"[^>]*href="https:\/\/open\.spotify\.com\/artist\//);
assert.match(home, /<option value="booking">/);
assert.match(home, /Jarvie G/);
assert.match(home, /id="events"/);
assert.match(home, /Backwater Blackout/);
assert.match(home, /Date to be announced/);
assert.match(home, /Coming soon/);
assert.match(home, /id="workshops"/);
assert.match(home, /Ochayoli Underground/);
assert.doesNotMatch(home, /Club or live show|Festival enquiry|booking__grid"/);
assert.match(home, /Brings the movement to a larger audience/);
assert.match(home, /<option value="workshops">/);
const empty = structuredClone(content);
empty.events = [];
assert.match(await renderHtml(await readFile('src/index.html', 'utf8'), empty, templates), /No dates yet/, 'empty state shows with no events');
assert.match(home, /topic=booking&amp;message=Ochayoli%20Underground%20enquiry/, 'booking options link to the prefilled form');
assert.match(home, /data-section="events"/);

const withEvent = structuredClone(content);
withEvent.events = [{ title: 'Test night', date: '2027-01-10', city: 'Kochi', ticketUrl: 'https://example.com/t' }];
const evHtml = await renderHtml(await readFile('src/index.html', 'utf8'), withEvent, templates);
assert.match(evHtml, /Test night/);
assert.match(evHtml, /event-row__action[^>]*href="https:\/\/example\.com\/t"/);
assert.doesNotMatch(evHtml, /No dates yet/);
assert.doesNotMatch(evHtml, /Backwater Blackout/);

// Links appear only when a real URL exists.
const withLink = structuredClone(content);
withLink.releases[0].links.spotify = 'https://open.spotify.com/track/example';
const linked = await renderHtml(await readFile('src/index.html', 'utf8'), withLink, templates);
assert.match(linked, /release-card__link[^>]*href="https:\/\/open\.spotify\.com\/track\/example"/);

console.log(`Content test passed: ${content.releases.length} releases, ${content.nav.length} nav items.`);
