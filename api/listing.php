<?php
require_once 'config.php';
require_once 'helpers.php';

$id = $_GET['id'] ?? '';

if (!$id) {
    respond([
        'success' => false,
        'error' => 'معرف الإعلان مطلوب'
    ]);
}

$stmt = $pdo->prepare('
    SELECT
        l.*,
        lo.name_ar AS city_name,
        lo.slug AS city_slug
    FROM listings l
    LEFT JOIN locations lo ON lo.id = l.location_id
    WHERE l.id = ?
');

$stmt->execute([$id]);
$listing = $stmt->fetch();

if (!$listing) {
    respond([
        'success' => false,
        'error' => 'الإعلان غير موجود'
    ]);
}

$imageStmt = $pdo->prepare(
    'SELECT url FROM listing_images WHERE listing_id = ? ORDER BY sort_order'
);
$imageStmt->execute([$id]);

$listing['images'] = $imageStmt->fetchAll(PDO::FETCH_COLUMN);
$listing['details'] = json_decode(
    $listing['details'] ?? '{}',
    true
) ?: [];
$listing['price'] = (float)$listing['price'];
$listing['featured'] = (bool)$listing['is_featured'];

$pdo->prepare(
    'UPDATE listings SET views = views + 1 WHERE id = ?'
)->execute([$id]);

respond([
    'success' => true,
    'listing' => $listing
]);
