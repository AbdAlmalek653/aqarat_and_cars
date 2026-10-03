<?php
/**
 * ==========================================
 * listing_image.php - النسخة النهائية (v3.2)
 * ==========================================
 * 
 * ✨ التحديثات:
 * - large = 2400px (بدل 1600) للشاشات الكبيرة
 * - جودة WebP 92 للـ large
 * - cache key جديد (v5) لإجبار تجديد الكاش
 * - Vary: Accept لضمان توافق المتصفحات
 */

require_once 'config.php';
session_write_close();

/* ==========================================
   1. قراءة المعاملات
   ========================================== */
$id    = $_GET['id'] ?? '';
$index = isset($_GET['index']) ? (int)$_GET['index'] : 0;
$size  = $_GET['size'] ?? 'large';
$width = isset($_GET['w']) ? (int)$_GET['w'] : 0;
$forceQuality = isset($_GET['q']) ? (int)$_GET['q'] : 0;

if (!$id) {
    http_response_code(404);
    exit;
}

$offset = max(0, $index);

/* ==========================================
   2. تحديد العرض المستهدف (v3.2)
   ========================================== */
$sizeMap = [
    'thumb'  => 400,
    'medium' => 900,
    'large'  => 2400,   // ✅ رفعناها من 1600 إلى 2400
];

if (!isset($sizeMap[$size])) {
    $size = 'large';
}

$targetWidth = $width > 0 ? $width : $sizeMap[$size];

/* ==========================================
   3. جلب رابط الصورة
   ========================================== */
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
   4. إعدادات الكاش (v5 - جديد)
   ========================================== */
$cacheDir = __DIR__ . '/cache/images';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

// ✅ مفتاح كاش v5 - لإجبار مسح الكاش القديم
$cacheKey = md5($url . '_' . $targetWidth . '_v5');
$cacheFile = $cacheDir . '/' . $cacheKey . '.webp';

/* ==========================================
   5. Placeholder
   ========================================== */
function sendPlaceholder($width = 400) {
    $height = (int)($width * 0.75);
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $width . '" height="' . $height . '" viewBox="0 0 ' . $width . ' ' . $height . '">'
         . '<rect fill="#1A2438" width="' . $width . '" height="' . $height . '"/>'
         . '<text x="' . ($width/2) . '" y="' . ($height/2) . '" fill="#64748B" font-family="Cairo,sans-serif" font-size="18" text-anchor="middle">صورة غير متوفرة</text>'
         . '</svg>';
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo $svg;
    exit;
}

/* ==========================================
   6. ترويسات الكاش
   ========================================== */
function sendCacheHeaders($mime = null, $size = null) {
    header('Cache-Control: public, max-age=2592000');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 2592000) . ' GMT');
    header('Vary: Accept, Accept-Encoding');

    if ($mime) {
        header('Content-Type: ' . $mime);
    }
    if ($size !== null) {
        header('Content-Length: ' . $size);
    }
}

/* ==========================================
   7. معالجة الصورة (v3.2 - جودة أعلى)
   ========================================== */
function processImage($data, $mime, $targetWidth = 2400, $forceQuality = 0) {
    if (!function_exists('imagecreatefromstring')) {
        return ['data' => $data, 'mime' => $mime];
    }

    $img = @imagecreatefromstring($data);
    if (!$img) {
        return ['data' => $data, 'mime' => $mime];
    }

    $origW = imagesx($img);
    $origH = imagesy($img);

    $newW = $origW;
    $newH = $origH;

    // تصغير فقط لو الصورة الأصلية أكبر
    if ($targetWidth > 0 && $origW > $targetWidth) {
        $newW = $targetWidth;
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
        // ✅ جودة أعلى في v3.2
        if ($forceQuality > 0) {
            $quality = $forceQuality;
        } elseif ($targetWidth >= 2000) {
            $quality = 92;   // ✅ large (2400px)
        } elseif ($targetWidth >= 900) {
            $quality = 88;   // ✅ medium (900px)
        } else {
            $quality = 82;   // thumb
        }

        imagewebp($newImg, null, $quality);
        $output = ob_get_clean();
        $finalMime = 'image/webp';
    } else {
        $quality = $targetWidth >= 2000 ? 92 : 88;
        imagejpeg($newImg, null, $quality);
        $output = ob_get_clean();
        $finalMime = 'image/jpeg';
    }

    imagedestroy($img);
    imagedestroy($newImg);

    return ['data' => $output, 'mime' => $finalMime];
}

/* ==========================================
   8. جلب الصور الخارجية
   ========================================== */
function fetchRemoteImage($url) {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SouqBot/3.2)',
        CURLOPT_HTTPHEADER => [
            'Accept: image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
        ],
        CURLOPT_ENCODING => '',
    ]);

    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($httpCode !== 200 || $data === false || empty($data)) {
        return false;
    }

    if (!$contentType || strpos($contentType, 'image/') !== 0) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $contentType = $finfo->buffer($data) ?: 'image/jpeg';
    }

    return ['data' => $data, 'mime' => $contentType];
}

/* ==========================================
   9. خدمة الكاش
   ========================================== */
if (file_exists($cacheFile) && filesize($cacheFile) > 0) {
    $cachedData = file_get_contents($cacheFile);
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($cachedData) ?: 'image/webp';

    sendCacheHeaders($mime, strlen($cachedData));
    echo $cachedData;
    exit;
}

/* ==========================================
   10. Base64
   ========================================== */
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        $binary = base64_decode($parts[1]);
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';

        $result = processImage($binary, $mime, $targetWidth, $forceQuality);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }
}

/* ==========================================
   11. رابط خارجي
   ========================================== */
if (strpos($url, 'http') === 0) {
    $remote = fetchRemoteImage($url);

    if ($remote !== false) {
        $result = processImage($remote['data'], $remote['mime'], $targetWidth, $forceQuality);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }

    sendPlaceholder($targetWidth);
}

/* ==========================================
   12. صورة محلية
   ========================================== */
if (strpos($url, '/uploads/') === 0) {
    $localPath = __DIR__ . '/..' . $url;
    if (file_exists($localPath)) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($localPath);

        $data = file_get_contents($localPath);
        $result = processImage($data, $mime, $targetWidth, $forceQuality);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }
}

sendPlaceholder($targetWidth);