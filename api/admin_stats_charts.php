<?php
/**
 * API: إحصائيات لوحة التحكم (Chart.js)
 * GET /api/admin_stats_charts.php
 * 
 * يُرجع كل البيانات المطلوبة للرسوم البيانية
 */

require_once 'config.php';
require_once 'helpers.php';

// ✅ للأدمن فقط
requireAdmin($pdo);

try {
    /* ==========================================
       1. الإعلانات المُضافة يومياً (آخر 30 يوم)
       ========================================== */
    $stmt = $pdo->query("
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
        FROM listings
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $dailyListings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ==========================================
       2. توزيع العقارات vs السيارات
       ========================================== */
    $stmt = $pdo->query("
        SELECT 
            type,
            COUNT(*) as count
        FROM listings
        GROUP BY type
    ");
    $typeDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ==========================================
       3. أكثر 10 محافظات نشاطاً
       ========================================== */
    $stmt = $pdo->query("
        SELECT 
            city,
            COUNT(*) as count
        FROM listings
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city
        ORDER BY count DESC
        LIMIT 10
    ");
    $topCities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ==========================================
       4. أكثر 10 إعلانات مشاهدة
       ========================================== */
    $stmt = $pdo->query("
        SELECT 
            title,
            COALESCE(views, 0) as views
        FROM listings
        WHERE views > 0
        ORDER BY views DESC
        LIMIT 10
    ");
    $topViewed = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ==========================================
       5. المستخدمون الجدد أسبوعياً (آخر 8 أسابيع)
       ========================================== */
    $stmt = $pdo->query("
        SELECT 
            strftime('%Y-%W', created_at) as week,
            COUNT(*) as count
        FROM users
        WHERE created_at >= DATE('now', '-56 days')
        GROUP BY strftime('%Y-%W', created_at)
        ORDER BY week ASC
    ");
    $weeklyUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ==========================================
       6. توزيع حالات الإعلانات
       ========================================== */
    $stmt = $pdo->query("
        SELECT 
            COALESCE(status, 'active') as status,
            COUNT(*) as count
        FROM listings
        GROUP BY status
    ");
    $statusDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* ==========================================
       الإحصائيات العامة
       ========================================== */
    $stmt = $pdo->query("SELECT COUNT(*) FROM listings");
    $totalListings = (int)$stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $totalUsers = (int)$stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COALESCE(SUM(views), 0) FROM listings");
    $totalViews = (int)$stmt->fetchColumn();

    $stmt = $pdo->query("
        SELECT COALESCE(AVG(price), 0) 
        FROM listings 
        WHERE purpose = 'sale' AND price > 0
    ");
    $avgSalePrice = (float)$stmt->fetchColumn();

    /* ==========================================
       الرد
       ========================================== */
    respond([
        'success' => true,
        'summary' => [
            'total_listings' => $totalListings,
            'total_users' => $totalUsers,
            'total_views' => $totalViews,
            'avg_sale_price' => $avgSalePrice
        ],
        'daily_listings' => $dailyListings,
        'type_distribution' => $typeDistribution,
        'top_cities' => $topCities,
        'top_viewed' => $topViewed,
        'weekly_users' => $weeklyUsers,
        'status_distribution' => $statusDistribution,
        'generated_at' => date('Y-m-d H:i:s')
    ]);

} catch (Throwable $e) {
    error_log('admin_stats_charts.php error: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'خطأ في جلب الإحصائيات']);
}