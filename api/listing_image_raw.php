<?php
require_once 'config.php';

$id = $_GET['id'] ?? '';
$index = isset($_GET['index']) ? (int)$_GET['index'] : 0;

if (!$id) {
    http_response_code(404);
    exit;
}

// ✅ SQLite لا يدعم binding مع OFFSET → نستخدم قيمة مضمّنة
$offset = max(0, $index);

$stmt = $pdo->prepare(
    "SELECT url FROM listing_images 
     WHERE listing_id = ? 
     ORDER BY sort_order 
     LIMIT 1 OFFSET " . $offset
);
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['url'])) {
    http_response_code(404);
    exit;
}

$url = $row['url'];

if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';
        $binary = base64_decode($parts[1]);

        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=2592000');
        header('Content-Length: ' . strlen($binary));
        echo $binary;
        exit;
    }
}

http_response_code(404);