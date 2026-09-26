<?php

declare(strict_types=1);

$dbPath = '/var/www/html/database/souq.db';

if (!is_file($dbPath)) {
    exit("Database not found: {$dbPath}\n");
}

$backupPath = $dbPath . '.backup-' . date('Ymd-His');

if (!copy($dbPath, $backupPath)) {
    exit("Could not create database backup.\n");
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $schema = $pdo
        ->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
        ->fetchColumn();

    if (!$schema) {
        throw new RuntimeException('users table does not exist');
    }

    if (stripos($schema, 'super_admin') !== false) {
        echo "Migration already applied.\n";
        exit(0);
    }

    $pdo->exec('PRAGMA foreign_keys = OFF');
    $pdo->exec('BEGIN IMMEDIATE');

    $pdo->exec("
        CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user'
                CHECK(role IN ('user', 'agent', 'admin', 'super_admin')),
            avatar_url TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("
        INSERT INTO users_new (
            id,
            name,
            email,
            phone,
            password_hash,
            role,
            avatar_url,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            id,
            name,
            email,
            phone,
            password_hash,
            CASE
                WHEN role IN ('user', 'agent', 'admin', 'super_admin')
                    THEN role
                ELSE 'user'
            END,
            avatar_url,
            COALESCE(is_active, 1),
            created_at,
            updated_at
        FROM users
    ");

    $pdo->exec('DROP TABLE users');
    $pdo->exec('ALTER TABLE users_new RENAME TO users');

    $pdo->exec('COMMIT');
    $pdo->exec('PRAGMA foreign_keys = ON');

    echo "Migration completed successfully.\n";
    echo "Backup: {$backupPath}\n";

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->exec('ROLLBACK');
    }

    if (isset($pdo)) {
        $pdo->exec('PRAGMA foreign_keys = ON');
    }

    echo "Migration failed: " . $e->getMessage() . "\n";
    echo "Backup: {$backupPath}\n";
    exit(1);
}
