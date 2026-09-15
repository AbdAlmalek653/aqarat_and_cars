<?php
require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$stmt = $pdo->prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC');
$stmt->execute([$userId]);
$listings = $stmt->fetchAll();

foreach ($listings as &$l) {
    $l['details'] = json_decode($l['details'] ?? '{}', true);
    $l['price'] = (float)$l['price'];
}

respond(['success' => true, 'listings' => $listings]);