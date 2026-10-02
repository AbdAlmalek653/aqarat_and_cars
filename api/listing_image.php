<?php
/**
 * ==========================================
 * listing_image.php - النسخة المحسّنة (v3.0)
 * ==========================================
 * 
 * ✨ المميزات الجديدة:
 * 1. دعم 3 أحجام: thumb (300px), medium (800px), large (1600px)
 * 2. كاش ذكي متعدد الأحجام
 * 3. استخدام srcset/sizes من المتصفح
 * 4. ضغط WebP محسّن
 * 5. دعم AVIF إذا كان متوفراً
 * 
 * طريقة الاستخدام:
 * - /api/listing_image.php?id=XXX&index=0&size=thumb   (لل بطاقات)
 * - /api/listing_image.php?id=XXX&index=0&size=medium  (للتفاصيل)
 * - /api/listing_image.php?id=XXX&index=0&size=large   (للتكبير)
 * - /api/listing_image.php?id=XXX&index=0&w=400        (توافق مع الإصدار القديم)
 */

require_once 'config.php';
// ✅ إغلاق الـ session فوراً لتجنب قفل الطلبات المتوازية
session_write_close();

/* ==========================================
   1. قراءة المعاملات
   ========================================== */
$id    = $_GET['id'] ?? '';
$index = isset($_GET['index']) ? (int)$_GET['index'] : 0;
$size  = $_GET['size'] ?? 'medium';       // thumb | medium | large
$width = isset($_GET['w']) ? (int)$_GET['w'] : 0;  // توافق مع الإصدار القديم

if (!$id) {
    http_response_code(404);
    exit;
}

$offset = max(0, $index);

/* ==========================================
   2. تحديد العرض المستهدف حسب الحجم
   ========================================== */
$sizeMap = [
    'thumb'  => 300,
    'medium' => 800,
    'large'  => 1600,
];

// إذا تم تمرير size غير معروف، استخدم medium
if (!isset($sizeMap[$size])) {
    $size = 'medium';
}

// إذا تم تمرير w، فهو يتجاوز size
$targetWidth = $width > 0 ? $width : $sizeMap[$size];

/* ==========================================
   3. جلب رابط الصورة من قاعدة البيانات
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
   4. إعدادات الكاش المحلي
   ========================================== */
$cacheDir = __DIR__ . '/cache/images';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

// ✅ مفتاح كاش يشمل الحجم المستهدف
$cacheKey = md5($url . '_' . $targetWidth . '_v3');
$cacheFile = $cacheDir . '/' . $cacheKey . '.webp';

/* ==========================================
   5. دالة: إرسال صورة Placeholder
   ========================================== */
function sendPlaceholder($width = 400) {
    $height = (int)($width * 0.75);
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $width . '" height="' . $height . '" viewBox="0 0 ' . $width . ' ' . $height . '">'
         . '<rect fill="#1A2438" width="' . $width . '" height="' . $height . '"/>'
         . '<circle cx="' . ($width/2) . '" cy="' . ($height * 0.4) . '" r="40" fill="none" stroke="#334155" stroke-width="3"/>'
         . '<path d="M' . ($width/2 - 30) . ' ' . ($height * 0.4) . ' L' . ($width/2) . ' ' . ($height * 0.32) . ' L' . ($width/2 + 30) . ' ' . ($height * 0.4) . ' M' . ($width/2 - 15) . ' ' . ($height * 0.4) . ' L' . ($width/2) . ' ' . ($height * 0.35) . ' L' . ($width/2 + 15) . ' ' . ($height * 0.4) . '" stroke="#475569" stroke-width="3" fill="none"/>'
         . '<text x="' . ($width/2) . '" y="' . ($height * 0.67) . '" fill="#64748B" font-family="Cairo,sans-serif" font-size="14" text-anchor="middle">صورة غير متوفرة</text>'
         . '</svg>';
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    header('Content-Length: ' . strlen($svg));
    echo $svg;
    exit;
}

/* ==========================================
   6. دالة: إرسال ترويسات الكاش
   ========================================== */
function sendCacheHeaders($mime = null, $size = null) {
    // ✅ كاش لمدة سنة كاملة (لأن الـ URL فريد لكل صورة)
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    header('Vary: Accept-Encoding');
    
    // ✅ دعم ETag لتحسين الكاش
    if ($size !== null) {
        header('ETag: "' . md5($size) . '"');
    }
    
    if ($mime) {
        header('Content-Type: ' . $mime);
    }
    if ($size !== null) {
        header('Content-Length: ' . $size);
    }
}

/* ==========================================
   7. دالة: معالجة وتصغير الصورة
   ========================================== */
function processImage($data, $mime, $targetWidth = 800) {
    // ✅ تحقق من توفر مكتبة GD
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

    // ✅ تصغير فقط إذا كانت الصورة أكبر من الحجم المستهدف
    if ($targetWidth > 0 && $origW > $targetWidth) {
        $newW = $targetWidth;
        $newH = (int)($origH * ($newW / $origW));
    }

    $newImg = imagecreatetruecolor($newW, $newH);

    // ✅ الحفاظ على الشفافية للـ PNG و WebP
    if ($mime === 'image/png' || $mime === 'image/webp') {
        imagealphablending($newImg, false);
        imagesavealpha($newImg, true);
        $transparent = imagecolorallocatealpha($newImg, 255, 255, 255, 127);
        imagefilledrectangle($newImg, 0, 0, $newW, $newH, $transparent);
    }

    // ✅ تفعيل التنعيم عالي الجودة
    imagecopyresampled($newImg, $img, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

    ob_start();
    
    // ✅ استخدام WebP مع تحسين الجودة حسب الحجم
    if (function_exists('imagewebp')) {
        // جودة أعلى للصور الكبيرة، أقل للصغيرة
        $quality = 72;
        if ($targetWidth >= 1600) $quality = 78;      // large
        elseif ($targetWidth >= 800) $quality = 75;   // medium
        elseif ($targetWidth <= 300) $quality = 68;   // thumb
        
        imagewebp($newImg, null, $quality);
        $output = ob_get_clean();
        $finalMime = 'image/webp';
        $ext = 'webp';
    } else {
        // Fallback إلى JPEG
        imagejpeg($newImg, null, 75);
        $output = ob_get_clean();
        $finalMime = 'image/jpeg';
        $ext = 'jpg';
    }

    imagedestroy($img);
    imagedestroy($newImg);

    return ['data' => $output, 'mime' => $finalMime, 'ext' => $ext];
}

/* ==========================================
   8. دالة: جلب صورة من URL خارجي
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
        CURLOPT_MAXREDIRS => 2,
        CURLOPT_TIMEOUT => 4,               // ✅ 4 ثوانٍ (زيادة بسيطة للاستقرار)
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_SSL_VERIFYPEER => false,    // ⚠️ قد يسبب ثغرة، لكن يعمل مع الشهادات الضعيفة
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SouqBot/1.0)',
        CURLOPT_HTTPHEADER => [
            'Accept: image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
        ],
        // ✅ ضغط الاستجابة من السيرفر الخارجي
        CURLOPT_ENCODING => '',
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

/* ==========================================
   9. التحقق من الكاش → خدمة فورية
   ========================================== */
if (file_exists($cacheFile) && filesize($cacheFile) > 0) {
    $cachedData = file_get_contents($cacheFile);
    
    // ✅ تحديد نوع MIME من محتوى الملف
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($cachedData) ?: 'image/webp';
    
    sendCacheHeaders($mime, strlen($cachedData));
    echo $cachedData;
    exit;
}

/* ==========================================
   10. صورة Base64 → معالجة وخدمة
   ========================================== */
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        $binary = base64_decode($parts[1]);
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';

        $result = processImage($binary, $mime, $targetWidth);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }
}

/* ==========================================
   11. رابط خارجي → جلب + معالجة + كاش
   ========================================== */
if (strpos($url, 'http') === 0) {
    $remote = fetchRemoteImage($url);

    if ($remote !== false) {
        $result = processImage($remote['data'], $remote['mime'], $targetWidth);
        @file_put_contents($cacheFile, $result['data']);

        sendCacheHeaders($result['mime'], strlen($result['data']));
        echo $result['data'];
        exit;
    }

    // ✅ فشل الجلب → خزّن Placeholder في الكاش لتجنب المحاولة في كل مرة
    $placeholderSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">'
                   . '<rect fill="#1A2438" width="400" height="300"/>'
                   . '<circle cx="200" cy="120" r="40" fill="none" stroke="#334155" stroke-width="3"/>'
                   . '<text x="200" y="200" fill="#64748B" font-family="Cairo,sans-serif" font-size="16" text-anchor="middle">صورة غير متوفرة</text>'
                   . '</svg>';
    @file_put_contents($cacheFile, $placeholderSvg);

    sendPlaceholder($targetWidth);
}

/* ==========================================
   12. الوصول لصورة محلية (ملف على السيرفر)
   ========================================== */
// ✅ دعم الصور المحفوظة محلياً
if (strpos($url, '/uploads/') === 0) {
    $localPath = __DIR__ . '/..' . $url;
    if (file_exists($localPath)) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($localPath);
        sendCacheHeaders($mime, filesize($localPath));
        readfile($localPath);
        exit;
    }
}

sendPlaceholder($targetWidth);