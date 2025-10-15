-- ============================================================
-- إضافة max_delivery_distance_km بطريقة آمنة
-- ============================================================

-- الخطوة 1: التحقق من وجود الجدول
IF OBJECT_ID('delivery_fees_config', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: الجدول delivery_fees_config غير موجود!';
    PRINT 'يجب تنفيذ: npx ts-node scripts/create-delivery-fees-table.ts';
END
ELSE
BEGIN
    PRINT '✅ الجدول delivery_fees_config موجود';
    
    -- الخطوة 2: التحقق من وجود العمود
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('delivery_fees_config') 
        AND name = 'max_delivery_distance_km'
    )
    BEGIN
        -- الخطوة 3: إضافة العمود
        ALTER TABLE delivery_fees_config 
        ADD max_delivery_distance_km DECIMAL(10, 2) NULL;
        
        PRINT '✅ تم إضافة العمود max_delivery_distance_km';
        
        -- الخطوة 4: تحديث القيم
        UPDATE delivery_fees_config 
        SET max_delivery_distance_km = 30.0;
        
        PRINT '✅ تم تحديث القيم الافتراضية (30 كم)';
    END
    ELSE
    BEGIN
        PRINT '✅ العمود max_delivery_distance_km موجود بالفعل';
    END
END
GO

-- الخطوة 5: عرض النتيجة النهائية
PRINT '';
PRINT '📊 بنية الجدول الحالية:';
SELECT 
    COLUMN_NAME as [اسم العمود],
    DATA_TYPE as [نوع البيانات],
    IS_NULLABLE as [يقبل NULL]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_fees_config'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '📋 البيانات الموجودة:';
SELECT 
    min_distance_km as [من كم],
    max_distance_km as [إلى كم],
    fee as [الرسوم],
    max_delivery_distance_km as [أقصى مسافة توصيل],
    is_active as [نشط]
FROM delivery_fees_config
ORDER BY min_distance_km;

PRINT '';
PRINT '✅ تم الانتهاء بنجاح!';

