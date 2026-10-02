<?php
/**
 * ==========================================
 * listings.php - جلب قائمة الإعلانات
 * الإصدار: 5.0 (مستقل تماماً + كاش مدمج + حماية كاملة)
 * ==========================================
 * 
 * ✅ لا يعتمد على أي ملف خارجي
 * ✅ الكاش مدمج داخل الملف
 * ✅ يعمل حتى لو فشل الكاش
 * ✅ لا يرجع HTML أبداً
 */

// ✅ إعدادات صارمة
error_reporting(E_ALL);
ini_set('display_errors', 0); // لا نعرض الأخطاء (نمنع تسرب HTML)
ini_set('log_errors', 1);

// ✅ رأس JSON من البداية
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=30');

// ✅ دالة رد موحدة
function jsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ✅ دالة التقاط الأخطاء
function handleFatalError($message) {
    error_log('listings.php fatal: ' . $message);
    jsonResponse(['success' => false, 'error' => 'خطأ داخلي في الخادم'], 500);
}

// ✅ التقاط الأخطاء القاتلة
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        error_log('listings.php shutdown error: ' . $error['message']);
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'خطأ داخلي'], JSON_UNESCAPED_UNICODE);
        }
    }
});

// ==========================================
// 1. الاتصال بقاعدة البيانات (مستقل تماماً)
// ==========================================
try {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/helpers.php';

    if (!isset($pdo) || !$pdo instanceof PDO) {
        throw new Exception('PDO connection not available');
    }
} catch (Throwable $e) {
    handleFatalError('DB config: ' . $e->getMessage());
}

// ==========================================
// 2. التحقق من الصلاحيات
// ==========================================
$isAdmin = false;
try {
    if (isset($_SESSION['user_id'])) {
        $userStmt = $pdo->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
        $userStmt->execute([$_SESSION['user_id']]);
        $role = $userStmt->fetchColumn();
        $isAdmin = in_array($role, ['admin', 'super_admin'], true);
    }
} catch (Throwable $e) {
    error_log('listings.php: user check failed - ' . $e->getMessage());
}

// ==========================================
// 3. الكاش المدمج (بدون ملف خارجي)
// ==========================================
class InlineCache {
    private $dir;
    private $ttl;

    public function __construct($ttl = 30) {
        $this->dir = __DIR__ . '/cache/data';
        $this->ttl = $ttl;

        // ✅ إنشاء المجلد بأمان
        if (!is_dir($this->dir)) {
            @mkdir($this->dir, 0777, true);
        }
    }

    public function isAvailable() {
        return is_dir($this->dir) && is_writable($this->dir);
    }

    public function remember($key, $callback, $ttl = null) {
        // ✅ إذا الكاش غير متاح، نفّذ الدالة مباشرة
        if (!$this->isAvailable()) {
            return $callback();
        }

        $ttl = $ttl ?: $this->ttl;
        $file = $this->dir . '/' . md5($key) . '.json';

        // ✅ جرب قراءة الكاش
        if (file_exists($file) && (time() - filemtime($file)) < $ttl) {
            $content = @file_get_contents($file);
            if ($content !== false) {
                $data = json_decode($content, true);
                if ($data !== null) {
                    return $data;
                }
            }
        }

        // ✅ نفّذ الدالة
        $result = $callback();

        // ✅ خزّن النتيجة (مع تجاهل الأخطاء)
        @file_put_contents($file, json_encode($result, JSON_UNESCAPED_UNICODE), LOCK_EX);

        return $result;
    }
}

// ==========================================
// 4. بناء مفتاح الكاش
// ==========================================
try {
    $cacheKeyData = [
        'type' => $_GET['type'] ?? '',
        'purpose' => $_GET['purpose'] ?? '',
        'city' => $_GET['city'] ?? '',
        'featured' => $_GET['featured'] ?? '',
        'limit' => $_GET['limit'] ?? 50,
        'is_admin' => $isAdmin ? 1 : 0,
    ];
    ksort($cacheKeyData);
    $cacheKey = 'listings_' . md5(json_encode($cacheKeyData));
} catch (Throwable $e) {
    $cacheKey = 'listings_default';
}

// ==========================================
// 5. تنفيذ الاستعلام
// ==========================================
try {
    $cache = new InlineCache(30);

    $response = $cache->remember($cacheKey, function() use ($pdo, $isAdmin) {

        // بناء الشروط
        if ($isAdmin) {
            $where = ["l.status IN ('active', 'pending')"];
        } else {
            $where = ["l.status = 'active'"];
        }
        $params = [];

        if (!empty($_GET['type'])) {
            $where[] = 'l.type = ?';
            $params[] = $_GET['type'];
        }
        if (!empty($_GET['purpose'])) {
            $where[] = 'l.purpose = ?';
            $params[] = $_GET['purpose'];
        }
        if (!empty($_GET['city'])) {
            $where[] = 'lo.slug = ?';
            $params[] = $_GET['city'];
        }
        if (isset($_GET['featured']) && $_GET['featured'] == '1') {
            $where[] = 'l.is_featured = 1';
        }

        $limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);

        $sql = '
            SELECT
                l.id, l.type, l.purpose, l.title, l.price, l.currency,
                l.city, l.area, l.is_featured, l.status, l.views,
                l.created_at, l.details,
                lo.name_ar AS city_name,
                lo.slug AS city_slug
            FROM listings l
            LEFT JOIN locations lo ON lo.id = l.location_id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY l.created_at DESC
            LIMIT ' . $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $listings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // جلب علامة الصور
        $listingIds = array_column($listings, 'id');
        $hasImageByListing = [];

        if (!empty($listingIds)) {
            $placeholders = implode(',', array_fill(0, count($listingIds), '?'));
            $imgStmt = $pdo->prepare(
                "SELECT DISTINCT listing_id FROM listing_images 
                 WHERE listing_id IN ($placeholders)"
            );
            $imgStmt->execute($listingIds);
            $allRows = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($allRows as $row) {
                $hasImageByListing[$row['listing_id']] = true;
            }
        }

        // معالجة البيانات
        foreach ($listings as &$listing) {
            $listing['images'] = !empty($hasImageByListing[$listing['id']]) ? ['has_image'] : [];
            $listing['details'] = json_decode($listing['details'] ?? '{}', true) ?: [];
            $listing['price'] = (float)$listing['price'];
            $listing['featured'] = (bool)$listing['is_featured'];
            $listing['views'] = (int)$listing['views'];

            // إخفاء رقم الواتساب
            unset($listing['whatsapp'], $listing['phone']);
            if (isset($listing['details']['whatsapp'])) unset($listing['details']['whatsapp']);
            if (isset($listing['details']['_whatsapp'])) unset($listing['details']['_whatsapp']);
            if (isset($listing['details']['phone'])) unset($listing['details']['phone']);
            if (isset($listing['details']['_phone'])) unset($listing['details']['_phone']);
        }

        return [
            'success' => true,
            'listings' => $listings,
            'count' => count($listings)
        ];
    }, 30);

    // ✅ الرد النهائي
    jsonResponse($response);

} catch (Throwable $e) {
    error_log('listings.php: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error' => 'خطأ في جلب البيانات',
        'listings' => [],
        'count' => 0
    ], 500);
}