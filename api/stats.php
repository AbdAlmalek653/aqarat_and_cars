<?php
/**
 * ==========================================
 * stats.php - إحصائيات الصفحة الرئيسية
 * الإصدار: 3.0 (كاش موحّد + أداء صاروخي)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';
require_once 'cache.php'; // ✅ نظام الكاش الموحّد

// ==========================================
// إعدادات الكاش
// ==========================================
$cache = new SimpleCache(null, 60); // كاش لمدة 60 ثانية

// ==========================================
// جلب الإحصائيات (مع الكاش)
// ==========================================
$response = $cache->remember('home_stats_v1', function() use ($pdo) {
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

        return ['success' => true, 'stats' => $stats];
        
    } catch (Exception $e) {
        error_log('stats.php: ' . $e->getMessage());
        return ['success' => false, 'message' => 'خطأ في جلب البيانات'];
    }
}, 60);

// ==========================================
// الرد النهائي
// ==========================================
respond($response);