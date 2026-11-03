import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const files = ['index.html', 'styles.css', 'script.js', 'store.js', 'contact.php', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'store/index.html', 'cart/index.html', 'checkout/index.html', 'order-confirmation/index.html'];
const contents = Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(`src/${file}`, 'utf8')])));

assert.match(contents['index.html'], /<main id="content">/);
assert.doesNotMatch(contents['index.html'], /data-artist-grid|id="artists"|id="farsida"|data-profile-dialog/);
assert.match(contents['index.html'], /data-inquiry-form/);
assert.match(contents['index.html'], /action="contact\.php"/);
assert.match(contents['index.html'], /<!--@include header-->/);
assert.match(contents['index.html'], /<!--@render releases-->/);
assert.match(contents['index.html'], /Many artists, many directions/);
assert.match(contents['index.html'], /application\/ld\+json/);
assert.match(contents['script.js'], /initContactForm/);
assert.match(await readFile('src/js/contact-form.js', 'utf8'), /fetch\(form\.action/);
assert.doesNotMatch(contents['script.js'], /showModal|data-artist/);
assert.match(contents['contact.php'], /hello@ochayoli\.in/);
assert.match(contents['contact.php'], /FILTER_VALIDATE_EMAIL/);
assert.match(contents['contact.php'], /rateLimited\(\)/);
assert.match(contents['contact.php'], /sameOrigin\(\)/);
assert.match(contents['styles.css'], /prefers-reduced-motion/);
assert.match(contents['styles.css'], /@media \(max-width: 780px\)/);
assert.match(contents['styles.css'], /Store extension/);
assert.match(contents['store.js'], /ochayoli-store-shortlist/);
assert.match(contents['store.js'], /hello@ochayoli\.in/);
assert.match(contents['store.js'], /Pending label verification/);
assert.match(contents['store/index.html'], /data-store-view="catalogue"/);
assert.match(contents['cart/index.html'], /data-store-view="cart"/);
assert.match(contents['checkout/index.html'], /data-store-view="checkout"/);
assert.match(contents['order-confirmation/index.html'], /data-store-view="confirmation"/);
assert.match(contents['robots.txt'], /User-agent: \*/);
assert.match(contents['sitemap.xml'], /<urlset/);

console.log(`Smoke test passed: ${files.length} site files checked.`);

