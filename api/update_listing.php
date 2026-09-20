<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);
$data = getInput();
$id = $data['id'] ?? '';
if (!$id) respond(['success' => false, 'error' => 'معرف مطلوب']);

$fields = [];
$values = [];

foreach ([
    'title',
    'description',
    'price',
    'status',
    'type',
    'purpose'
] as $field) {
    if (array_key_exists($field, $data)) {
        $fields[] = "$field = ?";
        $values[] = $data[$field];
    }
}

if (array_key_exists('featured', $data)) {
    $fields[] = 'is_featured = ?';
    $values[] = $data['featured'] ? 1 : 0;
}

if (!empty($fields)) {
    $values[] = $id;

    $sql = '
        UPDATE listings
        SET ' . implode(', ', $fields) . ',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ';

    $pdo->prepare($sql)->execute($values);
}


respond(['success' => true]);