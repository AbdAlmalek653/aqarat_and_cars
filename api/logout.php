<?php
/**
 * ==========================================
 * logout.php - تسجيل الخروج
 * الإصدار: 2.0 (مع مسح remember token)
 * ==========================================
 */

require_once 'config.php';

// ✅ منع الكاش
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// ==========================================
// 1️⃣ مسح remember token من قاعدة البيانات
// ==========================================
if (!empty($_COOKIE['souq_remember_token'])) {
    $token = $_COOKIE['souq_remember_token'];

    try {
        // ✅ احذف التوكن من الجدول
        $pdo->prepare("DELETE FROM user_tokens WHERE token = ?")->execute([$token]);
    } catch (Exception $e) {
        // ✅ لا نوقف تسجيل الخروج بسبب خطأ في التوكن
        error_log('⚠️ خطأ في حذف التوكن: ' . $e->getMessage());
    }

    // ✅ امسح الكوكي
    setcookie(
        'souq_remember_token',
        '',
        [
            'expires'  => time() - 3600,
            'path'     => '/',
            'domain'   => '',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]
    );
}

// ==========================================
// 2️⃣ مسح بيانات الجلسة
// ==========================================
$_SESSION = [];

// ==========================================
// 3️⃣ حذف كوكي الجلسة
// ==========================================
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'domain'   => $params['domain'],
            'secure'   => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => 'Lax'
        ]
    );
}

// ==========================================
// 4️⃣ تدمير الجلسة نهائياً
// ==========================================
session_destroy();

// ✅ إعادة إنشاء جلسة نظيفة (للتأكد)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
session_regenerate_id(true);

// ==========================================
// 5️⃣ الرد النهائي
// ==========================================
respond(['success' => true, 'message' => 'تم تسجيل الخروج بنجاح']);