<?php

declare(strict_types=1);

$dbPath = '/var/www/html/database/souq.db';

if (!is_file($dbPath)) {
    exit("Database not found: {$dbPath}\n");
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_listings_status_created '
        . 'ON listings(status, created_at DESC)'
    );

    echo "Listing query indexes added successfully.\n";
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}