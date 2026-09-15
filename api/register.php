<?php
require_once 'config.php';
require_once 'helpers.php';

$data = getInput();
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';

if (!$name || !$email || !$password) respond(['success' => false, 'error' => 'بيانات ناقصة']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['success' => false, 'error' => 'البريد غير صحيح']);
if (strlen($password) < 6) respond(['success' => false, 'error' => 'كلمة المرور قصيرة']);

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) respond(['success' => false, 'error' => 'البريد مستخدم مسبقاً']);

$userId = generateId('U');
$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare('INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, "user")');
$stmt->execute([$userId, $name, $email, $phone, $hash]);

$_SESSION['user_id'] = $userId;

respond([
    'success' => true,
    'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'phone' => $phone, 'role' => 'user']
]);