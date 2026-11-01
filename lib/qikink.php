<?php
declare(strict_types=1);

function qikinkCreateOrder(array $request): array
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'message' => 'PHP cURL is required for Qikink integration.'];
    }

    $url = envValue('QIKINK_API_URL', 'https://qikink.com/erp2/index.php/api/createOrder');
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_SLASHES),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
    ]);
    $body = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($body === false || $error !== '') {
        return ['ok' => false, 'message' => 'Qikink request failed: ' . $error];
    }
    $response = json_decode($body, true);
    if (!is_array($response) || $status < 200 || $status >= 300 || (int) ($response['code'] ?? 0) !== 1) {
        return ['ok' => false, 'message' => 'Qikink rejected the order request.'];
    }
    return ['ok' => true, 'order_id' => $response['order_id'] ?? null];
}

