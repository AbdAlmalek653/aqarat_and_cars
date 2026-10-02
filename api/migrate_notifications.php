<?php
/**
 * Migration: إنشاء جدول الإشعارات
 * شغّله مرة واحدة فقط من: /api/migrate_notifications.php
 */

require_once 'config.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'info',
            title TEXT NOT NULL,
            message TEXT,
            link TEXT,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)");

    echo json_encode([
        'success' => true,
        'message' => '✅ تم إنشاء جدول الإشعارات بنجاح'
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}