<?php
// ✅ ارفع حد الذاكرة والوقت لمعالجة الصور الكبيرة
@ini_set('memory_limit', '256M');
@set_time_limit(60);

require_once 'config.php';

$id = $_GET['id'] ?? '';
if (!$id) {
    http_response_code(404);
    exit;
}

// 📁 مجلد الكاش للصور المضغوطة
$cacheDir = __DIR__ . '/cache/images';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $id);
$cacheFile = $cacheDir . '/' . $safeId . '.jpg';

// ✅ إذا الصورة المضغوطة موجودة → قدّمها فوراً
if (file_exists($cacheFile) && filesize($cacheFile) > 0) {
    header('Content-Type: image/jpeg');
    header('Cache-Control: public, max-age=2592000');
    header('Content-Length: ' . filesize($cacheFile));
    readfile($cacheFile);
    exit;
}

// 📥 جلب الصورة من قاعدة البيانات
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
$imageData = null;
$mime = 'image/jpeg';

// فك Base64
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';
        $imageData = base64_decode($parts[1]);
    }
} elseif (strpos($url, 'http') === 0 || strpos($url, '/') === 0) {
    header('Location: ' . $url, true, 302);
    exit;
} else {
    $filePath = __DIR__ . '/../' . ltrim($url, '/');
    if (file_exists($filePath)) {
        $imageData = file_get_contents($filePath);
        $mime = mime_content_type($filePath) ?: 'image/jpeg';
    }
}

if (!$imageData) {
    http_response_code(404);
    exit;
}

// ✅ الضغط
$compressed = null;

if (extension_loaded('gd')) {
    $original = @imagecreatefromstring($imageData);

    if ($original !== false) {
        $width = imagesx($original);
        $height = imagesy($original);

        // تصغير إلى 600 بكسل
        $maxWidth = 600;
        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int)(($height / $width) * $newWidth);

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled(
                $resized, $original,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $width, $height
            );
            imagedestroy($original);
            $original = $resized;
        }

        // ضغط بجودة 60%
        ob_start();
        imagejpeg($original, null, 60);
        $compressed = ob_get_clean();
        imagedestroy($original);

        // استخدم الصورة المضغوطة فقط إذا كانت أصغر
        if ($compressed && strlen($compressed) < strlen($imageData)) {
            $imageData = $compressed;
            $mime = 'image/jpeg';
        }
    }
}

// 💾 احفظ في الكاش (فقط إذا الضغط نجح وصار JPEG)
if ($compressed && $mime === 'image/jpeg') {
    @file_put_contents($cacheFile, $imageData);
}

// 📤 أرسل الصورة
header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=2592000');
header('Content-Length: ' . strlen($imageData));
echo $imageData;