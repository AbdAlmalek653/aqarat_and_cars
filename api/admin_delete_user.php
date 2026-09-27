<?php
require_once 'config.php';
require_once 'helpers.php';

// التحقق من أن المستخدم الحالي أدمن (يمنع غير الأدمن من الدخول)
requireAdmin($pdo);

$currentUserId = $_SESSION['user_id'] ?? null;
if (!$currentUserId) {
    respond(['success' => false, 'error' => 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى']);
}

// ✅ جلب دور المستخدم الحالي من قاعدة البيانات مباشرة لضمان الدقة
$stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmtRole->execute([$currentUserId]);
$dbRole = trim($stmtRole->fetchColumn()); // trim لإزالة أي مسافات زائدة

// التحقق من أن المستخدم سوبر أدمن (يدعم الإنجليزية والعربية)
$isSuperAdmin = ($dbRole === 'super_admin' || $dbRole === 'أدمن عام');

if (!$isSuperAdmin) {
    respond(['success' => false, 'error' => 'فقط السوبر أدمن يمكنه حذف المستخدمين. دورك في قاعدة البيانات هو: ' . $dbRole]);
}

// قراءة البيانات المرسلة
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
    // التحقق من وجود المستخدم أولاً
    $checkStmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ?");
    $checkStmt->execute([$id]);
    $user = $checkStmt->fetch();

    if (!$user) {
        respond(['success' => false, 'error' => 'المستخدم غير موجود']);
    }

    // تنفيذ الحذف
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    respond(['success' => true, 'message' => 'تم حذف المستخدم بنجاح']);

} catch (PDOException $e) {
    respond(['success' => false, 'error' => 'خطأ في قاعدة البيانات: ' . $e->getMessage()]);
}
?>