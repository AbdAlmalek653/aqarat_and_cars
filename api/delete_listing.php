<?php
/**
 * ==========================================
 * delete_listing.php - حذف إعلان
 * الإصدار: 2.0 (مع حذف الصور ومسح الكاش)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);
$data = getInput();
$id = $data['id'] ?? '';

if (!$id) {
    respond(['success' => false, 'error' => 'معرف مطلوب']);
}

// ==========================================
// 1. ✅ حذف صور الإعلان أولاً (احتياطي)
// ==========================================
// إذا كان عندك ON DELETE CASCADE في قاعدة البيانات، هذا السطر لن يضر
try {
    $pdo->prepare('DELETE FROM listing_images WHERE listing_id = ?')->execute([$id]);
} catch (Throwable $e) {
    error_log('delete_listing: failed to delete images - ' . $e->getMessage());
}

// ==========================================
// 2. حذف الإعلان نفسه
// ==========================================
$stmt = $pdo->prepare('DELETE FROM listings WHERE id = ?');
$stmt->execute([$id]);

// التحقق أن الإعلان كان موجوداً
if ($stmt->rowCount() === 0) {
    respond(['success' => false, 'error' => 'الإعلان غير موجود']);
}

// ==========================================
// 3. ✅ مسح الكاش (مهم جداً!)
// ==========================================
require_once 'cache.php';
$cache = new SimpleCache();
$cache->forget("listing_detail_{$id}"); // كاش الإعلان المحدد
$cache->flush(); // كاش باقي القوائم والإحصائيات

// ==========================================
// 4. الرد النهائي
// ==========================================
respond(['success' => true, 'message' => 'تم حذف الإعلان']);