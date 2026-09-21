<?php
require_once 'config.php';
require_once 'helpers.php';

$userId = requireAdmin($pdo);
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$current = $stmt->fetch();

if (!$current || $current['role'] !== 'super_admin') {
    respond(['success' => false, 'error' => 'هذه العملية متاحة للسوبر أدمن فقط']);
}

$users = $pdo->query(
    'SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
            COUNT(l.id) AS listings_count
     FROM users u
     LEFT JOIN listings l ON l.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC'
)->fetchAll();

foreach ($users as &$user) {
    $user['is_active'] = (bool)$user['is_active'];
    $user['listings_count'] = (int)$user['listings_count'];
}

respond(['success' => true, 'users' => $users]);
