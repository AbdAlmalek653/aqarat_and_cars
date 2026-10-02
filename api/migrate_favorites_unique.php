<?php
require_once 'config.php';

try {
    // ✅ حذف التكرارات أولاً (إن وُجدت)
    $pdo->exec("
        DELETE FROM favorites 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM favorites 
            GROUP BY user_id, listing_id
        )
    ");

    // ✅ إضافة UNIQUE constraint
    $pdo->exec("
        CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique 
        ON favorites(user_id, listing_id)
    ");

    // ✅ فهارس إضافية للأداء
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id)");

    respond([
        'success' => true,
        'message' => 'تم تطبيق قيود المفضلة بنجاح'
    ]);

} catch (Throwable $e) {
    respond(['success' => false, 'error' => $e->getMessage()]);
}