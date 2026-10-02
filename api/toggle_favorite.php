<?php
/**
 * toggle_favorite.php - إضافة/إزالة من المفضلة
 * POST /api/toggle_favorite.php
 * Body: { "listing_id": "L123..." }
 */

require_once 'config.php';
require_once 'helpers.php';

// ✅ 1. التحقق من تسجيل الدخول
$userId = requireAuth();

// ✅ 2. إغلاق الجلسة فوراً لتجنب قفل الطلبات المتزامنة
session_write_close();

// ✅ 3. قراءة المدخلات
$data = getInput();
$listingId = trim($data['listing_id'] ?? '');

if (!$listingId) {
    respond(['success' => false, 'error' => 'معرف الإعلان مطلوب']);
}

// ✅ 4. الحد الأقصى للمفضلة (500)
const MAX_FAVORITES = 500;

try {
    // ✅ 5. تحقق من وجود الإعلان (يمنع إضافة معرفات وهمية)
    $stmt = $pdo->prepare("SELECT id FROM listings WHERE id = ? LIMIT 1");
    $stmt->execute([$listingId]);
    if (!$stmt->fetch()) {
        respond(['success' => false, 'error' => 'الإعلان غير موجود']);
    }

    // ✅ 6. هل الإعلان موجود في المفضلة؟
    $stmt = $pdo->prepare(
        "SELECT id FROM favorites WHERE user_id = ? AND listing_id = ? LIMIT 1"
    );
    $stmt->execute([$userId, $listingId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // ✅ إزالة من المفضلة
        $stmt = $pdo->prepare(
            "DELETE FROM favorites WHERE user_id = ? AND listing_id = ?"
        );
        $stmt->execute([$userId, $listingId]);

        respond([
            'success' => true,
            'isFavorite' => false,
            'message' => 'تمت الإزالة من المفضلة'
        ]);
    }

    // ✅ 7. تحقق من الحد الأقصى قبل الإضافة
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM favorites WHERE user_id = ?"
    );
    $stmt->execute([$userId]);
    $count = (int)$stmt->fetchColumn();

    if ($count >= MAX_FAVORITES) {
        respond([
            'success' => false,
            'error' => "وصلت للحد الأقصى (" . MAX_FAVORITES . " إعلان)"
        ]);
    }

    // ✅ 8. إضافة للمفضلة
    $stmt = $pdo->prepare(
        "INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)"
    );
    $stmt->execute([$userId, $listingId]);

    respond([
        'success' => true,
        'isFavorite' => true,
        'message' => 'تمت الإضافة إلى المفضلة'
    ]);

} catch (Throwable $e) {
    error_log('toggle_favorite.php error: ' . $e->getMessage());
    respond([
        'success' => false,
        'error' => 'حدث خطأ في العملية'
    ]);
}