-- ============================================
-- Fix: Allow NULL phone but require it for orders
-- ============================================

USE food_cms;
GO

PRINT '========================================';
PRINT 'Fixing phone column with index...';
PRINT '========================================';
PRINT '';

-- Step 1: Drop the index first
PRINT '1️⃣ Dropping index idx_profiles_phone...';
DROP INDEX IF EXISTS idx_profiles_phone ON profiles;
GO
PRINT '   ✅ Index dropped';
PRINT '';

-- Step 2: Alter password_hash
PRINT '2️⃣ Fixing password_hash...';
ALTER TABLE users
ALTER COLUMN password_hash VARCHAR(255) NULL;
GO
PRINT '   ✅ password_hash now allows NULL';
PRINT '';

-- Step 3: Alter phone column
PRINT '3️⃣ Fixing phone column...';
ALTER TABLE profiles
ALTER COLUMN phone VARCHAR(20) NULL;
GO
PRINT '   ✅ phone now allows NULL';
PRINT '';

-- Step 4: Recreate index (only for non-NULL values)
PRINT '4️⃣ Recreating index (optimized)...';
CREATE NONCLUSTERED INDEX idx_profiles_phone 
ON profiles(phone) 
WHERE phone IS NOT NULL;
GO
PRINT '   ✅ Index recreated (filtered)';
PRINT '';

-- Verify
PRINT '========================================';
PRINT '✅ SUCCESS!';
PRINT '========================================';
PRINT '';

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    IS_NULLABLE,
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '✅ FIXED'
        ELSE '❌ PROBLEM'
    END as Status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE 
    (TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
    OR
    (TABLE_NAME = 'profiles' AND COLUMN_NAME = 'phone');
GO

PRINT '';
PRINT '📋 Summary:';
PRINT '  ✅ password_hash → NULL allowed';
PRINT '  ✅ phone → NULL allowed (for Google users)';
PRINT '  ✅ Index recreated (optimized)';
PRINT '';
PRINT '🎯 Next: Backend will require phone for orders';
PRINT '';
GO

