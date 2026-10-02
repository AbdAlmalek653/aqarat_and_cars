<?php
/**
 * ==========================================
 * listings.php - جلب قائمة الإعلانات
 * الإصدار: 4.0 (كاش + حماية أمنية + أداء صاروخي)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';
require_once 'cache.php'; // ✅ نظام الكاش

// ==========================================
// 1. التحقق من صلاحيات المستخدم (للأمان)
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
// 2. بناء مفتاح الكاش بناءً على الباراميترات فقط
// ==========================================
$cacheKeyData = [
    'type' => $_GET['type'] ?? '',
    'purpose' => $_GET['purpose'] ?? '',
    'city' => $_GET['city'] ?? '',
    'featured' => $_GET['featured'] ?? '',
    'limit' => $_GET['limit'] ?? 50,
    'is_admin' => $isAdmin ? 1 : 0, // ✅ كاش منفصل للأدمن
];
ksort($cacheKeyData); // ✅ ترتيب ثابت للمفاتيح
$cacheKey = 'listings_' . md5(json_encode($cacheKeyData));

// ==========================================
// 3. نظام الكاش (يُخزّن النتيجة الجاهزة)
// ==========================================
$cache = new SimpleCache(null, 30); // 30 ثانية (تحديث سريع)

$response = $cache->remember($cacheKey, function() use ($pdo, $isAdmin) {

    // ==========================================
    // 4. بناء شروط البحث
    // ==========================================
    // ✅ الإعلانات "active" فقط للعامة — الأدمن يرى pending أيضاً
    if ($isAdmin) {
        $where = ["l.status IN ('active', 'pending')"];
    } else {
        $where = ["l.status = 'active'"];
    }
    $params = [];

    if (!empty($_GET['type'])) {
        $where[] = 'l.type = ?';
        $params[] = $_GET['type'];
    }
    if (!empty($_GET['purpose'])) {
        $where[] = 'l.purpose = ?';
        $params[] = $_GET['purpose'];
    }
    if (!empty($_GET['city'])) {
        $where[] = 'lo.slug = ?';
        $params[] = $_GET['city'];
    }
    if (isset($_GET['featured']) && $_GET['featured'] == '1') {
        $where[] = 'l.is_featured = 1';
    }

    $limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);

    // ==========================================
    // 5. الاستعلام الرئيسي
    // ==========================================
    $sql = '
        SELECT
            l.id, l.type, l.purpose, l.title, l.price, l.currency,
            l.city, l.area, l.is_featured, l.status, l.views,
            l.created_at, l.details,
            lo.name_ar AS city_name,
            lo.slug AS city_slug
        FROM listings l
        LEFT JOIN locations lo ON lo.id = l.location_id
        WHERE ' . implode(' AND ', $where) . '
        ORDER BY l.created_at DESC
        LIMIT ' . $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $listings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // 6. جلب علامة "هل يوجد صورة؟" فقط
    // ==========================================
    $listingIds = array_column($listings, 'id');
    $hasImageByListing = [];

    if (!empty($listingIds)) {
        $placeholders = implode(',', array_fill(0, count($listingIds), '?'));
        $imgStmt = $pdo->prepare(
            "SELECT DISTINCT listing_id FROM listing_images 
             WHERE listing_id IN ($placeholders)"
        );
        $imgStmt->execute($listingIds);
        $allRows = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($allRows as $row) {
            $hasImageByListing[$row['listing_id']] = true;
        }
    }

    // ==========================================
    // 7. معالجة البيانات
    // ==========================================
    foreach ($listings as &$listing) {
        $listing['images'] = !empty($hasImageByListing[$listing['id']]) ? ['has_image'] : [];
        $listing['details'] = json_decode($listing['details'] ?? '{}', true) ?: [];
        $listing['price'] = (float)$listing['price'];
        $listing['featured'] = (bool)$listing['is_featured'];
        $listing['views'] = (int)$listing['views'];

        // ✅ في القوائم لا نرسل رقم الواتساب أبداً (لمنع التسرب)
        // الرقم يُطلب فقط في صفحة التفاصيل عبر listing.php
        unset($listing['whatsapp'], $listing['phone']);
        if (isset($listing['details']['whatsapp'])) unset($listing['details']['whatsapp']);
        if (isset($listing['details']['_whatsapp'])) unset($listing['details']['_whatsapp']);
        if (isset($listing['details']['phone'])) unset($listing['details']['phone']);
        if (isset($listing['details']['_phone'])) unset($listing['details']['_phone']);
    }

    return [
        'success' => true,
        'listings' => $listings,
        'count' => count($listings)
    ];
}, 30);

// ==========================================
// 8. الرد النهائي
// ==========================================
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=30'); // كاش المتصفح 30 ثانية
echo json_encode($response, JSON_UNESCAPED_UNICODE);