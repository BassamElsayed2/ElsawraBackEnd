-- ============================================
-- Complete Fix: Google OAuth Support
-- ============================================
-- Fix both password_hash and phone to allow NULL
-- Users can add phone number later from profile page

USE food_cms;
GO

PRINT '========================================';
PRINT 'Google OAuth Complete Fix';
PRINT '========================================';
PRINT '';

-- ============================================
-- Step 1: Fix users.password_hash
-- ============================================
PRINT '1️⃣ Fixing password_hash column...';

-- Check current state
SELECT 
    '❌ Before: ' + COLUMN_NAME as Info,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_hash';

-- Allow NULL for Google OAuth users
ALTER TABLE users
ALTER COLUMN password_hash VARCHAR(255) NULL;
GO

-- Verify change
SELECT 
    '✅ After: ' + COLUMN_NAME as Info,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_hash';
GO

PRINT 'password_hash: ✅ Now allows NULL';
PRINT '';

-- ============================================
-- Step 2: Fix profiles.phone
-- ============================================
PRINT '2️⃣ Fixing phone column...';

-- Check current state
SELECT 
    '❌ Before: ' + COLUMN_NAME as Info,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'profiles' 
  AND COLUMN_NAME = 'phone';

-- Allow NULL - user can add phone later
ALTER TABLE profiles
ALTER COLUMN phone VARCHAR(20) NULL;
GO

-- Verify change
SELECT 
    '✅ After: ' + COLUMN_NAME as Info,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'profiles' 
  AND COLUMN_NAME = 'phone';
GO

PRINT 'phone: ✅ Now allows NULL';
PRINT '';

-- ============================================
-- Step 3: Add Security Constraints (Optional)
-- ============================================
PRINT '3️⃣ Adding security constraints...';

-- Drop existing constraint if exists
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_users_auth_method')
BEGIN
    ALTER TABLE users DROP CONSTRAINT CK_users_auth_method;
    PRINT '  - Dropped old CK_users_auth_method';
END

-- Add constraint: NULL password only for verified emails (Google users)
ALTER TABLE users
ADD CONSTRAINT CK_users_auth_method 
CHECK (
    password_hash IS NOT NULL  -- Regular users must have password
    OR 
    (password_hash IS NULL AND email_verified = 1)  -- Google users must have verified email
);
GO

PRINT '  - Added CK_users_auth_method constraint ✅';
PRINT '';

-- ============================================
-- Step 4: Verify Everything
-- ============================================
PRINT '4️⃣ Final verification...';
PRINT '';

SELECT 
    'users' as [Table],
    'password_hash' as [Column],
    IS_NULLABLE,
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '✅ FIXED'
        ELSE '❌ PROBLEM'
    END as [Status]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_hash'

UNION ALL

SELECT 
    'profiles' as [Table],
    'phone' as [Column],
    IS_NULLABLE,
    CASE 
        WHEN IS_NULLABLE = 'YES' THEN '✅ FIXED'
        ELSE '❌ PROBLEM'
    END as [Status]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'profiles' 
  AND COLUMN_NAME = 'phone';
GO

-- ============================================
-- Summary
-- ============================================
PRINT '';
PRINT '========================================';
PRINT '✅ SUCCESS! Database Updated';
PRINT '========================================';
PRINT '';
PRINT '📋 Changes Applied:';
PRINT '  1. password_hash → NULL allowed (Google users)';
PRINT '  2. phone → NULL allowed (add later)';
PRINT '  3. Security constraints → Added';
PRINT '';
PRINT '🎉 Google OAuth is now fully supported!';
PRINT '';
PRINT '📝 User Types:';
PRINT '  • Regular: email + password + phone (optional)';
PRINT '  • Google:  email + verified (phone optional)';
PRINT '';
PRINT '🚀 Next Steps:';
PRINT '  1. Restart backend server';
PRINT '  2. Test Google Sign-In';
PRINT '  3. User can add phone from profile page';
PRINT '';
GO

