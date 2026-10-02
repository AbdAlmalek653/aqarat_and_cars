<?php
/**
 * ==========================================
 * listing.php - جلب تفاصيل إعلان واحد
 * الإصدار: 2.0 (مع حماية أمنية لرقم البائع)
 * ==========================================
 * 
 * ✨ الحمايات المطبقة:
 * 1. إخفاء رقم واتساب البائع عن المستخدمين العاديين (فقط للأدمن)
 * 2. التحقق من صلاحيات المستخدم الحالي
 * 3. منع تسرب رقم البائع في أي حقل آخر
 */

require_once 'config.php';
require_once 'helpers.php';

/* ==========================================
   1. التحقق من معرف الإعلان
   ========================================== */
$id = $_GET['id'] ?? '';

if (!$id) {
    respond([
        'success' => false,
        'error' => 'معرف الإعلان مطلوب'
    ]);
}

/* ==========================================
   2. ✅ التحقق من صلاحيات المستخدم الحالي
   ========================================== */
$currentUser = null;
$isAdmin = false;

// قراءة المستخدم من الجلسة
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

/* ==========================================
   3. جلب الإعلان من قاعدة البيانات
   ========================================== */
$stmt = $pdo->prepare('
    SELECT
        l.*,
        lo.name_ar AS city_name,
        lo.slug AS city_slug
    FROM listings l
    LEFT JOIN locations lo ON lo.id = l.location_id
    WHERE l.id = ?
');

$stmt->execute([$id]);
$listing = $stmt->fetch();

if (!$listing) {
    respond([
        'success' => false,
        'error' => 'الإعلان غير موجود'
    ]);
}

/* ==========================================
   4. ✅ اجلب عدد الصور فقط (بدون الصور نفسها)
   ========================================== */
$countStmt = $pdo->prepare(
    'SELECT COUNT(*) FROM listing_images WHERE listing_id = ?'
);
$countStmt->execute([$id]);
$imageCount = (int)$countStmt->fetchColumn();

// ✅ نرسل علامات فقط، وليس Base64
$images = [];
for ($i = 0; $i < $imageCount; $i++) {
    $images[] = "has_image:$i";
}

$listing['images'] = $images;

/* ==========================================
   5. معالجة التفاصيل (JSON)
   ========================================== */
$listing['details'] = json_decode(
    $listing['details'] ?? '{}',
    true
) ?: [];

/* ==========================================
   6. ✅ حماية رقم البائع — إخفاء عن غير الأدمن
   ==========================================
   هذا هو الإصلاح الأمني الأساسي:
   - إذا كان المستخدم أدمن → يرى رقم البائع
   - إذا كان مستخدم عادي أو غير مسجل → لا يرى الرقم
   
   النتيجة: حتى لو فتح المستخدم DevTools، لن يجد الرقم.
   ========================================== */
$sellerWhatsapp = $listing['whatsapp'] ?? '';

if (!$isAdmin) {
    // ✅ إخفاء رقم البائع من الحقل الرئيسي
    $listing['whatsapp'] = null;
    $listing['whatsapp_hidden'] = true;
    
    // ✅ إخفاء أي نسخة من الرقم في التفاصيل
    if (isset($listing['details']['whatsapp'])) {
        unset($listing['details']['whatsapp']);
    }
    if (isset($listing['details']['_whatsapp'])) {
        unset($listing['details']['_whatsapp']);
    }
    if (isset($listing['details']['phone'])) {
        unset($listing['details']['phone']);
    }
    if (isset($listing['details']['_phone'])) {
        unset($listing['details']['_phone']);
    }
} else {
    // ✅ الأدمن يرى الرقم بشكل طبيعي
    $listing['whatsapp'] = $sellerWhatsapp;
    $listing['whatsapp_hidden'] = false;
}

/* ==========================================
   7. تحويل الأنواع (Types)
   ========================================== */
$listing['price'] = (float)$listing['price'];
$listing['featured'] = (bool)$listing['is_featured'];
$listing['views'] = (int)($listing['views'] ?? 0);

/* ==========================================
   8. زيادة عدد المشاهدات (بعد التحويلات)
   ========================================== */
try {
    $pdo->prepare(
        'UPDATE listings SET views = views + 1 WHERE id = ?'
    )->execute([$id]);
} catch (Throwable $e) {
    // لا توقف الطلب إذا فشل تحديث المشاهدات
    error_log('listing.php: failed to update views - ' . $e->getMessage());
}

/* ==========================================
   9. الرد النهائي
   ========================================== */
respond([
    'success' => true,
    'listing' => $listing,
    'is_admin_view' => $isAdmin  // ✅ معلومة مفيدة للواجهة
]);