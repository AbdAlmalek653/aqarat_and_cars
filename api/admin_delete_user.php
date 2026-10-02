<?php
/**
 * ==========================================
 * admin_delete_user.php - حذف مستخدم (للسوبر أدمن فقط)
 * الإصدار: 2.0 (مع مسح الكاش تلقائياً)
 * ==========================================
 */

require_once 'config.php';
require_once 'helpers.php';

// التحقق من أن المستخدم الحالي أدمن
requireAdmin($pdo);

$currentUserId = $_SESSION['user_id'] ?? null;
if (!$currentUserId) {
    respond(['success' => false, 'error' => 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى']);
}

// ✅ جلب دور المستخدم الحالي من قاعدة البيانات مباشرة لضمان الدقة
$stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmtRole->execute([$currentUserId]);
$dbRole = trim($stmtRole->fetchColumn());

// التحقق من أن المستخدم سوبر أدمن (يدعم الإنجليزية والعربية)
$isSuperAdmin = ($dbRole === 'super_admin' || $dbRole === 'أدمن عام');

if (!$isSuperAdmin) {
    respond([
        'success' => false,
        'error' => 'فقط السوبر أدمن يمكنه حذف المستخدمين. دورك في قاعدة البيانات هو: ' . $dbRole
    ]);
}

// ==========================================
// قراءة البيانات المرسلة
// ==========================================
$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;

if (!$id) {
    respond(['success' => false, 'error' => 'معرف المستخدم مطلوب']);
}

// منع المستخدم من حذف نفسه
if ($id == $currentUserId) {
    respond(['success' => false, 'error' => 'لا يمكنك حذف حسابك الخاص']);
}

try {
    // ==========================================
    // التحقق من وجود المستخدم أولاً
    // ==========================================
    $checkStmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ?");
    $checkStmt->execute([$id]);
    $user = $checkStmt->fetch();

    if (!$user) {
        respond(['success' => false, 'error' => 'المستخدم غير موجود']);
    }

    // ==========================================
    // ✅ حذف إعلانات المستخدم وصورها أولاً
    // ==========================================
    // (إذا كان عندك ON DELETE CASCADE، هذه الخطوة احتياطية)
    try {
        // جلب إعلانات المستخدم
        $listingsStmt = $pdo->prepare("SELECT id FROM listings WHERE user_id = ?");
        $listingsStmt->execute([$id]);
        $userListings = $listingsStmt->fetchAll(PDO::FETCH_COLUMN);

        if (!empty($userListings)) {
            // حذف صور الإعلانات
            $placeholders = implode(',', array_fill(0, count($userListings), '?'));
            $pdo->prepare("DELETE FROM listing_images WHERE listing_id IN ($placeholders)")
                ->execute($userListings);
            
            // حذف الإعلانات
            $pdo->prepare("DELETE FROM listings WHERE user_id = ?")->execute([$id]);
        }
    } catch (Throwable $e) {
        error_log('admin_delete_user: failed to delete listings - ' . $e->getMessage());
    }

    // ==========================================
    // تنفيذ حذف المستخدم
    // ==========================================
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    // ==========================================
    // ✅ مسح الكاش (مهم جداً!)
    // ==========================================
    require_once 'cache.php';
    $cache = new SimpleCache();
    $cache->flush(); // يمسح كل الكاش (لأن الحذف يؤثر على القوائم والإحصائيات)

    // ==========================================
    // الرد النهائي
    // ==========================================
    respond(['success' => true, 'message' => 'تم حذف المستخدم بنجاح']);

} catch (PDOException $e) {
    respond(['success' => false, 'error' => 'خطأ في قاعدة البيانات: ' . $e->getMessage()]);
}