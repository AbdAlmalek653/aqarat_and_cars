<?php
require_once 'config.php';
require_once 'helpers.php';

$data = getInput();
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) respond(['success' => false, 'error' => 'بيانات ناقصة']);

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) respond(['success' => false, 'error' => 'لا يوجد حساب بهذا البريد']);
if (!password_verify($password, $user['password_hash'])) respond(['success' => false, 'error' => 'كلمة المرور غير صحيحة']);

$_SESSION['user_id'] = $user['id'];

respond([
    'success' => true,
    'user' => [
        'id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        'phone' => $user['phone'], 'role' => $user['role']
    ]
]);