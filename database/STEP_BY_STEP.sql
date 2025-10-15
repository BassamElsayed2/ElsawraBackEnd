-- ============================================================
-- نفذ هذه الأوامر واحد تلو الآخر (اضغط F5 بعد كل أمر)
-- ============================================================

-- الأمر 1: تحقق من وجود الجدول
-- نفذ هذا أولاً ثم تحقق من النتيجة
SELECT 'الجدول موجود' AS Status 
FROM sys.tables 
WHERE name = 'delivery_fees_config';
GO

-- الأمر 2: تحقق من الأعمدة الموجودة
-- نفذ هذا ثانياً
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_fees_config';
GO

-- الأمر 3: أضف العمود
-- نفذ هذا ثالثاً
ALTER TABLE delivery_fees_config 
ADD max_delivery_distance_km DECIMAL(10, 2) NULL;
GO

-- الأمر 4: حدث القيم
-- نفذ هذا رابعاً
UPDATE delivery_fees_config 
SET max_delivery_distance_km = 30.0;
GO

-- الأمر 5: تحقق من النتيجة
-- نفذ هذا أخيراً
SELECT * FROM delivery_fees_config;
GO

