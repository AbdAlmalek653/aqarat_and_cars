<?php
require_once 'config.php';
require_once 'helpers.php';

if (!isset($_SESSION['user_id'])) respond(['success' => false, 'error' => 'غير مسجل']);

$stmt = $pdo->prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
respond(['success' => true, 'user' => $stmt->fetch()]);