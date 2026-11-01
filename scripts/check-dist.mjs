// Integrity check for dist/. This is the guard against shipping a broken tree
// (the previous committed dist/ was missing script.js, assets/ and contact.php).
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'dist';
const errors = [];
const fail = (message) => errors.push(message);
const exists = (file) => access(file).then(() => true, () => false);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const files = await walk(OUT);
const rel = (file) => path.relative(OUT, file).split(path.sep).join('/');

// 1. Things that must never be deployed.
const forbidden = [/^tests\//, /^scripts\//, /^node_modules\//, /^package(-lock)?\.json$/, /^\.env/, /^README/, /^config\//, /qikink-config\.php$/, /\.png$/ && /ochayoli-hero-abstract/];
for (const file of files.map(rel)) {
  if (forbidden.some((pattern) => pattern.test(file))) fail(`dist contains a file that must not be deployed: ${file}`);
}

// 2. Every local reference in HTML and CSS must resolve to a file in dist.
function localTarget(from, ref) {
  if (!ref || /^(https?:|mailto:|tel:|data:|#|%23|javascript:)/i.test(ref)) return null;
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  return clean.startsWith('/') ? path.join(OUT, clean) : path.join(path.dirname(from), clean);
}

async function target(from, ref) {
  const file = localTarget(from, ref);
  if (!file) return;
  const asDir = file.endsWith('/') || !path.extname(file);
  const candidates = asDir ? [path.join(file, 'index.html'), file] : [file];
  for (const candidate of candidates) if (await exists(candidate)) return;
  fail(`${rel(from)} references a missing file: ${ref}`);
}

for (const file of files.filter((f) => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/\s(?:href|src|action)="([^"]*)"/g)) await target(file, match[1]);
  for (const match of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const part of match[1].split(',')) await target(file, part.trim().split(/\s+/)[0]);
  }
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html)) fail(`${rel(file)} still loads Google Fonts`);
  if (/<script(?![^>]*\btype="application\/ld\+json")(?![^>]*\bsrc=)[^>]*>/.test(html)) fail(`${rel(file)} has an inline script, which the Content-Security-Policy blocks`);
  if (/<!--@|\{\{\s*[\w.]+\s*\}\}/.test(html)) fail(`${rel(file)} has an unrendered template marker`);
  if (/\sstyle="/.test(html)) fail(`${rel(file)} has an inline style attribute, which the Content-Security-Policy blocks`);
}

for (const file of files.filter((f) => f.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) await target(file, match[1]);
  if (/@import/.test(css)) fail(`${rel(file)} contains @import`);
}

// 3. Hashed assets present, commerce pages not indexable, deploy essentials there.
const names = files.map(rel);
for (const pattern of [/^styles\.[0-9a-f]{10}\.css$/, /^script\.[0-9a-f]{10}\.js$/, /^store\.[0-9a-f]{10}\.js$/, /^boot\.[0-9a-f]{10}\.js$/]) {
  if (!names.some((name) => pattern.test(name))) fail(`missing hashed asset matching ${pattern}`);
}
for (const required of ['index.html', '404.html', '.htaccess', 'contact.php', 'robots.txt', 'sitemap.xml', 'og-poster.png', 'favicon.svg', 'lib/.htaccess']) {
  if (!names.includes(required)) fail(`missing required file: ${required}`);
}
for (const page of ['cart/index.html', 'checkout/index.html', 'order-confirmation/index.html']) {
  const html = await readFile(path.join(OUT, page), 'utf8');
  if (!/name="robots" content="noindex/.test(html)) fail(`${page} must be noindex`);
}
const sitemap = await readFile(path.join(OUT, 'sitemap.xml'), 'utf8');
for (const page of names.filter((n) => n.endsWith('index.html') || n === '404.html')) {
  const html = await readFile(path.join(OUT, page), 'utf8');
  const noindex = /name="robots" content="noindex/.test(html);
  const url = page === 'index.html' ? '/' : '/' + page.replace(/index\.html$/, '');
  if (noindex && sitemap.includes(`<loc>https://ochayoli.in${url}</loc>`)) fail(`sitemap.xml lists a noindex page: ${url}`);
}

if (errors.length) {
  console.error(`dist check FAILED (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`dist check passed: ${names.length} files, all references resolve.`);
