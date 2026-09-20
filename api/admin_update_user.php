<?php
require_once 'config.php';
require_once 'helpers.php';

$currentId = requireAdmin($pdo);
$data = getInput();
$id = trim($data['id'] ?? '');

$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$currentId]);
$current = $stmt->fetch();

if (!$current || $current['role'] !== 'super_admin') {
    respond(['success' => false, 'error' => 'هذه العملية متاحة للسوبر أدمن فقط']);
}

if (!$id || $id === $currentId) {
    respond(['success' => false, 'error' => 'لا يمكن تعديل هذا الحساب']);
}

$fields = [];
$values = [];

if (isset($data['role']) && in_array($data['role'], ['user', 'agent', 'admin', 'super_admin'], true)) {
    $fields[] = 'role = ?';
    $values[] = $data['role'];
}

if (array_key_exists('is_active', $data)) {
    $fields[] = 'is_active = ?';
    $values[] = $data['is_active'] ? 1 : 0;
}

if (!$fields) {
    respond(['success' => false, 'error' => 'لا توجد تغييرات صالحة']);
}

$values[] = $id;
$stmt = $pdo->prepare(
    'UPDATE users SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);
$stmt->execute($values);

respond(['success' => true]);
