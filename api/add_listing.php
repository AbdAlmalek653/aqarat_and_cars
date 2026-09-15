<?php
require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$data = getInput();

foreach (['type', 'purpose', 'title', 'price', 'city'] as $f) {
    if (empty($data[$f])) respond(['success' => false, 'error' => "الحقل $f مطلوب"]);
}

$id = generateId('L');
$detailsArr = $data['details'] ?? [];
if (!empty($data['whatsapp'])) {
    $detailsArr['_whatsapp'] = $data['whatsapp'];
}
$details = json_encode($detailsArr, JSON_UNESCAPED_UNICODE);

$stmt = $pdo->prepare('
    INSERT INTO listings (id, user_id, type, purpose, title, description, price, currency, city, area, address, details, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")
');
$stmt->execute([
    $id, $userId, $data['type'], $data['purpose'], $data['title'],
    $data['description'] ?? '', (float)$data['price'], $data['currency'] ?? 'USD',
    $data['city'], $data['area'] ?? '', $data['address'] ?? '', $details
]);

if (!empty($data['images']) && is_array($data['images'])) {
    $uploadDir = __DIR__ . '/../uploads/listings/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $stmt = $pdo->prepare('INSERT INTO listing_images (listing_id, url, sort_order) VALUES (?, ?, ?)');
    foreach ($data['images'] as $i => $imgData) {
        if (preg_match('/^data:image\/(\w+);base64,/', $imgData, $m)) {
            $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
            $imgData = substr($imgData, strpos($imgData, ',') + 1);
            $filename = $id . '_' . $i . '.' . $ext;
            if (file_put_contents($uploadDir . $filename, base64_decode($imgData))) {
                $stmt->execute([$id, '../uploads/listings/' . $filename, $i]);
            }
        }
    }
}

respond(['success' => true, 'listing_id' => $id]);