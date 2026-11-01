<?php
declare(strict_types=1);

/*
 * Copy this reference outside public_html only when Hostinger environment
 * variables are unavailable. Do not commit the copy with real values.
 */
return [
    'api_url' => 'https://qikink.com/erp2/index.php/api/createOrder',
    'auth_token' => '',
    'live_orders_enabled' => false,
    'live_payments_enabled' => false,
    'shipping_enabled' => false,
    'catalog' => [
        // Add only verified product keys, Qikink SKUs, and prices outside GitHub.
        // 'ochayoli-core-tee' => ['sku' => 'VERIFIED-SKU', 'price' => '0.00'],
    ],
];

