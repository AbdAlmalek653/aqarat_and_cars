<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);
$data = getInput();
$id = $data['id'] ?? '';
if (!$id) respond(['success' => false, 'error' => 'معرف مطلوب']);

$pdo->prepare('DELETE FROM listings WHERE id = ?')->execute([$id]);
respond(['success' => true]);