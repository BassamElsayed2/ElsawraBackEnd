-- Create branches table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'branches')
BEGIN
    CREATE TABLE branches (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name_ar NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        address_ar NVARCHAR(500) NOT NULL,
        address_en NVARCHAR(500) NOT NULL,
        phone NVARCHAR(20),
        
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        image_url NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );

    -- Create indexes
    CREATE INDEX idx_branches_is_active ON branches(is_active);
    CREATE INDEX idx_branches_created_at ON branches(created_at DESC);
    
    PRINT 'Branches table created successfully';
END
ELSE
BEGIN
    PRINT 'Branches table already exists';
END
GO



