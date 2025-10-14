-- Add address, job_title, and about fields to admin_profiles table
USE elsawraDb;
GO

-- Add job_title column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'job_title'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD job_title NVARCHAR(255) NULL;
    PRINT '✅ Column job_title added to admin_profiles table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Column job_title already exists';
END
GO

-- Add address column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'address'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD address NVARCHAR(500) NULL;
    PRINT '✅ Column address added to admin_profiles table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Column address already exists';
END
GO

-- Add about column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'about'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD about NVARCHAR(MAX) NULL;
    PRINT '✅ Column about added to admin_profiles table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Column about already exists';
END
GO

PRINT '';
PRINT '✅ All profile fields added successfully!';

