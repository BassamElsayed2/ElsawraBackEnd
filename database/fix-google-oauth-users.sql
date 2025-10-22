-- ============================================
-- Fix: Allow NULL for password_hash to support Google OAuth users
-- ============================================
-- Users who sign in with Google don't have a password
-- so we need to allow NULL in the password_hash column

USE food_cms;
GO

-- Step 1: Check current constraint
PRINT 'Checking current password_hash column...';
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_hash';
GO

-- Step 2: Alter the column to allow NULL
PRINT 'Altering password_hash column to allow NULL...';
ALTER TABLE users
ALTER COLUMN password_hash VARCHAR(255) NULL;
GO

-- Step 3: Verify the change
PRINT 'Verifying the change...';
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_hash';
GO

-- Step 4: Add a check constraint to ensure users have either password OR are OAuth users
-- (Optional but recommended for data integrity)
PRINT 'Adding check constraint...';

-- First, drop the constraint if it exists
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_users_auth_method')
BEGIN
    ALTER TABLE users DROP CONSTRAINT CK_users_auth_method;
    PRINT 'Existing constraint dropped.';
END
GO

-- Add new constraint: password_hash can be NULL only if email_verified = 1 (OAuth users)
ALTER TABLE users
ADD CONSTRAINT CK_users_auth_method 
CHECK (
    password_hash IS NOT NULL  -- Regular users must have password
    OR 
    (password_hash IS NULL AND email_verified = 1)  -- OAuth users must have verified email
);
GO

PRINT 'Successfully updated users table to support Google OAuth!';
PRINT '';
PRINT 'Summary:';
PRINT '  - password_hash now allows NULL';
PRINT '  - Google OAuth users: password_hash = NULL, email_verified = 1';
PRINT '  - Regular users: password_hash = hashed_password, email_verified = 0/1';
GO

