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

// ==========================================
// ✨ دالة مساعدة: ترويسات التخزين المؤقت الموحدة
// ==========================================
function sendCacheHeaders() {
    // سنة كاملة = 31536000 ثانية
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    header('Vary: Accept-Encoding');
    header('Vary: User-Agent');
}

// ==========================================
// 1️⃣ رابط URL خارجي → 302 Redirect مع Cache
// ==========================================
if (strpos($url, 'http') === 0 && strpos($url, 'data:') !== 0) {
    sendCacheHeaders(); // ✅ جديد: يخبر المتصفح بتخزين الـ Redirect
    header('Location: ' . $url, true, 302);
    exit;
}

// ==========================================
// 2️⃣ صورة Base64
// ==========================================
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        $size = strlen($parts[1]);

        // ✅ إذا الصورة كبيرة (> 100 kB) → استخدم wsrv.nl لضغطها
        if ($size > 100000) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? '';
            $rawUrl = $protocol . '://' . $host . '/api/listing_image_raw.php?id=' . urlencode($id) . '&index=' . $offset;

            $proxyUrl = 'https://wsrv.nl/?url=' . urlencode($rawUrl) . '&w=500&h=400&fit=cover&q=55&output=jpg&il';
            sendCacheHeaders(); // ✅ جديد: يخبر المتصفح بتخزين الـ Redirect
            header('Location: ' . $proxyUrl, true, 302);
            exit;
        }

        // صورة صغيرة → أرسلها مباشرة (بدون 302)
        $binary = base64_decode($parts[1]);
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';

        sendCacheHeaders(); // ✅ استخدام الدالة الموحدة
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . strlen($binary));
        echo $binary;
        exit;
    }
}

http_response_code(404);