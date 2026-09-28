<?php
/**
 * تقديم صورة الإعلان الأولى مباشرة
 * بدل إرسالها Base64 في listings.php
 */

require_once 'config.php';

$id = $_GET['id'] ?? '';
$index = isset($_GET['index']) ? (int)$_GET['index'] : 0;

if (!$id) {
    http_response_code(404);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT url FROM listing_images 
     WHERE listing_id = ? 
     ORDER BY sort_order 
     LIMIT 1 OFFSET ?"
);
$stmt->bindValue(1, $id, PDO::PARAM_STR);
$stmt->bindValue(2, $index, PDO::PARAM_INT);
$stmt->execute();
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
<<<<<<< Updated upstream
=======
        $size = strlen($parts[1]);

        // ✅ إذا الصورة كبيرة (> 100 kB) → استخدم wsrv.nl لضغطها
        if ($size > 100000) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? '';
            $rawUrl = $protocol . '://' . $host . '/api/listing_image_raw.php?id=' . urlencode($id) . '&index=' . $index;

            // wsrv.nl - خدمة ضغط مجانية
            $proxyUrl = 'https://wsrv.nl/?url=' . urlencode($rawUrl) . '&w=500&h=400&fit=cover&q=55&output=jpg&il';
            header('Location: ' . $proxyUrl, true, 302);
            exit;
        }

        // صورة صغيرة → أرسلها كما هي
        $binary = base64_decode($parts[1]);
>>>>>>> Stashed changes
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';
        $binary = base64_decode($parts[1]);

        // كاش لمدة 30 يوم في المتصفح
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