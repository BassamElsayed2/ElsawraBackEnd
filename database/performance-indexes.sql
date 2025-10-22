-- =====================================================
-- Performance Indexes for Dashboard
-- تحسينات الأداء لصفحة Dashboard
-- =====================================================
-- تاريخ الإنشاء: أكتوبر 2025
-- الغرض: تسريع استعلامات Dashboard
-- =====================================================

USE [ElSawra_Restaurant]; -- غير اسم قاعدة البيانات حسب الحاجة
GO

PRINT '🚀 بدء إضافة Indexes لتحسين الأداء...';
GO

-- =====================================================
-- 1. Indexes لجدول Orders
-- =====================================================

PRINT '📊 إضافة indexes لجدول Orders...';

-- Index للبحث السريع بالتاريخ (لترتيب الطلبات الأخيرة)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_created_at' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_orders_created_at 
    ON orders(created_at DESC);
    PRINT '✅ تم إضافة: idx_orders_created_at';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_orders_created_at';

-- Index للبحث بالحالة (لإحصائيات الطلبات)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_status' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_orders_status 
    ON orders(status);
    PRINT '✅ تم إضافة: idx_orders_status';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_orders_status';

-- Index للبحث بمعرف المستخدم
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_user_id' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_orders_user_id 
    ON orders(user_id);
    PRINT '✅ تم إضافة: idx_orders_user_id';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_orders_user_id';

-- Index مركب للاستعلامات المعقدة (الحالة + التاريخ)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_status_created' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_orders_status_created 
    ON orders(status, created_at DESC)
    INCLUDE (total, user_id, branch_id);
    PRINT '✅ تم إضافة: idx_orders_status_created (مع INCLUDE)';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_orders_status_created';

-- Index للبحث بمعرف الفرع
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_branch_id' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_orders_branch_id 
    ON orders(branch_id);
    PRINT '✅ تم إضافة: idx_orders_branch_id';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_orders_branch_id';

GO

-- =====================================================
-- 2. Indexes لجدول Products
-- =====================================================

PRINT '📦 إضافة indexes لجدول Products...';

-- Index للبحث بالفئة
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_category_id' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_products_category_id 
    ON products(category_id);
    PRINT '✅ تم إضافة: idx_products_category_id';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_products_category_id';

-- Index للمنتجات النشطة
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_is_active' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_products_is_active 
    ON products(is_active);
    PRINT '✅ تم إضافة: idx_products_is_active';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_products_is_active';

-- Index للبحث بالتاريخ
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_created_at' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_products_created_at 
    ON products(created_at DESC);
    PRINT '✅ تم إضافة: idx_products_created_at';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_products_created_at';

GO

-- =====================================================
-- 3. Indexes لجدول Users
-- =====================================================

PRINT '👥 إضافة indexes لجدول Users...';

-- Index للبحث بالبريد الإلكتروني
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_users_email 
    ON users(email);
    PRINT '✅ تم إضافة: idx_users_email';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_users_email';

-- Index للبحث برقم الهاتف
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_phone' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_users_phone 
    ON users(phone);
    PRINT '✅ تم إضافة: idx_users_phone';
END
ELSE
    PRINT '⚠️ موجود بالفعل: idx_users_phone';

GO

-- =====================================================
-- 4. تحديث إحصائيات الجداول
-- =====================================================

PRINT '📈 تحديث إحصائيات الجداول...';

UPDATE STATISTICS orders WITH FULLSCAN;
PRINT '✅ تم تحديث: orders statistics';

UPDATE STATISTICS products WITH FULLSCAN;
PRINT '✅ تم تحديث: products statistics';

UPDATE STATISTICS users WITH FULLSCAN;
PRINT '✅ تم تحديث: users statistics';

GO

-- =====================================================
-- 5. تحليل تجزئة الـ Indexes (اختياري)
-- =====================================================

PRINT '🔍 تحليل تجزئة الـ Indexes...';

SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent,
    ips.page_count,
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN '❌ يحتاج إعادة بناء'
        WHEN ips.avg_fragmentation_in_percent > 10 THEN '⚠️ يحتاج إعادة تنظيم'
        ELSE '✅ جيد'
    END AS Status
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 5
    AND OBJECT_NAME(ips.object_id) IN ('orders', 'products', 'users')
ORDER BY ips.avg_fragmentation_in_percent DESC;

GO

-- =====================================================
-- 6. معلومات الـ Indexes المضافة
-- =====================================================

PRINT '📋 ملخص الـ Indexes المضافة:';

SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    p.rows AS RowCount
FROM sys.indexes i
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
WHERE OBJECT_NAME(i.object_id) IN ('orders', 'products', 'users')
    AND i.name IS NOT NULL
ORDER BY TableName, IndexName;

GO

PRINT '';
PRINT '═══════════════════════════════════════════════════════';
PRINT '✅ اكتمل إضافة جميع الـ Indexes بنجاح!';
PRINT '═══════════════════════════════════════════════════════';
PRINT '';
PRINT '📊 النتائج المتوقعة:';
PRINT '  - تسريع استعلامات Dashboard بنسبة 50-90%';
PRINT '  - تحسين وقت استجابة API';
PRINT '  - تقليل استهلاك CPU';
PRINT '';
PRINT '⚠️ ملاحظات:';
PRINT '  - قد يستغرق إضافة Indexes وقتاً على جداول كبيرة';
PRINT '  - يُنصح بتنفيذ هذا خارج أوقات الذروة';
PRINT '  - راقب أداء النظام بعد الإضافة';
PRINT '';
PRINT '🔄 الخطوة التالية:';
PRINT '  - أعد تشغيل Backend';
PRINT '  - اختبر Dashboard';
PRINT '  - راقب سرعة التحميل';
PRINT '';
GO

