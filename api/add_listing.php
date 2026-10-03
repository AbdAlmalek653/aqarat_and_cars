<?php
/**
 * ==========================================
 * add_listing.php - إضافة إعلان جديد
 * الإصدار: 5.0 (يحفظ negotiable + subType)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$data = getInput();

// ==========================================
// 1. التحقق من الحقول المطلوبة
// ==========================================
foreach (['type', 'purpose', 'title', 'price', 'city'] as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        respond([
            'success' => false,
            'error' => "الحقل $field مطلوب"
        ]);
    }
}

// ==========================================
// 2. تحضير البيانات
// ==========================================
$id = generateId('L');
$detailsArr = $data['details'] ?? [];
if (!is_array($detailsArr)) {
    $detailsArr = [];
}

// ✅ حفظ رقم الواتساب في details (للأدمن)
if (!empty($data['whatsapp'])) {
    $detailsArr['_whatsapp'] = $data['whatsapp'];
}

// ✅ حفظ "قابل للتفاوض" في details (مهم!)
if (!empty($data['negotiable'])) {
    $detailsArr['negotiable'] = $data['negotiable'];
}

// ✅ حفظ subType في details
if (!empty($data['subType'])) {
    $detailsArr['subType'] = $data['subType'];
}

// ✅ دمج أي حقول إضافية من الجذر في details
foreach (['rentPeriod', 'deposit'] as $extraField) {
    if (!empty($data[$extraField])) {
        $detailsArr[$extraField] = $data[$extraField];
    }
}

$details = json_encode($detailsArr, JSON_UNESCAPED_UNICODE);

$city = trim($data['city'] ?? '');

// ==========================================
// 3. البحث عن المدينة
// ==========================================
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

// ==========================================
// 4. إدخال الإعلان في قاعدة البيانات
// ==========================================
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

// ==========================================
// 5. إدخال الصور
// ==========================================
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

// ==========================================
// 6. مسح الكاش
// ==========================================
try {
    require_once 'cache.php';
    if (class_exists('SimpleCache')) {
        $cache = new SimpleCache();
        $cache->flush();
    }
} catch (Throwable $e) {
    error_log('add_listing: cache flush failed - ' . $e->getMessage());
}

// ==========================================
// 7. الرد النهائي
// ==========================================
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