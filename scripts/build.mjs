// Builds src/ into dist/, the exact tree that is deployed to Hostinger.
//   - copies everything in src/ except the sources that are transformed below
//   - minifies CSS and JS and gives them content-hashed filenames
//   - converts the hero image to AVIF and WebP in two widths
//   - rewrites asset references in every HTML file to the hashed names
import { cp, mkdir, rm, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { transform, build as bundle } from 'esbuild';
import { loadContent, loadTemplates, renderHtml } from './render.mjs';
import sharp from 'sharp';

const SRC = 'src';
const OUT = 'dist';

// Files in src/ that are not copied verbatim.
const HASHED = ['styles.css', 'script.js', 'store.js', 'boot.js'];
const HERO_SRC = 'assets/ochayoli-hero-abstract.webp';
const NOT_COPIED = new Set([...HASHED, HERO_SRC]);

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

// 0. Refuse truncated PNGs. A previous upload cut the hero image off at 768 KB;
//    shipping that would publish a half-rendered picture. A valid PNG always ends
//    with the 12-byte IEND chunk.
const IEND = Buffer.from('0000000049454e44ae426082', 'hex');
const truncated = [];
for (const file of (await walk(SRC)).filter((f) => f.endsWith('.png'))) {
  const data = await readFile(file);
  if (data.length < 20 || !data.subarray(data.length - 12).equals(IEND)) truncated.push(file);
}
if (truncated.length) {
  console.error('Build stopped: these PNG files are truncated or corrupt (no IEND chunk):');
  for (const file of truncated) console.error(`  - ${file}`);
  console.error('Replace them with the complete original files and run the build again.');
  process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// 1. Verbatim copy (dotfiles such as .htaccess included).
await cp(SRC, OUT, {
  recursive: true,
  filter: (source) => {
    const rel = path.relative(SRC, source).split(path.sep).join('/');
    return !NOT_COPIED.has(rel) && rel !== 'js' && !rel.startsWith('js/');
  },
});

// 2. Minify + hash CSS and JS.
const hashed = {};
const report = [];
for (const name of HASHED) {
  const raw = await readFile(path.join(SRC, name), 'utf8');
  let code;
  if (name === 'script.js') {
    // Entry point: bundle src/script.js and src/js/*.js into one file.
    const result = await bundle({ entryPoints: [path.join(SRC, name)], bundle: true, write: false, minify: true, format: 'esm', target: 'es2020', legalComments: 'none' });
    code = result.outputFiles[0].text;
  } else {
    ({ code } = await transform(raw, { loader: name.endsWith('.css') ? 'css' : 'js', minify: true, target: 'es2020', legalComments: 'none' }));
  }
  const ext = path.extname(name);
  const hashedName = `${path.basename(name, ext)}.${hash(code)}${ext}`;
  await writeFile(path.join(OUT, hashedName), code);
  hashed[name] = hashedName;
  report.push([name, Buffer.byteLength(raw), Buffer.byteLength(code)]);
}

// 3. Hero image: AVIF + WebP at 640w and 1254w.
const heroPath = path.join(SRC, HERO_SRC);
const heroBefore = (await stat(heroPath)).size;
await mkdir(path.join(OUT, 'assets'), { recursive: true });
let heroAfter = 0;
for (const width of [640, 1254]) {
  const base = sharp(heroPath).resize({ width, withoutEnlargement: true });
  const avif = await base.clone().avif({ quality: 50, effort: 5 }).toBuffer();
  const webp = await base.clone().webp({ quality: 78, effort: 5 }).toBuffer();
  await writeFile(path.join(OUT, `assets/hero-${width}.avif`), avif);
  await writeFile(path.join(OUT, `assets/hero-${width}.webp`), webp);
  if (width === 1254) heroAfter = webp.length;
}
report.push(['hero image (served WebP, 1254w)', heroBefore, heroAfter]);

// 4. Render shared templates + content into pages, then rewrite references
//    to the hashed filenames in every HTML file.
const content = await loadContent();
const templates = await loadTemplates();
const refPattern = /(href|src)="\/?(styles\.css|script\.js|store\.js|boot\.js)"/g;
let rewritten = 0;
for (const file of (await walk(OUT)).filter((f) => f.endsWith('.html'))) {
  const html = await renderHtml(await readFile(file, 'utf8'), content, templates);
  const next = html.replace(refPattern, (_, attr, name) => {
    rewritten += 1;
    return `${attr}="/${hashed[name]}"`;
  });
  await writeFile(file, next);
}

console.log('Build complete -> dist/');
for (const [label, before, after] of report) {
  console.log(`  ${label.padEnd(34)} ${kb(before).padStart(10)} -> ${kb(after).padStart(10)}`);
}
console.log(`  asset references rewritten: ${rewritten}`);
console.log(`  hashed files: ${Object.values(hashed).join(', ')}`);
