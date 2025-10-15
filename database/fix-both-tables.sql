-- ============================================================
-- إضافة max_delivery_distance_km للجداول المناسبة
-- ============================================================

-- 1. إضافة إلى delivery_fees_config (النظام الذكي حسب المسافة)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('delivery_fees_config') 
    AND name = 'max_delivery_distance_km'
)
BEGIN
    ALTER TABLE delivery_fees_config 
    ADD max_delivery_distance_km DECIMAL(10, 2) DEFAULT 30.0;
    
    PRINT '✅ تم إضافة max_delivery_distance_km إلى delivery_fees_config';
    
    -- تحديث السجلات الموجودة
    UPDATE delivery_fees_config 
    SET max_delivery_distance_km = 30.0 
    WHERE max_delivery_distance_km IS NULL;
END
ELSE
BEGIN
    PRINT '✅ العمود موجود بالفعل في delivery_fees_config';
END
GO

-- 2. التحقق من جدول delivery_zones (اختياري)
-- إذا أردت استخدام delivery_zones بدلاً من delivery_fees_config
-- يمكنك إضافة max_delivery_distance إليه أيضاً:

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_zones')
BEGIN
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('delivery_zones') 
        AND name = 'max_delivery_distance_km'
    )
    BEGIN
        ALTER TABLE delivery_zones 
        ADD max_delivery_distance_km DECIMAL(10, 2) DEFAULT 30.0;
        
        PRINT '✅ تم إضافة max_delivery_distance_km إلى delivery_zones';
        
        UPDATE delivery_zones 
        SET max_delivery_distance_km = 30.0 
        WHERE max_delivery_distance_km IS NULL;
    END
    ELSE
    BEGIN
        PRINT '✅ العمود موجود بالفعل في delivery_zones';
    END
END
GO

-- 3. عرض بنية الجداول للتأكيد
PRINT '';
PRINT '📊 بنية delivery_fees_config:';
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_fees_config'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '📊 بنية delivery_zones (إن وجدت):';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_zones')
BEGIN
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'delivery_zones'
    ORDER BY ORDINAL_POSITION;
END
GO

PRINT '';
PRINT '✅ تم الانتهاء من التحديث!';
GO

