<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$privateConfigPath = dirname(__DIR__, 2) . '/qikink-config.php';
$GLOBALS['ochayoliPrivateConfig'] = is_file($privateConfigPath) ? require $privateConfigPath : [];

function privateConfig(): array
{
    return is_array($GLOBALS['ochayoliPrivateConfig'] ?? null) ? $GLOBALS['ochayoliPrivateConfig'] : [];
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function envValue(string $key, string $fallback = ''): string
{
    $configKeys = [
        'QIKINK_API_URL' => 'api_url',
        'QIKINK_AUTH_TOKEN' => 'auth_token',
        'QIKINK_SHIPPING_ENABLED' => 'shipping_enabled',
        'OCHAYOLI_LIVE_ORDERS_ENABLED' => 'live_orders_enabled',
        'OCHAYOLI_LIVE_PAYMENTS_ENABLED' => 'live_payments_enabled',
        'OCHAYOLI_ORDER_MODE' => 'order_mode',
    ];
    $config = privateConfig();
    if (isset($configKeys[$key]) && array_key_exists($configKeys[$key], $config)) {
        $value = $config[$configKeys[$key]];
        if (is_bool($value)) return $value ? 'true' : 'false';
        if (is_string($value) && trim($value) !== '') return trim($value);
    }
    $value = getenv($key);
    return $value === false ? $fallback : trim($value);
}

function envFlag(string $key, bool $fallback = false): bool
{
    $value = strtolower(envValue($key, $fallback ? 'true' : 'false'));
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function requirePost(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['ok' => false, 'message' => 'Only POST requests are accepted.'], 405);
    }
}

function requestJson(): array
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > 100000) {
        jsonResponse(['ok' => false, 'message' => 'Request is too large.'], 413);
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw ?: '', true);
    if (!is_array($payload)) {
        jsonResponse(['ok' => false, 'message' => 'A JSON request body is required.'], 400);
    }
    return $payload;
}

function cleanText(mixed $value, int $maxLength): string
{
    $value = trim(strip_tags((string) $value));
    $value = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $value) ?? '';
    return substr($value, 0, $maxLength);
}

function validOrderNumber(mixed $value): string
{
    $orderNumber = cleanText($value, 15);
    if ($orderNumber === '' || !preg_match('/^[A-Za-z0-9]+$/', $orderNumber)) {
        jsonResponse(['ok' => false, 'message' => 'A valid alphanumeric order number is required.'], 422);
    }
    return $orderNumber;
}

function validLineItems(mixed $value): array
{
    if (!is_array($value) || count($value) < 1 || count($value) > 50) {
        jsonResponse(['ok' => false, 'message' => 'At least one line item is required.'], 422);
    }

    $items = [];
    foreach ($value as $item) {
        if (!is_array($item)) {
            jsonResponse(['ok' => false, 'message' => 'Line items must be objects.'], 422);
        }
        $sku = cleanText($item['sku'] ?? '', 80);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 20]]);
        $price = filter_var($item['price'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($sku === '' || $quantity === false || $price === false || $price < 0) {
            jsonResponse(['ok' => false, 'message' => 'Each line item needs a SKU, positive quantity, and non-negative price.'], 422);
        }
        $items[] = [
            'search_from_my_products' => (bool) ($item['search_from_my_products'] ?? true),
            'price' => number_format((float) $price, 2, '.', ''),
            'quantity' => $quantity,
            'sku' => $sku,
        ];
        if (!empty($item['designs'])) {
            $items[count($items) - 1]['designs'] = $item['designs'];
        }
    }
    return $items;
}

function privateCatalog(): array
{
    $catalog = privateConfig()['catalog'] ?? [];
    return is_array($catalog) ? $catalog : [];
}

function validShippingAddress(mixed $value): array
{
    if (!is_array($value)) {
        jsonResponse(['ok' => false, 'message' => 'A shipping address is required before fulfillment.'], 422);
    }
    $address = [
        'first_name' => cleanText($value['first_name'] ?? '', 20),
        'last_name' => cleanText($value['last_name'] ?? '', 20),
        'address1' => cleanText($value['address1'] ?? '', 80),
        'address2' => cleanText($value['address2'] ?? '', 80),
        'phone' => cleanText($value['phone'] ?? '', 20),
        'email' => trim((string) ($value['email'] ?? '')),
        'city' => cleanText($value['city'] ?? '', 40),
        'zip' => cleanText($value['zip'] ?? '', 12),
        'province' => cleanText($value['province'] ?? '', 40),
        'country' => cleanText($value['country'] ?? 'India', 40),
        'name' => cleanText($value['name'] ?? '', 40),
        'country_code' => strtoupper(cleanText($value['country_code'] ?? 'IN', 2)),
    ];
    foreach (['first_name', 'last_name', 'address1', 'phone', 'city', 'zip', 'province', 'name'] as $required) {
        if ($address[$required] === '') {
            jsonResponse(['ok' => false, 'message' => 'Complete shipping address details are required.'], 422);
        }
    }
    if (!filter_var($address['email'], FILTER_VALIDATE_EMAIL) || $address['country_code'] !== 'IN') {
        jsonResponse(['ok' => false, 'message' => 'A valid Indian shipping email and country code are required.'], 422);
    }
    return $address;
}

