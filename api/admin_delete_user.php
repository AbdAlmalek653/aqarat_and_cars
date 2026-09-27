<?php
require_once 'config.php';
require_once 'helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// كود تشخيصي: نطبع محتوى الجلسة لنرى ما يملكه السيرفر
header('Content-Type: application/json');
echo json_encode([
    'success' => false,
    'error' => 'بيانات التشخيص',
    'debug' => [
        'session_all' => $_SESSION, // هذا سيعرض كل المتغيرات الموجودة في الجلسة
        'session_role' => $_SESSION['role'] ?? 'غير موجود',
        'session_user_id' => $_SESSION['user_id'] ?? 'غير موجود'
    ]
]);
exit;
?>