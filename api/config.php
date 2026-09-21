<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200 );
    exit;
}

$dbPath = __DIR__ . '/../database/souq.db';
$isNewDatabase = !is_file($dbPath);

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');

    if ($isNewDatabase) {
        $schemaPath = __DIR__ . '/../database/schema.sql';
        $schema = file_get_contents($schemaPath);
        if ($schema === false) {
            throw new RuntimeException('تعذر قراءة مخطط قاعدة البيانات');
        }
        $pdo->exec($schema);
    }
} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500 );
    echo json_encode([
        'success' => false,
        'error' => 'تعذر الاتصال بقاعدة البيانات'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
