<?php
require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$data = getInput();
$listingId = $data['listing_id'] ?? '';
if (!$listingId) respond(['success' => false, 'error' => 'معرف مطلوب']);

$stmt = $pdo->prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?');
$stmt->execute([$userId, $listingId]);

if ($stmt->fetch()) {
    $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?')->execute([$userId, $listingId]);
    respond(['success' => true, 'isFavorite' => false]);
} else {
    $pdo->prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)')->execute([$userId, $listingId]);
    respond(['success' => true, 'isFavorite' => true]);
}