<?php
/**
 * clear-cache.php - ملف مؤقت لمسح الكاش
 * ⚠️ احذف هذا الملف بعد الاستخدام مباشرة!
 */

// حماية بسيطة بكلمة سر
$SECRET = 'souq-clear-2026';
if (($_GET['key'] ?? '') !== $SECRET) {
    http_response_code(403);
    die('❌ Unauthorized - غير مصرح');
}

$cacheDir = __DIR__ . '/cache/images';

echo "<!DOCTYPE html><html dir='rtl'><head><meta charset='UTF-8'><title>مسح الكاش</title>";
echo "<style>body{font-family:Arial;padding:40px;background:#0f172a;color:#fff;text-align:center;}";
echo "h1{color:#3B82F6;} .success{color:#10B981;} .error{color:#EF4444;}";
echo ".box{background:#1e293b;padding:30px;border-radius:15px;max-width:600px;margin:0 auto;}</style></head><body>";

echo "<div class='box'>";

if (!is_dir($cacheDir)) {
    echo "<h1>ℹ️ المجلد غير موجود</h1>";
    echo "<p>لا يوجد كاش لمسحه - الموقع نظيف ✅</p>";
    echo "</div></body></html>";
    exit;
}

// جلب كل الملفات
$files = glob($cacheDir . '/*');
$count = 0;
$size = 0;
$errors = 0;

echo "<h1>🗑️ مسح الكاش</h1>";

foreach ($files as $file) {
    if (is_file($file)) {
        $size += filesize($file);
        if (@unlink($file)) {
            $count++;
        } else {
            $errors++;
        }
    }
}

echo "<p class='success'>✅ تم مسح الكاش بنجاح!</p>";
echo "<hr style='border-color:#334155;margin:20px 0;'>";
echo "<p><strong>📁 عدد الملفات المحذوفة:</strong> <span class='success'>$count</span></p>";
echo "<p><strong>💾 الحجم المحرر:</strong> <span class='success'>" . round($size / 1024 / 1024, 2) . " MB</span></p>";

if ($errors > 0) {
    echo "<p class='error'>⚠️ فشل حذف $errors ملف</p>";
}

echo "<hr style='border-color:#334155;margin:20px 0;'>";
echo "<p style='color:#F59E0B;'><strong>⚠️ مهم:</strong> احذف هذا الملف الآن من السيرفر!</p>";
echo "<p style='font-size:12px;color:#64748B;'>الملف: api/clear-cache.php</p>";

echo "</div></body></html>";