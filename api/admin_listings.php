<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);

// ✅ استقبال معاملات الجلب التدريجي (Pagination)
$status = $_GET['status'] ?? '';
$last_date = $_GET['last_date'] ?? null; // تاريخ آخر إعلان تم جلبه (للـ Keyset Pagination)
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50; // ✅ تقليل العدد الافتراضي إلى 50 لتسريع الاستجابة

$params = [];
$where = [];

// فلترة حسب الحالة
if (in_array($status, ['active', 'pending', 'sold', 'rented', 'rejected', 'expired'], true)) {
    $where[] = 'l.status = ?';
    $params[] = $status;
}

// ✅ فلترة حسب التاريخ (الجلب التدريجي السريع)
if ($last_date) {
    $where[] = 'l.created_at < ?';
    $params[] = $last_date;
}

$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// ✅ بناء الاستعلام بدون OFFSET (أسرع بـ 100 مرة للجداول الكبيرة)
$sql = 'SELECT l.*, u.name AS owner_name, u.email AS owner_email,
            lo.name_ar AS city_name
     FROM listings l
     LEFT JOIN users u ON u.id = l.user_id
     LEFT JOIN locations lo ON lo.id = l.location_id
     ' . $whereSql . '
     ORDER BY l.created_at DESC
     LIMIT ' . $limit;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();

$next_last_date = null;

foreach ($listings as &$listing) {
    $listing['price'] = (float)$listing['price'];
    $listing['views'] = (int)$listing['views'];
    $listing['is_featured'] = (bool)$listing['is_featured'];
    $listing['details'] = json_decode($listing['details'] ?? '{}', true) ?: [];
    
    // ✅ حفظ تاريخ آخر عنصر في القائمة لإرساله للواجهة
    $next_last_date = $listing['created_at'];
}

// ✅ إرجاع النتيجة مع معلومات الجلب التدريجي
respond([
    'success' => true, 
    'listings' => $listings,
    'next_last_date' => $next_last_date, // الواجهة ستستخدم هذا لجلب الصفحة التالية
    'has_more' => count($listings) === $limit // هل يوجد المزيد؟
]);