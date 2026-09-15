<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);
$data = getInput();
$id = $data['id'] ?? '';
if (!$id) respond(['success' => false, 'error' => 'معرف مطلوب']);

$fields = []; $values = [];
foreach (['title', 'description', 'price', 'status', 'featured', 'type', 'purpose'] as $f) {
    if (isset($data[$f])) { $fields[] = "$f = ?"; $values[] = $data[$f]; }
}

if (!empty($fields)) {
    $values[] = $id;
    $pdo->prepare('UPDATE listings SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?')->execute($values);
}

respond(['success' => true]);