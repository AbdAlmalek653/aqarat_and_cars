<?php
require_once 'config.php';
require_once 'helpers.php';

// التحقق من أن المستخدم الحالي أدمن
requireAdmin($pdo);

// ✅ التحقق من أن المستخدم سوبر أدمن (يدعم العربية والإنجليزية)
$role = $_SESSION['role'] ?? '';
if ($role !== 'super_admin' && $role !== 'أدمن عام') {
    respond(['success' => false, 'error' => 'فقط السوبر أدمن يمكنه حذف المستخدمين']);
}

// قراءة البيانات المرسلة
$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;

if (!$id) {
    respond(['success' => false, 'error' => 'معرف المستخدم مطلوب']);
}

// منع المستخدم من حذف نفسه
if ($id == ($_SESSION['user_id'] ?? '')) {
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