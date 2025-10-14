-- ========================================
-- إنشاء Database elsawraDb
-- ========================================

-- Check if database exists, if not create it
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'elsawraDb')
BEGIN
    CREATE DATABASE elsawraDb;
    PRINT '✅ تم إنشاء Database: elsawraDb';
END
ELSE
BEGIN
    PRINT '⚠️  Database elsawraDb موجودة مسبقاً';
END
GO

