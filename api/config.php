<?php
/**
 * ==========================================
 * config.php - الإعدادات الأساسية
 * الإصدار: 3.0 (جلسة دائمة 10 سنوات)
 * ==========================================
 */

// ==========================================
// ✅ إعدادات الجلسة الدائمة (10 سنوات)
// ==========================================
$SESSION_LIFETIME = 315360000; // 10 سنوات بالثواني

// ✅ إعدادات PHP للجلسة
ini_set('session.gc_maxlifetime', $SESSION_LIFETIME);
ini_set('session.cookie_lifetime', $SESSION_LIFETIME);
ini_set('session.use_strict_mode', 0);
ini_set('session.use_cookies', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);

// ✅ بدء الجلسة بإعدادات دائمة
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => $SESSION_LIFETIME,
        'path'     => '/',
        'domain'   => '',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// ==========================================
// ✅ إنشاء مجلد الكاش تلقائياً
// ==========================================
$__cacheDir = __DIR__ . '/cache/images';
if (!is_dir($__cacheDir)) {
    @mkdir($__cacheDir, 0777, true);
    @chmod($__cacheDir, 0777);
}

// ==========================================
// ✅ ترويسات CORS
// ==========================================
header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================================
// ✅ الاتصال بقاعدة البيانات (SQLite)
// ==========================================
$dbPath = __DIR__ . '/../database/souq.db';
$isNewDatabase = !is_file($dbPath);

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');

    if ($isNewDatabase) {
        $schemaPath = __DIR__ . '/../database/schema.sql';
        $schema = file_get_contents($schemaPath);
        if ($schema === false) {
            throw new RuntimeException('تعذر قراءة مخطط قاعدة البيانات');
        }
        $pdo->exec($schema);
    }
} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'تعذر الاتصال بقاعدة البيانات'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}