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

// إذا كانت رابط URL عادي → أرسلها مباشرة
if (strpos($url, 'http') === 0 && strpos($url, 'data:') !== 0) {
    header('Location: ' . $url, true, 302);
    exit;
}

// ✅ إذا كانت Base64 → احسب حجمها
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        $size = strlen($parts[1]);

        // إذا الصورة كبيرة (> 150 kB في Base64) → استخدم wsrv.nl لضغطها
        if ($size > 150000) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? '';
            $rawUrl = $protocol . '://' . $host . '/api/listing_image_raw.php?id=' . urlencode($id);

            $proxyUrl = 'https://wsrv.nl/?url=' . urlencode($rawUrl) . '&w=600&q=60&output=jpg';
            header('Location: ' . $proxyUrl, true, 302);
            exit;
        }

        $binary = base64_decode($parts[1]);
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';

        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=2592000');
        header('Content-Length: ' . strlen($binary));
        echo $binary;
        exit;
    }
}

http_response_code(404);