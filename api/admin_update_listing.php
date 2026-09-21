<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);
$data = getInput();
$id = trim($data['id'] ?? '');

if (!$id) {
    respond(['success' => false, 'error' => 'معرف الإعلان مطلوب']);
}

$fields = [];
$values = [];

if (isset($data['status']) && in_array($data['status'], ['active', 'pending', 'sold', 'rented', 'rejected', 'expired'], true)) {
    $fields[] = 'status = ?';
    $values[] = $data['status'];
}

if (array_key_exists('featured', $data)) {
    $fields[] = 'is_featured = ?';
    $values[] = $data['featured'] ? 1 : 0;
}

if (!$fields) {
    respond(['success' => false, 'error' => 'لا توجد تغييرات صالحة']);
}

$values[] = $id;
$stmt = $pdo->prepare(
    'UPDATE listings SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);
$stmt->execute($values);

respond(['success' => true]);
