<?php
/**
 * ==========================================
 * get_latest.php - جلب آخر الإعلانات (مع دعم Pagination)
 * الإصدار: 2.0 (موحّد + كاش + أداء صاروخي)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';
require_once 'cache.php'; // ✅ نظام الكاش الموحّد

// ==========================================
// إعدادات
// ==========================================
$limit = min(max((int)($_GET['limit'] ?? 10), 1), 50);
$lastDate = $_GET['last_date'] ?? null;
$type = $_GET['type'] ?? 'property'; // property | car

// التحقق من النوع
if (!in_array($type, ['property', 'car'], true)) {
    $type = 'property';
}

// ==========================================
// بناء مفتاح الكاش
// ==========================================
$cacheKeyData = [
    'type' => $type,
    'limit' => $limit,
    'last_date' => $lastDate ?? 'first',
];
$cacheKey = 'latest_' . md5(json_encode($cacheKeyData));

// ==========================================
// الكاش
// ==========================================
$cache = new SimpleCache(null, 60); // 60 ثانية

$data = $cache->remember($cacheKey, function() use ($pdo, $type, $limit, $lastDate) {

    // ==========================================
    // الاستعلام (Keyset Pagination - سريع جداً)
    // ==========================================
    if ($lastDate) {
        $sql = "
            SELECT id, title, price, currency, city, area, purpose, 
                   type, is_featured, created_at
            FROM listings
            WHERE type = ? AND status = 'active' AND created_at < ?
            ORDER BY created_at DESC
            LIMIT ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $type);
        $stmt->bindValue(2, $lastDate);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
    } else {
        $sql = "
            SELECT id, title, price, currency, city, area, purpose,
                   type, is_featured, created_at
            FROM listings
            WHERE type = ? AND status = 'active'
            ORDER BY created_at DESC
            LIMIT ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $type);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    }

    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // جلب علامة "هل يوجد صورة؟" فقط
    // ==========================================
    $listingIds = array_column($rows, 'id');
    $hasImageByListing = [];

    if (!empty($listingIds)) {
        $placeholders = implode(',', array_fill(0, count($listingIds), '?'));
        $imgStmt = $pdo->prepare(
            "SELECT DISTINCT listing_id FROM listing_images 
             WHERE listing_id IN ($placeholders)"
        );
        $imgStmt->execute($listingIds);
        foreach ($imgStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $hasImageByListing[$r['listing_id']] = true;
        }
    }

    // ==========================================
    // معالجة البيانات
    // ==========================================
    foreach ($rows as &$row) {
        $row['id'] = (string)$row['id'];
        $row['price'] = (float)$row['price'];
        $row['featured'] = (bool)$row['is_featured'];
        $row['images'] = !empty($hasImageByListing[$row['id']]) ? ['has_image'] : [];
        unset($row['is_featured']);
    }

    return $rows;
}, 60);

// ==========================================
// الرد النهائي
// ==========================================
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');
echo json_encode([
    'success' => true,
    'listings' => $data,
    'count' => count($data),
    'has_more' => count($data) === $limit
], JSON_UNESCAPED_UNICODE);