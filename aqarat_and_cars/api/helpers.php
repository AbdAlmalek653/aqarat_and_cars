<?php
function respond($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        respond(['success' => false, 'error' => 'يجب تسجيل الدخول']);
    }
    return $_SESSION['user_id'];
}

function requireAdmin($pdo) {
    $userId = requireAuth();
    $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || !in_array($user['role'], ['admin', 'super_admin'])) {
        respond(['success' => false, 'error' => 'ليس لديك صلاحيات']);
    }
    return $userId;
}

function getInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

function generateId($prefix = '') {
    return $prefix . round(microtime(true) * 1000) . rand(100, 999);
}