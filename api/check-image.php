<?php
/**
 * check-image.php - ملف تشخيص مؤقت
 * احذفه بعد ما تخلص!
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

$listingId = $_GET['id'] ?? 'L1790922893513627';

echo "<h2>تشخيص الصور للإعلان: $listingId</h2>";
echo "<hr>";

// 1. جلب الصور من قاعدة البيانات
$stmt = $pdo->prepare("SELECT id, url, sort_order FROM listing_images WHERE listing_id = ? ORDER BY sort_order LIMIT 5");
$stmt->execute([$listingId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    echo "<p style='color:red;'>❌ لا توجد صور لهذا الإعلان</p>";
    exit;
}

echo "<h3>📊 عدد الصور: " . count($rows) . "</h3>";

foreach ($rows as $i => $row) {
    $url = $row['url'];
    $urlLength = strlen($url);
    $preview = substr($url, 0, 80);
    
    // تحديد نوع الصورة
    $type = '❓ غير معروف';
    $sizeInfo = '';
    
    if (strpos($url, 'data:image/') === 0) {
        $type = '📷 Base64 (محفوظة في DB)';
        // فك التشفير لمعرفة الحجم الفعلي
        $parts = explode(',', $url, 2);
        if (count($parts) === 2) {
            $binary = base64_decode($parts[1]);
            $binarySize = strlen($binary);
            $sizeInfo = "حجم الصورة الفعلي: " . round($binarySize / 1024, 2) . " KB";
            
            // حاول تجيب الأبعاد
            $img = @imagecreatefromstring($binary);
            if ($img) {
                $w = imagesx($img);
                $h = imagesy($img);
                $sizeInfo .= " | الأبعاد: {$w}×{$h}";
                
                // تحقق من الحجم
                if ($w < 800) {
                    $sizeInfo .= " <span style='color:red;'>⚠️ صغيرة جداً!</span>";
                } elseif ($w >= 1200) {
                    $sizeInfo .= " <span style='color:green;'>✅ ممتازة</span>";
                }
                imagedestroy($img);
            }
        }
    } elseif (strpos($url, 'http') === 0) {
        $type = '🌐 رابط خارجي';
    } elseif (strpos($url, '/uploads/') === 0) {
        $type = '📁 ملف محلي';
    }
    
    echo "<div style='background:#f5f5f5;padding:15px;margin:10px 0;border-radius:8px;border-right:4px solid #3B82F6;'>";
    echo "<strong>صورة #" . ($i + 1) . "</strong> (sort_order: {$row['sort_order']})<br>";
    echo "النوع: <strong>$type</strong><br>";
    echo "طول النص في DB: <strong>" . number_format($urlLength) . " حرف</strong><br>";
    if ($sizeInfo) echo "<span style='color:#059669;'>$sizeInfo</span><br>";
    echo "<details><summary>عرض بداية الـ URL</summary><code style='font-size:11px;'>" . htmlspecialchars($preview) . "...</code></details>";
    echo "</div>";
}

// 2. معلومات الكاش
echo "<hr>";
echo "<h3>🗂️ معلومات الكاش</h3>";
$cacheDir = __DIR__ . '/cache/images';
if (is_dir($cacheDir)) {
    $files = glob($cacheDir . '/*.webp');
    $totalSize = 0;
    foreach ($files as $f) $totalSize += filesize($f);
    echo "<p>عدد الملفات في الكاش: <strong>" . count($files) . "</strong></p>";
    echo "<p>الحجم الإجمالي: <strong>" . round($totalSize / 1024 / 1024, 2) . " MB</strong></p>";
    
    // جرب صور لهذا الإعلان تحديداً
    echo "<h4>صور هذا الإعلان في الكاش:</h4>";
    $foundInCache = 0;
    foreach ($files as $f) {
        $fileName = basename($f, '.webp');
        // نبحث عن الصور المرتبطة (ما نقدر نعرف مباشرة، بس نحاول)
    }
    
    // اختبر cacheKey الفعلي
    foreach ($rows as $i => $row) {
        $url = $row['url'];
        $targetWidth = 1600;
        $cacheKey = md5($url . '_' . $targetWidth . '_v4');
        $cacheFile = $cacheDir . '/' . $cacheKey . '.webp';
        if (file_exists($cacheFile)) {
            echo "<p>✅ صورة #" . ($i+1) . " موجودة في الكاش | الحجم: " . round(filesize($cacheFile)/1024, 2) . " KB</p>";
            $foundInCache++;
        } else {
            echo "<p>❌ صورة #" . ($i+1) . " غير موجودة في الكاش</p>";
        }
    }
    if ($foundInCache === 0) {
        echo "<p style='color:orange;'>⚠️ الكاش فارغ - الصور تُعالج مباشرة من DB</p>";
    }
} else {
    echo "<p>مجلد الكاش غير موجود</p>";
}

echo "<hr>";
echo "<p style='color:red;'><strong>⚠️ احذف هذا الملف بعد التشخيص!</strong></p>";