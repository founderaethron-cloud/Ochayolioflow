<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['ok' => false, 'message' => 'Only GET requests are accepted.'], 405);
}

jsonResponse([
    'ok' => true,
    'order_mode' => envValue('OCHAYOLI_ORDER_MODE', 'availability'),
    'qikink_configured' => envValue('QIKINK_AUTH_TOKEN') !== '',
    'qikink_catalog_mapped_count' => count(privateCatalog()),
    'qikink_live_orders_enabled' => envFlag('OCHAYOLI_LIVE_ORDERS_ENABLED'),
    'live_payments_enabled' => envFlag('OCHAYOLI_LIVE_PAYMENTS_ENABLED'),
    'message' => 'Live payments and supplier order creation remain disabled until explicitly configured and approved.',
]);

