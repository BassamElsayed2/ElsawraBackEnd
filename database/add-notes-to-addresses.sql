-- Add notes column to addresses table if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('addresses') 
    AND name = 'notes'
)
BEGIN
    ALTER TABLE addresses
    ADD notes NVARCHAR(500) NULL;
    
    PRINT 'Notes column added to addresses table successfully';
END
ELSE
BEGIN
    PRINT 'Notes column already exists in addresses table';
END

