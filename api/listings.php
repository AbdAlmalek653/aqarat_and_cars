<?php
require_once 'config.php';
require_once 'helpers.php';

// 📁 نظام الكاش
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) { mkdir($cacheDir, 0755, true); }

// 🔑 مفتاح الكاش حسب الفلاتر المستخدمة
$cacheKey = md5(json_encode($_GET));
$cacheFile = $cacheDir . '/listings_' . $cacheKey . '.json';
$cacheTime = 30; // كل 30 ثانية

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    $cached = json_decode(file_get_contents($cacheFile), true);
    if ($cached) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($cached, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 🏗️ بناء شروط البحث
$where = ['l.status = ?'];
$params = ['active'];

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

// ✅ استعلام واحد فقط لجلب الإعلانات + الصور (بدل 51 استعلام!)
$sql = '
    SELECT
        l.*,
        lo.name_ar AS city_name,
        lo.slug AS city_slug,
        GROUP_CONCAT(li.url ORDER BY li.sort_order SEPARATOR "|||") AS images_raw
    FROM listings l
    LEFT JOIN locations lo ON lo.id = l.location_id
    LEFT JOIN listing_images li ON li.listing_id = l.id
    WHERE ' . implode(' AND ', $where) . '
    GROUP BY l.id
    ORDER BY l.created_at DESC
    LIMIT ' . $limit;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();

// 🎨 معالجة البيانات في PHP فقط (بدون أي استعلام إضافي)
foreach ($listings as &$listing) {
    // فك ضغط الصور
    $images = [];
    if (!empty($listing['images_raw'])) {
        $images = explode('|||', $listing['images_raw']);
    }
    $listing['images'] = $images;
    unset($listing['images_raw']); // لا نحتاج إرسالها

    // معالجة التفاصيل
    $listing['details'] = json_decode($listing['details'] ?? '{}', true) ?: [];

    // تحويل الأنواع
    $listing['price'] = (float)$listing['price'];
    $listing['featured'] = (bool)$listing['is_featured'];
    $listing['views'] = (int)$listing['views'];
}

$response = [
    'success' => true,
    'listings' => $listings
];

// 💾 احفظ في الكاش
file_put_contents($cacheFile, json_encode($response, JSON_UNESCAPED_UNICODE));

// 📤 أرسل الرد
header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE);