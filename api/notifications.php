<?php
/**
 * جلب إشعارات المستخدم الحالي
 * 
 * GET /api/notifications.php?limit=20&offset=0     → جلب الإشعارات
 * GET /api/notifications.php?count_only=1          → عدد غير المقروء فقط
 */

require_once 'config.php';
require_once 'helpers.php';

// ✅ استخدام requireAuth() من helpers.php
$userId = requireAuth();

$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
$countOnly = isset($_GET['count_only']);

try {
    // عدد الإشعارات غير المقروءة
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$userId]);
    $unreadCount = (int)$stmt->fetchColumn();

    if ($countOnly) {
        respond([
            'success' => true,
            'unread_count' => $unreadCount
        ]);
    }

    // جلب الإشعارات
    $stmt = $pdo->prepare("
        SELECT id, type, title, message, link, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bindValue(1, $userId, PDO::PARAM_STR);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    respond([
        'success' => true,
        'unread_count' => $unreadCount,
        'notifications' => $notifications
    ]);

} catch (Throwable $e) {
    error_log('notifications.php error: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'خطأ في جلب الإشعارات']);
}