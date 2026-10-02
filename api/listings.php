<?php
/**
 * ==========================================
 * listings.php - جلب قائمة الإعلانات (النسخة النهائية)
 * الإصدار: 6.0 (بسيط + مستقل + متوافق مع SQLite)
 * ==========================================
 */

// ✅ الاتصال بقاعدة البيانات (config.php يعيد JSON عند الفشل)
require_once __DIR__ . '/config.php';

// ✅ إذا وصلنا هنا، $pdo موجود وسليم

header('Content-Type: application/json; charset=utf-8');

try {
    // ==========================================
    // 1. التحقق من الصلاحيات
    // ==========================================
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

    // ==========================================
    // 2. بناء شروط البحث
    // ==========================================
    $where = [];
    $params = [];

    // الإعلانات النشطة فقط للعامة
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
    if (!empty($_GET['city'])) {
        $where[] = 'l.city = ?';
        $params[] = $_GET['city'];
    }
    if (isset($_GET['featured']) && $_GET['featured'] == '1') {
        $where[] = 'l.is_featured = 1';
    }

    $limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);
    $whereSql = 'WHERE ' . implode(' AND ', $where);

    // ==========================================
    // 3. الاستعلام الرئيسي (متوافق مع SQLite)
    // ==========================================
    $sql = "
        SELECT 
            l.*,
            (SELECT COUNT(*) FROM listing_images WHERE listing_id = l.id) AS has_image_count
        FROM listings l
        $whereSql
        ORDER BY l.created_at DESC
        LIMIT $limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $listings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // 4. معالجة البيانات
    // ==========================================
    foreach ($listings as &$listing) {
        // ✅ علامة وجود صورة
        $listing['images'] = ($listing['has_image_count'] ?? 0) > 0 ? ['has_image'] : [];
        unset($listing['has_image_count']);

        // ✅ فك تشفير details
        if (isset($listing['details']) && is_string($listing['details'])) {
            $listing['details'] = json_decode($listing['details'], true) ?: [];
        } elseif (!isset($listing['details'])) {
            $listing['details'] = [];
        }

        // ✅ تحويل الأنواع
        $listing['price'] = (float)($listing['price'] ?? 0);
        $listing['featured'] = (bool)($listing['is_featured'] ?? false);
        $listing['views'] = (int)($listing['views'] ?? 0);

        // ✅ إخفاء رقم الواتساب (للأمان)
        unset($listing['whatsapp'], $listing['phone']);
        if (isset($listing['details']['whatsapp'])) unset($listing['details']['whatsapp']);
        if (isset($listing['details']['_whatsapp'])) unset($listing['details']['_whatsapp']);
        if (isset($listing['details']['phone'])) unset($listing['details']['phone']);
        if (isset($listing['details']['_phone'])) unset($listing['details']['_phone']);
    }

    // ==========================================
    // 5. الرد النهائي
    // ==========================================
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