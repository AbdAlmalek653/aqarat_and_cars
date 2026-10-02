<?php
/**
 * ==========================================
 * listing.php - جلب تفاصيل إعلان واحد
 * الإصدار: 4.0 (كاش + حماية أمنية + أداء صاروخي)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';
require_once 'cache.php'; // ✅ نظام الكاش

// 1. التحقق من معرف الإعلان
$id = $_GET['id'] ?? '';
if (!$id) {
    respond(['success' => false, 'error' => 'معرف الإعلان مطلوب']);
}

// 2. إنشاء نسخة الكاش (لمدة 5 دقائق)
$cache = new SimpleCache(null, 300);

// 3. ✅ جلب الإعلان من الكاش (أو من قاعدة البيانات إذا لم يوجد)
$cacheKey = "listing_detail_{$id}";

$listing = $cache->remember($cacheKey, function() use ($pdo, $id) {
    // الاستعلام الثقيل (يُنفّذ فقط إذا لم يوجد في الكاش)
    $stmt = $pdo->prepare('
        SELECT l.*, lo.name_ar AS city_name, lo.slug AS city_slug
        FROM listings l
        LEFT JOIN locations lo ON lo.id = l.location_id
        WHERE l.id = ?
    ');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) return null;
    
    // جلب عدد الصور فقط
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM listing_images WHERE listing_id = ?');
    $countStmt->execute([$id]);
    $imageCount = (int)$countStmt->fetchColumn();
    
    $images = [];
    for ($i = 0; $i < $imageCount; $i++) {
        $images[] = "has_image:$i";
    }
    $row['images'] = $images;
    
    // معالجة التفاصيل (JSON)
    $row['details'] = json_decode($row['details'] ?? '{}', true) ?: [];
    
    // ✅ حفظ رقم البائع الأصلي في حقل منفصل قبل التخزين في الكاش
    // (حتى نتمكن من عرضه للأدمن لاحقاً)
    $row['_seller_whatsapp_original'] = $row['whatsapp'] ?? '';
    
    return $row;
}, 300);

// 4. إذا لم يوجد الإعلان
if (!$listing) {
    respond(['success' => false, 'error' => 'الإعلان غير موجود']);
}

// 5. ✅ التحقق من صلاحيات المستخدم الحالي (لا يُخزّن في الكاش)
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

// 6. ✅ حماية رقم البائع — تُطبّق بعد قراءة الكاش
$sellerWhatsapp = $listing['_seller_whatsapp_original'] ?? ($listing['whatsapp'] ?? '');

// احذف الحقل المؤقت قبل إرسال الرد (لا نريد إرساله للمستخدم)
unset($listing['_seller_whatsapp_original']);

if (!$isAdmin) {
    // إخفاء رقم البائع من الحقل الرئيسي
    $listing['whatsapp'] = null;
    $listing['whatsapp_hidden'] = true;
    
    // إخفاء أي نسخة من الرقم في التفاصيل
    $hiddenKeys = ['whatsapp', '_whatsapp', 'phone', '_phone', 'mobile', '_mobile'];
    foreach ($hiddenKeys as $key) {
        if (isset($listing['details'][$key])) {
            unset($listing['details'][$key]);
        }
    }
} else {
    // ✅ الأدمن يرى الرقم
    $listing['whatsapp'] = $sellerWhatsapp;
    $listing['whatsapp_hidden'] = false;
}

// 7. تحويل الأنواع
$listing['price'] = (float)$listing['price'];
$listing['featured'] = (bool)$listing['is_featured'];
$listing['views'] = (int)($listing['views'] ?? 0);

// 8. ✅ زيادة عدد المشاهدات (لا يُخزّن في الكاش — يحدث في كل زيارة)
try {
    $pdo->prepare('UPDATE listings SET views = views + 1 WHERE id = ?')->execute([$id]);
    // زيادة عدد المشاهدات في الرد أيضاً ليعكس القيمة الحقيقية
    $listing['views'] = $listing['views'] + 1;
} catch (Throwable $e) {
    error_log('listing.php: failed to update views - ' . $e->getMessage());
}

// 9. الرد النهائي
respond([
    'success' => true,
    'listing' => $listing,
    'is_admin_view' => $isAdmin,
    'cached' => true // ✅ مؤشر أن الرد جاء من الكاش
]);