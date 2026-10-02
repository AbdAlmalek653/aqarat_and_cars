<?php
require_once 'config.php';
require_once 'helpers.php';

// 📁 مسار ملف التخزين المؤقت
$cacheFile = __DIR__ . '/cache_stats.json';
$cacheTime = 60; // ثانية (كل دقيقة يتم تحديث البيانات)

// ✅ إذا كان الملف موجوداً وحديثاً، استخدم البيانات المخزنة (فوري: 1ms)
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    $cachedData = json_decode(file_get_contents($cacheFile), true);
    if ($cachedData) {
        respond($cachedData);
        exit;
    }
}

// 🔄 إذا انتهت مدة الكاش، اجلب من قاعدة البيانات مرة واحدة
try {
    $sql = "
        SELECT 
            (SELECT COUNT(*) FROM users WHERE is_active = 1) AS users,
            (SELECT COUNT(*) FROM listings WHERE status = 'active') AS listings,
            (SELECT COUNT(*) FROM listings WHERE type = 'property' AND status = 'active') AS properties,
            (SELECT COUNT(*) FROM listings WHERE type = 'car' AND status = 'active') AS cars
    ";
    
    $result = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);

    $stats = [
        'users' => (int)($result['users'] ?? 0),
        'listings' => (int)($result['listings'] ?? 0),
        'properties' => (int)($result['properties'] ?? 0),
        'cars' => (int)($result['cars'] ?? 0),
    ];

    $response = ['success' => true, 'stats' => $stats];
    
    // 💾 احفظ في ملف الكاش للمرة القادمة
    file_put_contents($cacheFile, json_encode($response));
    
    respond($response);
    
} catch (Exception $e) {
    respond(['success' => false, 'message' => 'خطأ في جلب البيانات']);
}