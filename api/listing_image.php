<?php
require_once 'config.php';

$id = $_GET['id'] ?? '';
if (!$id) {
    http_response_code(404);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT url FROM listing_images 
     WHERE listing_id = ? 
     ORDER BY sort_order 
     LIMIT 1"
);
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['url'])) {
    http_response_code(404);
    exit;
}

$url = $row['url'];

// ✅ إذا كانت Base64
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

// ✅ إذا كانت رابط URL عادي
if (strpos($url, 'http') === 0 || strpos($url, '/') === 0) {
    header('Location: ' . $url, true, 302);
    exit;
}

// ✅ إذا كانت مسار ملف محلي
$filePath = __DIR__ . '/../' . ltrim($url, '/');
if (file_exists($filePath)) {
    $mime = mime_content_type($filePath) ?: 'image/jpeg';
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=2592000');
    readfile($filePath);
    exit;
}

http_response_code(404);