import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const files = await Promise.all([
  'src/api/bootstrap.php',
  'src/api/health.php',
  'src/api/qikink-order.php',
  'src/lib/qikink.php',
  '.env.example',
].map(async (file) => [file, await readFile(file, 'utf8')]));
const contents = Object.fromEntries(files);

assert.match(contents['src/api/qikink-order.php'], /dry_run/);
assert.match(contents['src/api/qikink-order.php'], /OCHAYOLI_LIVE_PAYMENTS_ENABLED/);
assert.match(contents['src/api/qikink-order.php'], /OCHAYOLI_LIVE_ORDERS_ENABLED/);
assert.match(contents['src/api/qikink-order.php'], /server-side Qikink SKU/);
assert.match(contents['src/api/qikink-order.php'], /payment_reference/);
assert.match(contents['src/api/bootstrap.php'], /FILTER_VALIDATE_EMAIL/);
assert.match(contents['src/api/bootstrap.php'], /country_code/);
assert.match(contents['src/lib/qikink.php'], /createOrder/);
assert.match(contents['.env.example'], /QIKINK_AUTH_TOKEN=/);
assert.doesNotMatch(contents['.env.example'], /QIKINK_AUTH_TOKEN=\S+/);

console.log(`Qikink contract test passed: ${files.length} integration files checked.`);

