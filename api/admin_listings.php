<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);

$status = $_GET['status'] ?? '';
$params = [];
$where = '';

if (in_array($status, ['active', 'pending', 'sold', 'rented', 'rejected', 'expired'], true)) {
    $where = 'WHERE l.status = ?';
    $params[] = $status;
}

$stmt = $pdo->prepare(
    'SELECT l.*, u.name AS owner_name, u.email AS owner_email,
            lo.name_ar AS city_name
     FROM listings l
     LEFT JOIN users u ON u.id = l.user_id
     LEFT JOIN locations lo ON lo.id = l.location_id
     ' . $where . '
     ORDER BY l.created_at DESC
     LIMIT 200'
);
$stmt->execute($params);
$listings = $stmt->fetchAll();

foreach ($listings as &$listing) {
    $listing['price'] = (float)$listing['price'];
    $listing['views'] = (int)$listing['views'];
    $listing['is_featured'] = (bool)$listing['is_featured'];
    $listing['details'] = json_decode($listing['details'] ?? '{}', true) ?: [];
}

respond(['success' => true, 'listings' => $listings]);
