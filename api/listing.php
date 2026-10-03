<?php
/**
 * ==========================================
 * listing.php - جلب تفاصيل إعلان واحد
 * الإصدار: 5.0 (negotiable + city + views)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';
require_once 'cache.php';

// 1. التحقق من معرف الإعلان
$id = $_GET['id'] ?? '';
if (!$id) {
    respond(['success' => false, 'error' => 'معرف الإعلان مطلوب']);
}

// 2. إنشاء نسخة الكاش
$cache = new SimpleCache(null, 300);
$cacheKey = "listing_detail_{$id}";

// 3. جلب من الكاش أو من DB
$listing = $cache->remember($cacheKey, function() use ($pdo, $id) {
    $stmt = $pdo->prepare('
        SELECT l.*, lo.name_ar AS city_name, lo.slug AS city_slug
        FROM listings l
        LEFT JOIN locations lo ON lo.id = l.location_id
        WHERE l.id = ?
    ');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) return null;

    // جلب عدد الصور
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM listing_images WHERE listing_id = ?');
    $countStmt->execute([$id]);
    $imageCount = (int)$countStmt->fetchColumn();

    $images = [];
    for ($i = 0; $i < $imageCount; $i++) {
        $images[] = "has_image:$i";
    }
    $row['images'] = $images;

    // فك تشفير التفاصيل
    $row['details'] = json_decode($row['details'] ?? '{}', true) ?: [];

    // حفظ رقم البائع الأصلي
    $row['_seller_whatsapp_original'] = $row['whatsapp'] ?? '';

    return $row;
}, 300);

// 4. إذا لم يوجد الإعلان
if (!$listing) {
    respond(['success' => false, 'error' => 'الإعلان غير موجود']);
}

// 5. ✅ نقل "negotiable" من details للـ root (للعرض في الواجهة)
if (!empty($listing['details']['negotiable'])) {
    $listing['negotiable'] = $listing['details']['negotiable'];
}

// 6. ✅ نقل "subType" من details للـ root (إن وُجد)
if (empty($listing['subType']) && !empty($listing['details']['subType'])) {
    $listing['subType'] = $listing['details']['subType'];
}

// 7. التحقق من صلاحيات المستخدم
$currentUser = null;
$isAdmin = false;

if (isset($_SESSION['user_id'])) {
    try {
        $userStmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
        $userStmt->execute([$_SESSION['user_id']]);
        $currentUser = $userStmt->fetch(PDO::FETCH_ASSOC);

        if ($currentUser) {
            $isAdmin = in_array($currentUser['role'], ['admin', 'super_admin'], true);
        }
    } catch (Throwable $e) {
        error_log('listing.php: failed to load user - ' . $e->getMessage());
    }
}

// 8. حماية رقم البائع
$sellerWhatsapp = $listing['_seller_whatsapp_original'] ?? ($listing['whatsapp'] ?? '');
unset($listing['_seller_whatsapp_original']);

if (!$isAdmin) {
    $listing['whatsapp'] = null;
    $listing['whatsapp_hidden'] = true;

    $hiddenKeys = ['whatsapp', '_whatsapp', 'phone', '_phone', 'mobile', '_mobile'];
    foreach ($hiddenKeys as $key) {
        if (isset($listing['details'][$key])) {
            unset($listing['details'][$key]);
        }
    }
} else {
    $listing['whatsapp'] = $sellerWhatsapp;
    $listing['whatsapp_hidden'] = false;
}

// 9. تحويل الأنواع
$listing['price'] = (float)$listing['price'];
$listing['featured'] = (bool)$listing['is_featured'];
$listing['views'] = (int)($listing['views'] ?? 0);

// 10. زيادة عدد المشاهدات
try {
    $pdo->prepare('UPDATE listings SET views = views + 1 WHERE id = ?')->execute([$id]);
    $listing['views'] = $listing['views'] + 1;
} catch (Throwable $e) {
    error_log('listing.php: failed to update views - ' . $e->getMessage());
}

// 11. الرد النهائي
respond([
    'success' => true,
    'listing' => $listing,
    'is_admin_view' => $isAdmin,
    'cached' => true
]);