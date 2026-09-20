<?php
require_once 'config.php';
require_once 'helpers.php';

$id = $_GET['id'] ?? '';
if (!$id) respond(['success' => false, 'error' => 'معرف مطلوب']);

$stmt = $pdo->prepare('SELECT * FROM listings WHERE id = ?');
$stmt->execute([$id]);
$listing = $stmt->fetch();

if (!$listing) respond(['success' => false, 'error' => 'الإعلان غير موجود']);

$stmt = $pdo->prepare('SELECT url FROM listing_images WHERE listing_id = ? ORDER BY sort_order');
$stmt->execute([$id]);
$listing['images'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
$listing['details'] = json_decode($listing['details'] ?? '{}', true);
$listing['price'] = (float)$listing['price'];
$listing['featured'] = (bool)$listing['featured'];

$pdo->prepare('UPDATE listings SET views = views + 1 WHERE id = ?')->execute([$id]);

respond(['success' => true, 'listing' => $listing]);