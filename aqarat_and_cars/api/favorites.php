<?php
require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$stmt = $pdo->prepare('SELECT listing_id FROM favorites WHERE user_id = ?');
$stmt->execute([$userId]);
respond(['success' => true, 'favorites' => $stmt->fetchAll(PDO::FETCH_COLUMN)]);