<?php
/**
 * ==========================================
 * login.php - تسجيل الدخول
 * الإصدار: 2.0 (جلسة دائمة 10 سنوات + remember token)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';

// ✅ منع الكاش
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$data = getInput();
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// ✅ remember_me افتراضياً true (جلسة دائمة)
$rememberMe = isset($data['remember_me']) ? (bool)$data['remember_me'] : true;

if (!$email || !$password) {
    respond(['success' => false, 'error' => 'بيانات ناقصة']);
}

/* ==========================================
   1️⃣ البحث عن المستخدم
   ========================================== */
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    respond(['success' => false, 'error' => 'لا يوجد حساب بهذا البريد']);
}

if (!password_verify($password, $user['password_hash'])) {
    respond(['success' => false, 'error' => 'كلمة المرور غير صحيحة']);
}

// ✅ التحقق من حالة الحساب (لو الحقل موجود)
if (isset($user['is_active']) && $user['is_active'] === false) {
    respond(['success' => false, 'error' => 'الحساب معطّل، تواصل مع الإدارة']);
}

/* ==========================================
   2️⃣ إنشاء الجلسة الدائمة (10 سنوات)
   ========================================== */

// ✅ امسح أي جلسة قديمة أولاً
if (session_status() === PHP_SESSION_ACTIVE) {
    $_SESSION = [];
}

// ✅ عيّن بيانات المستخدم في الجلسة
$_SESSION['user_id'] = $user['id'];
$_SESSION['login_time'] = time();
$_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

// ✅ جدّد كوكي الجلسة (10 سنوات)
$cookieLifetime = 315360000; // 10 سنوات بالثواني

setcookie(
    session_name(),
    session_id(),
    [
        'expires'  => time() + $cookieLifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]
);

/* ==========================================
   3️⃣ إنشاء Remember Token (إذا remember_me = true)
   ========================================== */
if ($rememberMe) {
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

        // ✅ امسح التوكنات القديمة للمستخدم
        $pdo->prepare("DELETE FROM user_tokens WHERE user_id = ?")->execute([$user['id']]);

        // ✅ أنشئ توكن جديد
        $token = bin2hex(random_bytes(32));
        $expires = time() + $cookieLifetime;

        $pdo->prepare("
            INSERT INTO user_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        ")->execute([$user['id'], $token, $expires]);

        // ✅ أرسل التوكن ككوكي
        setcookie(
            'souq_remember_token',
            $token,
            [
                'expires'  => $expires,
                'path'     => '/',
                'domain'   => '',
                'secure'   => true,
                'httponly' => true,
                'samesite' => 'Lax'
            ]
        );

    } catch (Exception $e) {
        // ✅ لا نوقف تسجيل الدخول بسبب خطأ في التوكن
        error_log('⚠️ خطأ في إنشاء remember token: ' . $e->getMessage());
    }
}

/* ==========================================
   4️⃣ الرد النهائي
   ========================================== */
respond([
    'success' => true,
    'user' => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role'  => $user['role']
    ]
]);