<?php
declare(strict_types=1);

// Contact endpoint. POST only, JSON out.
// Guards: same-origin check, honeypot, per-IP rate limit, server-side validation,
// header-injection-safe mail, and a server-generated reference returned to the visitor.

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

const RECIPIENT = 'hello@ochayoli.in';
const ALLOWED_HOSTS = ['ochayoli.in', 'www.ochayoli.in'];
const TOPICS = [
    'collaboration' => 'Artist collaboration',
    'booking' => 'Live booking',
    'workshops' => 'Workshops',
    'partnership' => 'Creative partnership',
    'press' => 'Press',
    'auditions' => 'Auditions',
    'other' => 'Something else',
];
const RATE_LIMIT = 5;          // submissions
const RATE_WINDOW = 3600;      // per hour, per IP

function respond(int $status, bool $ok, string $message, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message] + $extra);
    exit;
}

function sameOrigin(): bool
{
    $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($source === '') {
        return false;
    }
    $host = strtolower((string) parse_url($source, PHP_URL_HOST));
    return in_array($host, ALLOWED_HOSTS, true);
}

function rateLimited(): bool
{
    $dir = sys_get_temp_dir() . '/ochayoli-rate';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false; // fail open: a broken temp dir must not take the form down
    }
    $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|ochayoli');
    $file = "$dir/$key";
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = array_filter(array_map('intval', file($file, FILE_IGNORE_NEW_LINES) ?: []), static fn (int $t): bool => $now - $t < RATE_WINDOW);
    }
    if (count($hits) >= RATE_LIMIT) {
        return true;
    }
    $hits[] = $now;
    @file_put_contents($file, implode("\n", $hits), LOCK_EX);
    return false;
}

$cleanLine = static function (string $value, int $max): string {
    $value = trim(strip_tags($value));
    $value = preg_replace('/[\r\n\x00-\x1F\x7F]+/', ' ', $value) ?? '';
    return mb_substr($value, 0, $max);
};

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Only POST requests are accepted.');
}

if (!sameOrigin()) {
    respond(403, false, 'This request could not be verified. Please use the form on ochayoli.in.');
}

if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(200, true, 'Thanks — your inquiry has been received.'); // honeypot: pretend success
}

if (rateLimited()) {
    header('Retry-After: ' . RATE_WINDOW);
    respond(429, false, 'Too many messages from this connection. Please try again later or email ' . RECIPIENT . '.');
}

$name = $cleanLine((string) ($_POST['name'] ?? ''), 100);
$email = trim((string) ($_POST['email'] ?? ''));
$topicKey = (string) ($_POST['topic'] ?? '');
$message = trim(strip_tags((string) ($_POST['message'] ?? '')));
$message = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $message) ?? '';
$message = mb_substr($message, 0, 5000);

if (mb_strlen($name) < 2) {
    respond(422, false, 'Please enter your name.');
}
if (!array_key_exists($topicKey, TOPICS)) {
    respond(422, false, 'Please choose a topic.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    respond(422, false, 'Please enter a valid email address.');
}
if (mb_strlen($message) < 10) {
    respond(422, false, 'Please add a little more detail to your message.');
}

$reference = 'OC-' . gmdate('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
$topic = TOPICS[$topicKey];
$subject = "[{$reference}] {$topic} — {$name}";
$body = "Reference: {$reference}\nTopic: {$topic}\nName: {$name}\nEmail: {$email}\n\nMessage:\n{$message}\n";
$headers = implode("\r\n", [
    'From: ' . RECIPIENT,
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

if (!mail(RECIPIENT, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . RECIPIENT)) {
    respond(502, false, 'The message could not be delivered right now. Please try again later or email ' . RECIPIENT . '.');
}

respond(200, true, "Thanks — your message was sent. Reference {$reference}.", ['reference' => $reference]);
