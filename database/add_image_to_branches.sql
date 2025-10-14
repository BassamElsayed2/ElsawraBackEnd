-- Add image_url column to branches table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('branches') 
    AND name = 'image_url'
)
BEGIN
    ALTER TABLE branches
    ADD image_url NVARCHAR(500) NULL;
    
    PRINT 'image_url column added to branches table';
END
ELSE
BEGIN
    PRINT 'image_url column already exists in branches table';
END
GO

