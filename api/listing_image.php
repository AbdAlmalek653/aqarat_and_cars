<?php
require_once 'config.php';
// ✅✅✅ الحل: أغلق الـ session فوراً عشان ما يعمل قفل
session_write_close();

$id = $_GET['id'] ?? '';
$index = isset($_GET['index']) ? (int)$_GET['index'] : 0;
$width = isset($_GET['w']) ? (int)$_GET['w'] : 0;

if (!$id) {
    http_response_code(404);
    exit;
}

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

/* ==========================================
   ✨ إعدادات الكاش المحلي
   ========================================== */
$cacheDir = __DIR__ . '/cache/images';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$cacheKey = md5($url . '_w' . $width);
$cacheFile = $cacheDir . '/' . $cacheKey . '.webp';

/* ==========================================
   ✨ دالة: صورة placeholder
   ========================================== */
function sendPlaceholder() {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">'
         . '<rect fill="#1A2438" width="400" height="300"/>'
         . '<circle cx="200" cy="120" r="40" fill="none" stroke="#334155" stroke-width="3"/>'
         . '<path d="M170 120 L200 95 L230 120 M185 120 L200 105 L215 120" stroke="#475569" stroke-width="3" fill="none"/>'
         . '<text x="200" y="200" fill="#64748B" font-family="Cairo,sans-serif" font-size="16" text-anchor="middle">صورة غير متوفرة</text>'
         . '</svg>';
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    header('Content-Length: ' . strlen($svg));
    echo $svg;
    exit;
}

// ==========================================
// ✨ دالة: إرسال ترويسات الكاش
// ==========================================
function sendCacheHeaders($mime = null, $size = null) {
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    header('Vary: Accept-Encoding');
    if ($mime) {
        header('Content-Type: ' . $mime);
    }
    if ($size !== null) {
        header('Content-Length: ' . $size);
    }
}

// ==========================================
// ✨ دالة: معالجة وتصغير الصورة
// ==========================================
function processImage($data, $mime, $maxWidth = 0) {
    if (!function_exists('imagecreatefromstring')) {
        return ['data' => $data, 'mime' => $mime, 'ext' => 'jpg'];
    }

    $img = @imagecreatefromstring($data);
    if (!$img) {
        return ['data' => $data, 'mime' => $mime, 'ext' => 'jpg'];
    }

    $origW = imagesx($img);
    $origH = imagesy($img);

    $newW = $origW;
    $newH = $origH;

    $targetWidth = $maxWidth > 0 ? $maxWidth : 0;
    $shouldResize = ($targetWidth > 0 && $origW > $targetWidth) || ($targetWidth === 0 && $origW > 1400);

    if ($shouldResize) {
        $newW = $targetWidth > 0 ? $targetWidth : 1400;
        $newH = (int)($origH * ($newW / $origW));
    }

    $newImg = imagecreatetruecolor($newW, $newH);

    if ($mime === 'image/png' || $mime === 'image/webp') {
        imagealphablending($newImg, false);
        imagesavealpha($newImg, true);
        $transparent = imagecolorallocatealpha($newImg, 255, 255, 255, 127);
        imagefilledrectangle($newImg, 0, 0, $newW, $newH, $transparent);
    }

    imagecopyresampled($newImg, $img, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

    ob_start();
    if (function_exists('imagewebp')) {
        imagewebp($newImg, null, 80);
        $output = ob_get_clean();
        $finalMime = 'image/webp';
        $ext = 'webp';
    } else {
        imagejpeg($newImg, null, 82);
        $output = ob_get_clean();
        $finalMime = 'image/jpeg';
        $ext = 'jpg';
    }

    imagedestroy($img);
    imagedestroy($newImg);

    return ['data' => $output, 'mime' => $finalMime, 'ext' => $ext];
}

// ==========================================
// ✨ دالة: جلب صورة من URL خارجي
// ==========================================
function fetchRemoteImage($url) {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 2,
        CURLOPT_TIMEOUT => 3,              // ✅ تقليل من 8 لـ 3 ثواني
        CURLOPT_CONNECTTIMEOUT => 2,       // ✅ تقليل من 4 لـ 2 ثواني
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SouqBot/1.0)',
        CURLOPT_HTTPHEADER => [
            'Accept: image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
        ],
    ]);

    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($httpCode !== 200 || $data === false || empty($data)) {
        return false;
    }

    if ($contentType && strpos($contentType, 'image/') !== 0) {
        return false;
    }

    if (!$contentType || $contentType === 'application/octet-stream') {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $contentType = $finfo->buffer($data) ?: 'image/jpeg';
    }

    return ['data' => $data, 'mime' => $contentType];
}

// ==========================================
// 1️⃣ إذا كان الكاش المحلي موجود → خدمة فورية
// ==========================================
if (file_exists($cacheFile) && filesize($cacheFile) > 0) {
    $cachedData = file_get_contents($cacheFile);
    sendCacheHeaders('image/webp', strlen($cachedData));
    echo $cachedData;
    exit;
}

// ==========================================
// 2️⃣ صورة Base64 → معالجة وخدمة
// ==========================================
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        $binary = base64_decode($parts[1]);
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';

        $result = processImage($binary, $mime, $width);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }
}

// ==========================================
// 3️⃣ رابط خارجي → جلب + معالجة + كاش محلي
// ==========================================
if (strpos($url, 'http') === 0) {
    $remote = fetchRemoteImage($url);

    if ($remote !== false) {
        $result = processImage($remote['data'], $remote['mime'], $width);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }

    // ✅✅✅ بدل الـ redirect: أرجع placeholder فوراً
    sendPlaceholder();
}

sendPlaceholder();