<?php
require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);

$stats = [
    'users' => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
    'listings' => (int)$pdo->query('SELECT COUNT(*) FROM listings')->fetchColumn(),
    'pending' => (int)$pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'pending'")->fetchColumn(),
    'active' => (int)$pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'active'")->fetchColumn(),
    'featured' => (int)$pdo->query('SELECT COUNT(*) FROM listings WHERE is_featured = 1')->fetchColumn(),
];

respond(['success' => true, 'stats' => $stats]);
