<?php
require_once 'config.php';

$id = $_GET['id'] ?? '';
$index = isset($_GET['index']) ? (int)$_GET['index'] : 0;

if (!$id) {
    http_response_code(404);
    exit;
}

$offset = max(0, $index);

$stmt = $pdo->prepare(
    "SELECT url FROM listing_images 
     WHERE listing_id = ? 
     ORDER BY sort_order 
     LIMIT 1 OFFSET " . $offset
);
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['url'])) {
    http_response_code(404);
    exit;
}

$url = $row['url'];

// ==========================================
// ✨ دالة مساعدة: ترويسات التخزين المؤقت
// ==========================================
function sendCacheHeaders($mime = null) {
    // Cache لمدة سنة كاملة
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    header('Vary: Accept-Encoding');
    if ($mime) {
        header('Content-Type: ' . $mime);
    }
}

// ==========================================
// 🎯 دالة: جلب صورة من URL خارجي وخدمتها مباشرة
// ==========================================
function proxyImage($url, $maxWidth = 800) {
    // التحقق من صحة الرابط
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    
    // استخدام cURL لجلب الصورة
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SouqBot/1.0)',
        CURLOPT_HTTPHEADER => [
            'Accept: image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
        ],
    ]);
    
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($httpCode !== 200 || $data === false || empty($data)) {
        return false;
    }
    
    // التحقق من أن المحتوى صورة فعلاً
    if ($contentType && strpos($contentType, 'image/') !== 0) {
        return false;
    }
    
    // تحديد MIME type
    if (!$contentType || $contentType === 'application/octet-stream') {
        // كشف نوع الصورة من البيانات
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $contentType = $finfo->buffer($data) ?: 'image/jpeg';
    }
    
    return [
        'data' => $data,
        'mime' => $contentType,
    ];
}

// ==========================================
// 1️⃣ صورة Base64 → خدمة مباشرة
// ==========================================
if (strpos($url, 'data:image/') === 0) {
    $parts = explode(',', $url, 2);
    if (count($parts) === 2) {
        $binary = base64_decode($parts[1]);
        preg_match('/data:([^;]+);/', $parts[0], $m);
        $mime = $m[1] ?? 'image/jpeg';
        
        sendCacheHeaders($mime);
        header('Content-Length: ' . strlen($binary));
        echo $binary;
        exit;
    }
}

// ==========================================
// 2️⃣ رابط خارجي → Proxy مباشر (بدون Redirect!)
// ==========================================
if (strpos($url, 'http') === 0) {
    // جرّب جلب الصورة مباشرة
    $result = proxyImage($url);
    
    if ($result !== false) {
        // ✅ نجح → خدمة الصورة مباشرة
        sendCacheHeaders($result['mime']);
        header('Content-Length: ' . strlen($result['data']));
        echo $result['data'];
        exit;
    }
    
    // ❌ فشل → fallback: redirect مع cache
    // (للحالات النادرة: hotlink protection, موقع خارجي محجوب, إلخ)
    sendCacheHeaders();
    header('Location: ' . $url, true, 302);
    exit;
}

http_response_code(404);