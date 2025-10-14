-- Script لإنشاء مستخدم Admin مؤقت للداشبورد
-- Temporary Admin User for Dashboard

USE elsawraDb;
GO

-- المعلومات المؤقتة:
-- Email: admin@foodcms.com
-- Password: Admin@123456
-- الـ password hash أدناه هو bcrypt hash لـ "Admin@123456"

-- 1. حذف المستخدم إذا كان موجود (للتجربة)
DELETE FROM admin_profiles WHERE user_id IN (
    SELECT id FROM users WHERE email = 'admin@foodcms.com'
);
DELETE FROM profiles WHERE user_id IN (
    SELECT id FROM users WHERE email = 'admin@foodcms.com'
);
DELETE FROM users WHERE email = 'admin@foodcms.com';
GO

-- 2. إنشاء المستخدم
DECLARE @userId UNIQUEIDENTIFIER = NEWID();
DECLARE @passwordHash NVARCHAR(255) = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lh5GH8o4.vWZLN8Mu'; -- Admin@123456

INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
VALUES (
    @userId,
    'admin@foodcms.com',
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
    'مدير النظام',
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
    'مدير النظام', -- full_name
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
    'Password: Admin@123456' as temp_password
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN admin_profiles ap ON u.id = ap.user_id
WHERE u.email = 'admin@foodcms.com';

PRINT '✅ تم إنشاء مستخدم Admin مؤقت بنجاح!';
PRINT '';
PRINT '📧 Email: admin@foodcms.com';
PRINT '🔑 Password: Admin@123456';
PRINT '';
PRINT '⚠️ يرجى تغيير كلمة المرور بعد تسجيل الدخول!';
GO

