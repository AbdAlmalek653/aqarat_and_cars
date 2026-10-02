<?php
/**
 * API: إحصائيات لوحة التحكم (Chart.js) - نسخة التشخيص
 */

require_once 'config.php';
require_once 'helpers.php';

requireAdmin($pdo);

try {
    // ✅ 1. اختبار الاتصال بقاعدة البيانات
    $stmt = $pdo->query("SELECT COUNT(*) FROM listings");
    $totalListings = (int)$stmt->fetchColumn();

    // ✅ 2. اختبار بنية جدول listings
    $stmt = $pdo->query("PRAGMA table_info(listings)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'name');

    // ✅ 3. اختبار بنية جدول users
    $stmt = $pdo->query("PRAGMA table_info(users)");
    $userColumns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $userColumnNames = array_column($userColumns, 'name');

    // ✅ 4. اختبار عيّنة من البيانات
    $stmt = $pdo->query("SELECT * FROM listings LIMIT 1");
    $sampleListing = $stmt->fetch(PDO::FETCH_ASSOC);

    // ✅ 5. اختبار صيغة created_at
    $stmt = $pdo->query("SELECT created_at FROM listings WHERE created_at IS NOT NULL LIMIT 5");
    $sampleDates = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // ✅ إرجاع كل معلومات التشخيص
    respond([
        'success' => true,
        'diagnostics' => [
            'total_listings' => $totalListings,
            'listings_columns' => $columnNames,
            'users_columns' => $userColumnNames,
            'sample_listing' => $sampleListing,
            'sample_dates' => $sampleDates,
            'driver' => $pdo->getAttribute(PDO::ATTR_DRIVER_NAME),
            'sqlite_version' => $pdo->query('SELECT sqlite_version()')->fetchColumn(),
        ]
    ]);

} catch (Throwable $e) {
    respond([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'trace' => explode("\n", $e->getTraceAsString())[0] ?? ''
    ]);
}