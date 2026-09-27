<?php
/**
 * تقديم صورة الإعلان الأولى مباشرة
 * مع ضغط تلقائي للصور الكبيرة
 */

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
$imageData = null;
$mime = 'image/jpeg';

// ✅ فك Base64 أو قراءة ملف
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

// ✅ ضغط تلقائي إذا كانت الصورة أكبر من 100 kB
if (strlen($imageData) > 100000 && extension_loaded('gd')) {
    $original = @imagecreatefromstring($imageData);

    if ($original !== false) {
        $width = imagesx($original);
        $height = imagesy($original);

        // تصغير إلى 800 بكسل عرض كحد أقصى
        $maxWidth = 800;
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

        // ضغط بجودة 75%
        ob_start();
        imagejpeg($original, null, 75);
        $compressed = ob_get_clean();
        imagedestroy($original);

        if ($compressed && strlen($compressed) < strlen($imageData)) {
            $imageData = $compressed;
            $mime = 'image/jpeg';
        }
    }
}

// ✅ أرسل الصورة مع كاش 30 يوم
header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=2592000');
header('Content-Length: ' . strlen($imageData));
echo $imageData;