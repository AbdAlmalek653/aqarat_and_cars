<?php
require_once 'config.php';
require_once 'helpers.php';

try {
    // ==========================================
    // 1) تعديل القيد CHECK ليسمح بـ super_admin
    // ==========================================
    
    // اكتشاف نوع قاعدة البيانات
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
    
    if ($driver === 'mysql') {
        // MySQL: حذف القيد القديم وإضافة الجديد
        try {
            $pdo->exec("ALTER TABLE users DROP CHECK users_role_check");
        } catch (Exception $e) {
            // تجاهل إذا لم يكن موجوداً
        }
        
        try {
            $pdo->exec("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'agent', 'admin', 'super_admin'))");
        } catch (Exception $e) {
            // قد يكون القيد مطبقاً بالفعل
        }
        
    } elseif ($driver === 'sqlite') {
        // SQLite: نحتاج لإعادة إنشاء الجدول
        // لكن غالباً السيرفر يستخدم MySQL، نتخطى
        
    } elseif ($driver === 'pgsql') {
        // PostgreSQL
        try {
            $pdo->exec("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            $pdo->exec("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'agent', 'admin', 'super_admin'))");
        } catch (Exception $e) {
            // تجاهل
        }
    }
    
    // ==========================================
    // 2) إنشاء حسابات الأدمن
    // ==========================================
    
    $admins = [
        ['id' => 'ADMIN_SUPER_001', 'name' => 'أبو أيمن', 'email' => 'ahmadkhleef9900@gmail.com', 'password' => 'Ahmad112111', 'role' => 'super_admin'],
        ['id' => 'ADMIN_002', 'name' => 'أبو برهو', 'email' => 'ahmadGh9900@gmail.com', 'password' => 'AhmadGh112111', 'role' => 'admin'],
        ['id' => 'ADMIN_003', 'name' => 'أبو فاروق', 'email' => 'abdmlk9900@gmail.com', 'password' => 'Abdmlk112111', 'role' => 'super_admin'],
    ];

    $results = [];

    foreach ($admins as $admin) {
        $pdo->prepare('DELETE FROM users WHERE email = ?')->execute([$admin['email']]);
        
        $hash = password_hash($admin['password'], PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$admin['id'], $admin['name'], $admin['email'], '', $hash, $admin['role']]);
        
        $results[] = ['name' => $admin['name'], 'email' => $admin['email'], 'role' => $admin['role']];
    }

    respond([
        'success' => true,
        'message' => 'تم إنشاء حسابات الأدمن بنجاح (مع دعم super_admin)',
        'driver' => $driver,
        'admins' => $results
    ]);
    
} catch (Exception $e) {
    respond([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}