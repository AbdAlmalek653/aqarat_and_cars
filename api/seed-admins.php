<?php
require_once 'config.php';
require_once 'helpers.php';

$admins = [
    ['id' => 'ADMIN_SUPER_001', 'name' => 'أبو أيمن', 'email' => 'ahmadkhleef9900@gmail.com', 'password' => 'Ahmad112111', 'role' => 'super_admin'],
    ['id' => 'ADMIN_002', 'name' => 'أبو برهو', 'email' => 'ahmadGh9900@gmail.com', 'password' => 'AhmadGh112111', 'role' => 'admin'],
    ['id' => 'ADMIN_003', 'name' => 'أبو فاروق', 'email' => 'abdmlk9900@gmail.com', 'password' => 'Abdmlk112111', 'role' => 'super_admin'],
];

$results = [];

foreach ($admins as $admin) {
    $pdo->prepare('DELETE FROM users WHERE email = ?')->execute([$admin['email']]);
    
    $hash = password_hash($admin['password'], PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$admin['id'], $admin['name'], $admin['email'], '', $hash, $admin['role']]);
    
    $results[] = ['name' => $admin['name'], 'email' => $admin['email'], 'role' => $admin['role']];
}

respond(['success' => true, 'message' => 'تم إنشاء حسابات الأدمن', 'admins' => $results]);