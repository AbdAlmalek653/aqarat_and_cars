<?php
/**
 * تعليم الإشعارات كمقروءة
 * 
 * POST /api/notifications_mark_read.php
 * Body: { "id": "..." }  → تعليم إشعار واحد كمقروء
 * Body: { "all": true }  → تعليم كل الإشعارات كمقروءة
 */

require_once 'config.php';
require_once 'helpers.php';

$userId = requireAuth();
$data = getInput();

$markAll = !empty($data['all']);
$id = $data['id'] ?? null;

try {
    if ($markAll) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$userId]);
        respond([
            'success' => true,
            'message' => 'تم تعليم كل الإشعارات كمقروءة',
            'affected' => $stmt->rowCount()
        ]);
    }

    if ($id) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        respond([
            'success' => true,
            'affected' => $stmt->rowCount()
        ]);
    }

    respond(['success' => false, 'error' => 'لا يوجد معرف أو طلب صحيح']);

} catch (Throwable $e) {
    error_log('notifications_mark_read.php error: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'خطأ في تحديث الإشعار']);
}