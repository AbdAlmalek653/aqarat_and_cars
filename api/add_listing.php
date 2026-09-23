<?php
require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$data = getInput();

foreach (['type', 'purpose', 'title', 'price', 'city'] as $field) {
    if (
        !isset($data[$field]) ||
        $data[$field] === ''
    ) {
        respond([
            'success' => false,
            'error' => "الحقل $field مطلوب"
        ]);
    }
}


$id = generateId('L');
$detailsArr = $data['details'] ?? [];
if (!empty($data['whatsapp'])) {
    $detailsArr['_whatsapp'] = $data['whatsapp'];
}
$details = json_encode($detailsArr, JSON_UNESCAPED_UNICODE);

$city = trim($data['city'] ?? '');

$locationStmt = $pdo->prepare(
    'SELECT id FROM locations WHERE slug = ? OR name_ar = ? LIMIT 1'
);
$locationStmt->execute([$city, $city]);
$location = $locationStmt->fetch();

if (!$location) {
    respond([
        'success' => false,
        'error' => 'المدينة غير موجودة'
    ]);
}

$locationId = $location['id'];

$stmt = $pdo->prepare('
    INSERT INTO listings (
        id,
        user_id,
        type,
        purpose,
        title,
        description,
        price,
        currency,
        location_id,
        area,
        address,
        details,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")
');

$stmt->execute([
    $id,
    $userId,
    $data['type'],
    $data['purpose'],
    $data['title'],
    $data['description'] ?? '',
    (float)$data['price'],
    $data['currency'] ?? 'USD',
    $locationId,
    $data['area'] ?? '',
    $data['address'] ?? '',
    $details
]);

$images = $data['images'] ?? [];
if (is_array($images) && count($images) > 0) {
    $imageStmt = $pdo->prepare(
        'INSERT INTO listing_images (listing_id, url, sort_order) VALUES (?, ?, ?)'
    );
    foreach ($images as $sortOrder => $imageUrl) {
        if (!is_string($imageUrl) || trim($imageUrl) === '') {
            continue;
        }
        $imageStmt->execute([$id, $imageUrl, (int)$sortOrder]);
    }
}

respond([
    'success' => true,
    'listing' => [
        'id' => $id,
        'userId' => $userId,
        'type' => $data['type'],
        'purpose' => $data['purpose'],
        'title' => $data['title']
    ]
]);
