-- إنشاء مستخدم Admin لـ El Sawra Dashboard
-- Create Admin User for El Sawra Dashboard

USE elsawraDb;
GO

-- المعلومات:
-- Email: admin@elsawra.com
-- Password: Admin@123

-- 1. حذف المستخدم إذا كان موجود
DELETE FROM admin_profiles WHERE user_id IN (
    SELECT id FROM users WHERE email = 'admin@elsawra.com'
);
DELETE FROM profiles WHERE user_id IN (
    SELECT id FROM users WHERE email = 'admin@elsawra.com'
);
DELETE FROM users WHERE email = 'admin@elsawra.com';
GO

-- 2. إنشاء المستخدم
DECLARE @userId UNIQUEIDENTIFIER = NEWID();
-- bcrypt hash for "Admin@123" with 12 rounds
DECLARE @passwordHash NVARCHAR(255) = '$2a$12$K8QfL7Z5mX.kP9vY6yqN3OGk5BvqVHJ.xZ4N5fT6wE8pR3mQ7nL2K';

INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
VALUES (
    @userId,
    'admin@elsawra.com',
    @passwordHash,
    1, -- email verified
    GETDATE(),
    GETDATE()
);

-- 3. إنشاء Profile
INSERT INTO profiles (id, user_id, full_name, phone, phone_verified, created_at, updated_at)
VALUES (
    NEWID(),
    @userId,
    'El Sawra Admin',
    '+201234567890',
    1, -- phone verified
    GETDATE(),
    GETDATE()
);

-- 4. إنشاء Admin Profile
INSERT INTO admin_profiles (id, user_id, full_name, role, permissions, created_at, updated_at)
VALUES (
    NEWID(),
    @userId,
    'El Sawra Admin',
    'super_admin',
    '["all"]', -- جميع الصلاحيات
    GETDATE(),
    GETDATE()
);

-- 5. عرض النتيجة
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    p.phone,
    ap.role,
    'Password: Admin@123' as temp_password
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN admin_profiles ap ON u.id = ap.user_id
WHERE u.email = 'admin@elsawra.com';

PRINT '✅ تم إنشاء مستخدم Admin بنجاح!';
PRINT '';
PRINT '📧 Email: admin@elsawra.com';
PRINT '🔑 Password: Admin@123';
PRINT '';
PRINT '⚠️ يرجى تغيير كلمة المرور بعد تسجيل الدخول!';
GO

