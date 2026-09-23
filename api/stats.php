<?php
require_once 'config.php';
require_once 'helpers.php';

$stats = [
    'users' => (int)$pdo->query('SELECT COUNT(*) FROM users WHERE is_active = 1')->fetchColumn(),
    'listings' => (int)$pdo->query('SELECT COUNT(*) FROM listings WHERE status = \'active\'')->fetchColumn(),
    'properties' => (int)$pdo->query("SELECT COUNT(*) FROM listings WHERE type = 'property' AND status = 'active'")->fetchColumn(),
    'cars' => (int)$pdo->query("SELECT COUNT(*) FROM listings WHERE type = 'car' AND status = 'active'")->fetchColumn(),
];

respond(['success' => true, 'stats' => $stats]);
