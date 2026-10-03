<?php
/**
 * ==========================================
 * listings.php - جلب قائمة الإعلانات
 * الإصدار: 7.0 (JOIN مع locations + negotiable)
 * ==========================================
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. التحقق من الصلاحيات
    $isAdmin = false;
    if (isset($_SESSION['user_id'])) {
        try {
            $userStmt = $pdo->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
            $userStmt->execute([$_SESSION['user_id']]);
            $role = $userStmt->fetchColumn();
            $isAdmin = in_array($role, ['admin', 'super_admin'], true);
        } catch (Throwable $e) {
            error_log('listings.php: user check failed - ' . $e->getMessage());
        }
    }

    // 2. بناء شروط البحث
    $where = [];
    $params = [];

    if ($isAdmin) {
        $where[] = "l.status IN ('active', 'pending')";
    } else {
        $where[] = "l.status = 'active'";
    }

    if (!empty($_GET['type'])) {
        $where[] = 'l.type = ?';
        $params[] = $_GET['type'];
    }
    if (!empty($_GET['purpose'])) {
        $where[] = 'l.purpose = ?';
        $params[] = $_GET['purpose'];
    }
    // ✅ دعم الفلترة بالمحافظة (slug أو name_ar)
    if (!empty($_GET['city'])) {
        $where[] = '(loc.slug = ? OR loc.name_ar = ?)';
        $params[] = $_GET['city'];
        $params[] = $_GET['city'];
    }
    if (isset($_GET['featured']) && $_GET['featured'] == '1') {
        $where[] = 'l.is_featured = 1';
    }

    $limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);
    $whereSql = 'WHERE ' . implode(' AND ', $where);

    // 3. الاستعلام الرئيسي مع JOIN
    $sql = "
        SELECT 
            l.*,
            loc.slug AS city_slug,
            loc.name_ar AS city_name,
            (SELECT COUNT(*) FROM listing_images WHERE listing_id = l.id) AS has_image_count
        FROM listings l
        LEFT JOIN locations loc ON l.location_id = loc.id
        $whereSql
        ORDER BY l.created_at DESC
        LIMIT $limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $listings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. معالجة البيانات
    foreach ($listings as &$listing) {
        $listing['images'] = ($listing['has_image_count'] ?? 0) > 0 ? ['has_image'] : [];
        unset($listing['has_image_count']);

        if (isset($listing['details']) && is_string($listing['details'])) {
            $listing['details'] = json_decode($listing['details'], true) ?: [];
        } elseif (!isset($listing['details'])) {
            $listing['details'] = [];
        }

        // ✅ نقل negotiable من details للـ root (عشان الـ frontend)
        if (isset($listing['details']['negotiable'])) {
            $listing['negotiable'] = $listing['details']['negotiable'];
        }

        // ✅ تحويل الأنواع
        $listing['price'] = (float)($listing['price'] ?? 0);
        $listing['featured'] = (bool)($listing['is_featured'] ?? false);
        $listing['views'] = (int)($listing['views'] ?? 0);

        // ✅ إخفاء أرقام الواتساب
        unset($listing['whatsapp'], $listing['phone']);
        if (isset($listing['details']['whatsapp'])) unset($listing['details']['whatsapp']);
        if (isset($listing['details']['_whatsapp'])) unset($listing['details']['_whatsapp']);
        if (isset($listing['details']['phone'])) unset($listing['details']['phone']);
        if (isset($listing['details']['_phone'])) unset($listing['details']['_phone']);
    }

    echo json_encode([
        'success' => true,
        'listings' => $listings,
        'count' => count($listings)
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('listings.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'خطأ في جلب البيانات: ' . $e->getMessage(),
        'listings' => [],
        'count' => 0
    ], JSON_UNESCAPED_UNICODE);
}