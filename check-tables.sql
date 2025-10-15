-- التحقق من الجداول الموجودة
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%delivery%'
ORDER BY TABLE_NAME;

-- بنية delivery_fees_config
SELECT 'delivery_fees_config' as TableName, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_fees_config'
UNION ALL
-- بنية delivery_zones
SELECT 'delivery_zones' as TableName, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'delivery_zones';
