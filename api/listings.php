<?php
require_once 'config.php';
require_once 'helpers.php';

// 📁 نظام الكاش
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) { mkdir($cacheDir, 0755, true); }

$cacheKey = md5(json_encode($_GET));
$cacheFile = $cacheDir . '/listings_' . $cacheKey . '.json';
$cacheTime = 30;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    $cached = json_decode(file_get_contents($cacheFile), true);
    if ($cached) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($cached, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 🏗️ بناء شروط البحث
$where = ["l.status IN ('active', 'pending')"];
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

// ✅ استعلام متوافق مع SQLite (بدون GROUP_CONCAT)
$sql = '
    SELECT
        l.*,
        lo.name_ar AS city_name,
        lo.slug AS city_slug
    FROM listings l
    LEFT JOIN locations lo ON lo.id = l.location_id
    WHERE ' . implode(' AND ', $where) . '
    ORDER BY l.created_at DESC
    LIMIT ' . $limit;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();

// 🖼️ جلب الصور لكل إعلان (بطريقة محسّنة)
$listingIds = array_column($listings, 'id');
$imagesByListing = [];

if (!empty($listingIds)) {
    $placeholders = implode(',', array_fill(0, count($listingIds), '?'));
    $imgStmt = $pdo->prepare(
        "SELECT listing_id, url FROM listing_images 
         WHERE listing_id IN ($placeholders) 
         ORDER BY listing_id, sort_order"
    );
    $imgStmt->execute($listingIds);
    $allImages = $imgStmt->fetchAll();
    
    foreach ($allImages as $img) {
        $imagesByListing[$img['listing_id']][] = $img['url'];
    }
}

// 🎨 معالجة البيانات
foreach ($listings as &$listing) {
    $listing['images'] = $imagesByListing[$listing['id']] ?? [];
    $listing['details'] = json_decode($listing['details'] ?? '{}', true) ?: [];
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