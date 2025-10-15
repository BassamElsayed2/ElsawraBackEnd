-- التحقق من وجود عمود max_delivery_distance_km وإضافته إذا لم يكن موجوداً

-- 1. التحقق من بنية الجدول
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_fees_config';
GO

-- 2. إضافة العمود إذا لم يكن موجوداً
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('delivery_fees_config') 
    AND name = 'max_delivery_distance_km'
)
BEGIN
    ALTER TABLE delivery_fees_config 
    ADD max_delivery_distance_km DECIMAL(10, 2) DEFAULT 30.0;
    
    PRINT '✅ تم إضافة عمود max_delivery_distance_km';
END
ELSE
BEGIN
    PRINT '✅ العمود max_delivery_distance_km موجود بالفعل';
END
GO

-- 3. التحقق مرة أخرى
SELECT TOP 1 * FROM delivery_fees_config;
GO

