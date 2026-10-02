<?php
/**
 * Server-Sent Events - بث الإشعارات الفوري
 * GET /api/notifications_stream.php
 *
 * ⚡ اتصال واحد يدوم طول الجلسة
 * ⚡ لا يستهلك باندويث مثل Polling
 */

require_once 'config.php';
require_once 'helpers.php';

// التحقق من تسجيل الدخول (بدون إرجاع JSON لأن SSE يحتاج headers خاصة)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    header('Content-Type: text/plain');
    echo 'Unauthorized';
    exit;
}

$userId = $_SESSION['user_id'];

// إعداد SSE headers
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');

// تعطيل caching PHP
while (ob_get_level() > 0) {
    ob_end_flush();
}
ob_implicit_flush(true);

// ضبط وقت التنفيذ الطويل
@set_time_limit(0);
@ini_set('max_execution_time', 0);
ignore_user_abort(false);

// الحصول على آخر إشعار موجود
$lastNotifId = 0;
try {
    $stmt = $pdo->prepare("SELECT MAX(id) FROM notifications WHERE user_id = ?");
    $stmt->execute([$userId]);
    $lastNotifId = (int)$stmt->fetchColumn();
} catch (Throwable $e) {
    $lastNotifId = 0;
}

// إرسال حدث الاتصال الأولي
echo "event: connected\n";
echo "data: " . json_encode([
    'success' => true,
    'user_id' => $userId,
    'last_id' => $lastNotifId
]) . "\n\n";
flush();

// الحلقة الرئيسية - تعمل لمدة 25 دقيقة كحد أقصى
$startTime = time();
$maxDuration = 25 * 60;
$lastHeartbeat = time();

while (true) {
    // انتهى وقت الجلسة
    if ((time() - $startTime) > $maxDuration) {
        echo "event: timeout\n";
        echo "data: {}\n\n";
        flush();
        break;
    }

    // العميل أغلق الاتصال
    if (connection_aborted()) {
        break;
    }

    try {
        // ابحث عن إشعارات جديدة
        $stmt = $pdo->prepare("
            SELECT id, type, title, message, link, created_at
            FROM notifications
            WHERE user_id = ? AND id > ?
            ORDER BY id ASC
        ");
        $stmt->execute([$userId, $lastNotifId]);
        $newNotifs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($newNotifs as $notif) {
            $lastNotifId = (int)$notif['id'];
            echo "event: notification\n";
            echo "data: " . json_encode($notif, JSON_UNESCAPED_UNICODE) . "\n\n";
            flush();
        }

        // heartbeat كل 15 ثانية
        if ((time() - $lastHeartbeat) >= 15) {
            echo ": heartbeat\n\n";
            flush();
            $lastHeartbeat = time();
        }

    } catch (Throwable $e) {
        error_log('SSE error: ' . $e->getMessage());
        break;
    }

    sleep(3);
}

// إغلاق الاتصال بشكل نظيف
echo "event: close\n";
echo "data: {}\n\n";
flush();