-- ============================================================
-- إضافة max_delivery_distance_km بطريقة آمنة 100%
-- ============================================================

-- الخطوة 1: التحقق من وجود الجدول
IF OBJECT_ID('delivery_fees_config', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: الجدول delivery_fees_config غير موجود!';
    RAISERROR('الجدول غير موجود', 16, 1);
END
ELSE
BEGIN
    PRINT '✅ الجدول delivery_fees_config موجود';
END

-- الخطوة 2: إضافة العمود إذا لم يكن موجوداً
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('delivery_fees_config') 
    AND name = 'max_delivery_distance_km'
)
BEGIN
    -- استخدام Dynamic SQL لتجنب مشكلة التحقق المسبق
    EXEC sp_executesql N'
        ALTER TABLE delivery_fees_config 
        ADD max_delivery_distance_km DECIMAL(10, 2) NULL
    ';
    
    PRINT '✅ تم إضافة العمود max_delivery_distance_km';
END
ELSE
BEGIN
    PRINT '⚠️ العمود max_delivery_distance_km موجود بالفعل';
END

-- الخطوة 3: تحديث القيم (استخدام Dynamic SQL أيضاً)
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('delivery_fees_config') 
    AND name = 'max_delivery_distance_km'
)
BEGIN
    EXEC sp_executesql N'
        UPDATE delivery_fees_config 
        SET max_delivery_distance_km = 30.0
        WHERE max_delivery_distance_km IS NULL
    ';
    
    PRINT '✅ تم تحديث القيم الافتراضية';
END

-- الخطوة 4: عرض النتيجة
PRINT '';
PRINT '======================================';
PRINT '📊 بنية الجدول:';
PRINT '======================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_fees_config'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '======================================';
PRINT '📋 البيانات:';
PRINT '======================================';
SELECT * FROM delivery_fees_config;

PRINT '';
PRINT '✅ تم الانتهاء بنجاح!';

