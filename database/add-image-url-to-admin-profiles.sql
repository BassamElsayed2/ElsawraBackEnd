-- Add image_url column to admin_profiles table
USE elsawraDb;
GO

-- Check if column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'admin_profiles') 
    AND name = 'image_url'
)
BEGIN
    ALTER TABLE admin_profiles
    ADD image_url NVARCHAR(500) NULL;
    
    PRINT '✅ Column image_url added to admin_profiles table successfully!';
END
ELSE
BEGIN
    PRINT 'ℹ️  Column image_url already exists in admin_profiles table.';
END
GO

