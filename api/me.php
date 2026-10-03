<?php
/**
 * ==========================================
 * me.php - التحقق من الجلسة
 * الإصدار: 2.0 (جلسة دائمة + remember token)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';

// ✅ منع الكاش تماماً - مهم جداً لحل مشكلة الخروج التلقائي
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

/**
 * جلب بيانات المستخدم من قاعدة البيانات
 */
function getUserById($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT id, name, email, phone, role FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * إرسال بيانات المستخدم + تجديد الجلسة
 */
function respondWithUser($user) {
    // ✅ جدّد كوكي الجلسة (10 سنوات)
    if (session_status() === PHP_SESSION_ACTIVE) {
        setcookie(
            session_name(),
            session_id(),
            [
                'expires'  => time() + 315360000, // 10 سنوات
                'path'     => '/',
                'domain'   => '',
                'secure'   => true,
                'httponly' => true,
                'samesite' => 'Lax'
            ]
        );
    }

    respond(['success' => true, 'user' => $user]);
}

/* ==========================================
   1️⃣ التحقق من الجلسة العادية أولاً
   ========================================== */
if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
    $user = getUserById($pdo, $_SESSION['user_id']);

    if ($user) {
        respondWithUser($user);
    }

    // ❌ المستخدم محذوف من قاعدة البيانات → امسح الجلسة
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    session_destroy();
}

/* ==========================================
   2️⃣ إذا ما في جلسة → جرب "تذكرني" (remember token)
   ========================================== */
if (!empty($_COOKIE['souq_remember_token'])) {
    $token = $_COOKIE['souq_remember_token'];

    try {
        // ✅ أنشئ جدول التوكنات لو ما موجود
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                token VARCHAR(128) NOT NULL UNIQUE,
                expires_at BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(user_id),
                INDEX(token)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // ✅ ابحث عن التوكن
        $stmt = $pdo->prepare("
            SELECT user_id FROM user_tokens 
            WHERE token = ? AND expires_at > ? 
            LIMIT 1
        ");
        $stmt->execute([$token, time()]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $user = getUserById($pdo, $row['user_id']);

            if ($user) {
                // ✅ أعِد إنشاء الجلسة
                if (session_status() !== PHP_SESSION_ACTIVE) {
                    session_start();
                }
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['login_time'] = time();

                respondWithUser($user);
            }
        }
    } catch (Exception $e) {
        error_log('⚠️ خطأ في التحقق من التوكن: ' . $e->getMessage());
    }

    // ❌ توكن غير صالح → امسح الكوكي
    setcookie(
        'souq_remember_token',
        '',
        [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]
    );
}

/* ==========================================
   3️⃣ لا جلسة ولا توكن → رد بالفشل
   ========================================== */
respond([
    'success' => false,
    'error'   => 'غير مسجل الدخول'
]);