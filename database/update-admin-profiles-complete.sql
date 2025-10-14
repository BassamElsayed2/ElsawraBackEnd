-- ============================================================
-- Add all missing fields to admin_profiles table
-- ============================================================
USE elsawraDb;
GO

PRINT '';
PRINT '========================================';
PRINT 'تحديث جدول admin_profiles';
PRINT '========================================';
PRINT '';

-- Add job_title column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'job_title'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD job_title NVARCHAR(255) NULL;
    PRINT '✅ تمت إضافة عمود job_title';
END
ELSE
BEGIN
    PRINT 'ℹ️  عمود job_title موجود بالفعل';
END
GO

-- Add address column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'address'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD address NVARCHAR(500) NULL;
    PRINT '✅ تمت إضافة عمود address';
END
ELSE
BEGIN
    PRINT 'ℹ️  عمود address موجود بالفعل';
END
GO

-- Add about column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'about'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD about NVARCHAR(MAX) NULL;
    PRINT '✅ تمت إضافة عمود about';
END
ELSE
BEGIN
    PRINT 'ℹ️  عمود about موجود بالفعل';
END
GO

-- Add image_url column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'image_url'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD image_url NVARCHAR(500) NULL;
    PRINT '✅ تمت إضافة عمود image_url';
END
ELSE
BEGIN
    PRINT 'ℹ️  عمود image_url موجود بالفعل';
END
GO

PRINT '';
PRINT '========================================';
PRINT '✅ تم التحديث بنجاح!';
PRINT '========================================';
PRINT '';

-- Display table structure
PRINT 'هيكل الجدول الحالي:';
SELECT 
    COLUMN_NAME as 'اسم العمود',
    DATA_TYPE as 'النوع',
    CHARACTER_MAXIMUM_LENGTH as 'الحجم',
    IS_NULLABLE as 'يقبل NULL'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'admin_profiles'
ORDER BY ORDINAL_POSITION;
GO

