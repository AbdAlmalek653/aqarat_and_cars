<?php
// api/get_latest.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60'); // كاش المتصفح لمدة دقيقة

// 1. إعدادات قاعدة البيانات (استخدم متغيرات البيئة تبع Railway)
$host = getenv('DB_HOST');
$db   = getenv('DB_DATABASE');
$user = getenv('DB_USERNAME');
$pass = getenv('DB_PASSWORD');
$port = getenv('DB_PORT') ?: '3306';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false // مهم جداً للسرعة والأمان
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB Connection failed']);
    exit;
}

// 2. نظام الكاش (Caching)
$cacheDir = __DIR__ . '/../cache';
$cacheFile = $cacheDir . '/latest_properties.json';
$cacheTime = 60; // 60 ثانية كاش

if (!is_dir($cacheDir)) mkdir($cacheDir, 0777, true);

// إذا الكاش موجود وعمره أقل من 60 ثانية، رجعه فوراً بدون ما تروح عالداتابيس
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    echo file_get_contents($cacheFile);
    exit;
}

// 3. الاستعلام الصاروخي (Keyset Pagination + Index)
// ملاحظة: لازم يكون عندك Index على عمود created_at
$limit = 10;
$lastDate = $_GET['last_date'] ?? null; // للصفحات التالية

if ($lastDate) {
    // ✅ سريع جداً (ما بيستخدم OFFSET)
    $sql = "SELECT id, title, price, created_at 
            FROM properties 
            WHERE status = 'active' AND created_at < :last_date 
            ORDER BY created_at DESC 
            LIMIT :limit";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':last_date', $lastDate);
} else {
    // ✅ الصفحة الأولى (أحدث العناصر)
    $sql = "SELECT id, title, price, created_at 
            FROM properties 
            WHERE status = 'active' 
            ORDER BY created_at DESC 
            LIMIT :limit";
    $stmt = $pdo->prepare($sql);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->execute();
$data = $stmt->fetchAll();

// 4. تخزين النتيجة في الكاش (فقط للصفحة الأولى)
if (!$lastDate) {
    file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE));
}

// 5. إرجاع البيانات
echo json_encode($data, JSON_UNESCAPED_UNICODE);