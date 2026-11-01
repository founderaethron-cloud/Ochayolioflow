<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/../lib/qikink.php';

requirePost();
$payload = requestJson();

if (($payload['dry_run'] ?? false) !== true) {
    if (!envFlag('OCHAYOLI_LIVE_PAYMENTS_ENABLED') || !envFlag('OCHAYOLI_LIVE_ORDERS_ENABLED')) {
        jsonResponse(['ok' => false, 'message' => 'Live payments and supplier orders are disabled. Use dry_run: true until approval and configuration are complete.'], 503);
    }
    if (envValue('QIKINK_AUTH_TOKEN') === '') {
        jsonResponse(['ok' => false, 'message' => 'Qikink credentials are not configured on the server.'], 503);
    }
}

$orderNumber = validOrderNumber($payload['order_number'] ?? '');
$dryRun = ($payload['dry_run'] ?? false) === true;

if ($dryRun) {
    $lineItems = validLineItems($payload['line_items'] ?? null);
    $total = filter_var($payload['total_order_value'] ?? null, FILTER_VALIDATE_FLOAT);
    if ($total === false || $total < 0) {
        jsonResponse(['ok' => false, 'message' => 'A non-negative total order value is required.'], 422);
    }
} else {
    $catalog = privateCatalog();
    $requestedItems = $payload['items'] ?? null;
    if (!is_array($requestedItems) || count($requestedItems) < 1 || count($requestedItems) > 50) {
        jsonResponse(['ok' => false, 'message' => 'At least one mapped catalogue item is required.'], 422);
    }
    $lineItems = [];
    $total = 0.0;
    foreach ($requestedItems as $item) {
        $productKey = cleanText($item['product_key'] ?? '', 100);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 20]]);
        $mapped = $catalog[$productKey] ?? null;
        if (!is_array($mapped) || $quantity === false || empty($mapped['sku']) || !isset($mapped['price'])) {
            jsonResponse(['ok' => false, 'message' => 'Every requested item needs a verified server-side Qikink SKU and price before live ordering.'], 503);
        }
        $price = filter_var($mapped['price'], FILTER_VALIDATE_FLOAT);
        if ($price === false || $price < 0) {
            jsonResponse(['ok' => false, 'message' => 'A mapped catalogue price is invalid.'], 503);
        }
        $lineItems[] = [
            'search_from_my_products' => (bool) ($mapped['search_from_my_products'] ?? true),
            'price' => number_format((float) $price, 2, '.', ''),
            'quantity' => $quantity,
            'sku' => cleanText($mapped['sku'], 80),
        ];
        $total += (float) $price * $quantity;
    }
    if (cleanText($payload['payment_reference'] ?? '', 120) === '') {
        jsonResponse(['ok' => false, 'message' => 'A verified payment reference is required before live supplier ordering.'], 422);
    }
}

$request = [
    'auth_token' => envValue('QIKINK_AUTH_TOKEN'),
    'order_number' => $orderNumber,
    'qikink_shipping' => envFlag('QIKINK_SHIPPING_ENABLED') ? 1 : 0,
    'gateway' => cleanText($payload['gateway'] ?? 'online', 20),
    'total_order_value' => number_format((float) $total, 2, '.', ''),
    'line_items' => $lineItems,
];

if (!$dryRun || !empty($payload['shipping_address'])) {
    $request['shipping_address'] = validShippingAddress($payload['shipping_address'] ?? null);
}

if ($dryRun) {
    unset($request['auth_token']);
    jsonResponse([
        'ok' => true,
        'mode' => 'dry_run',
        'would_create_order' => true,
        'order_number' => $orderNumber,
        'request' => $request,
        'message' => 'Dry run validated. No request was sent to Qikink and no paid order was created.',
    ]);
}

$result = qikinkCreateOrder($request);
if (!$result['ok']) {
    jsonResponse(['ok' => false, 'message' => $result['message']], 502);
}

jsonResponse([
    'ok' => true,
    'mode' => 'live',
    'qikink_order_id' => $result['order_id'],
    'message' => 'Order accepted by Qikink.',
]);

