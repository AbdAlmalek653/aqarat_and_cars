<?php
require_once 'config.php';
require_once 'helpers.php';

try {
    error_log('ADMIN SEED VERSION 2026-09-26-1206');

    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    /*
     * ملاحظة:
     * يجب أن يكون قيد role في قاعدة SQLite مسموحاً فيه:
     * user, agent, admin, super_admin
     *
     * لا يمكن تعديل CHECK في SQLite مباشرة باستخدام ALTER TABLE.
     * لذلك يجب تحديث مخطط قاعدة البيانات مرة واحدة قبل تشغيل هذا الملف.
     */

    $admins = [
        [
            'id' => 'ADMIN_SUPER_001',
            'name' => 'أبو أيمن',
            'email' => 'ahmadkhleef9900@gmail.com',
            'password' => 'Ahmad112111',
            'role' => 'super_admin'
        ],
        [
            'id' => 'ADMIN_002',
            'name' => 'أبو برهو',
            'email' =>  'ahmadGh9900@gmail.com',
            'password' => 'AhmadGh112111',
            'role' => 'admin'
        ],
        [
            'id' => 'ADMIN_003',
            'name' => 'أبو فاروق',
            'email' => 'abdmlk9900@gmail.com',
            'password' => 'Abdmlk112111',
            'role' => 'admin'
        ]
    ];

    $results = [];

    $pdo->beginTransaction();

    foreach ($admins as $admin) {
        $check = $pdo->prepare(
            'SELECT id FROM users WHERE email = ? LIMIT 1'
        );
        $check->execute([$admin['email']]);
        $existing = $check->fetch();

        $passwordHash = password_hash(
            $admin['password'],
            PASSWORD_DEFAULT
        );

        if ($existing) {
            $update = $pdo->prepare(
                'UPDATE users
                 SET name = ?,
                     phone = ?,
                     password_hash = ?,
                     role = ?
                 WHERE email = ?'
            );

            $update->execute([
                $admin['name'],
                '',
                $passwordHash,
                $admin['role'],
                $admin['email']
            ]);
        } else {
            $insert = $pdo->prepare(
                'INSERT INTO users
                 (id, name, email, phone, password_hash, role)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );

            $insert->execute([
                $admin['id'],
                $admin['name'],
                $admin['email'],
                '',
                $passwordHash,
                $admin['role']
            ]);
        }

        $results[] = [
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role']
        ];
    }

    $pdo->commit();

    respond([
        'success' => true,
        'message' => 'تم إنشاء أو تحديث حسابات الإدارة بنجاح',
        'driver' => $driver,
        'admins' => $results
    ]);

 } catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'ADMIN SEED ERROR: ' .
        $e->getMessage() .
        ' in ' .
        $e->getFile() .
        ':' .
        $e->getLine()
    );

    http_response_code(500 );

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

