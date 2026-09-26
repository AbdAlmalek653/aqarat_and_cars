<?php
require_once 'config.php';
require_once 'helpers.php';

// الأدمن والسوبر أدمن يستطيعان إدارة جميع الإعلانات
requireAdmin($pdo);
$data = getInput();
$id = trim((string)($data['id'] ?? ''));

if (!$id) {
    respond(['success' => false, 'error' => 'معرف الإعلان مطلوب']);
}

$allowed = [
    'title' => function ($value) { return trim((string)$value); },
    'description' => function ($value) { return trim((string)$value); },
    'price' => function ($value) { return is_numeric($value) ? (float)$value : null; },
    'currency' => function ($value) { return trim((string)$value); },
    'area' => function ($value) { return trim((string)$value); },
    'address' => function ($value) { return trim((string)$value); },
    'status' => function ($value) {
        $valid = ['active', 'pending', 'sold', 'rented', 'rejected', 'expired'];
        return in_array($value, $valid, true) ? $value : null;
    },
];

$fields = [];
$values = [];

foreach ($allowed as $field => $normalizer) {
    if (array_key_exists($field, $data)) {
        $value = $normalizer($data[$field]);
        if ($value === null || ($field === 'title' && $value === '')) {
            respond(['success' => false, 'error' => "قيمة الحقل {$field} غير صالحة"]);
        }
        $fields[] = $field . ' = ?';
        $values[] = $value;
    }
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
    'UPDATE listings SET ' . implode(', ', $fields) .
    ', updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);
$stmt->execute($values);

if ($stmt->rowCount() === 0) {
    $check = $pdo->prepare('SELECT id FROM listings WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) {
        respond(['success' => false, 'error' => 'الإعلان غير موجود']);
    }
}

respond(['success' => true, 'message' => 'تم تحديث الإعلان']);
