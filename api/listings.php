<?php
require_once 'config.php';
require_once 'helpers.php';

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

$imageStmt = $pdo->prepare(
    'SELECT url FROM listing_images WHERE listing_id = ? ORDER BY sort_order'
);

foreach ($listings as &$listing) {
    $imageStmt->execute([$listing['id']]);
    $listing['images'] = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

    $listing['details'] = json_decode(
        $listing['details'] ?? '{}',
        true
    ) ?: [];

    $listing['price'] = (float)$listing['price'];
    $listing['featured'] = (bool)$listing['is_featured'];
    $listing['views'] = (int)$listing['views'];
}

respond([
    'success' => true,
    'listings' => $listings
]);
