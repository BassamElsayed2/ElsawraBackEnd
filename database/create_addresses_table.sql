-- Create addresses table for user delivery addresses
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'addresses')
BEGIN
    CREATE TABLE addresses (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        title NVARCHAR(100) NOT NULL,
        street NVARCHAR(255) NOT NULL,
        building NVARCHAR(50),
        floor NVARCHAR(20),
        apartment NVARCHAR(20),
        city NVARCHAR(100) NOT NULL,
        area NVARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        notes NVARCHAR(500),
        is_default BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_addresses_users FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Create index on user_id for faster queries
    CREATE INDEX IX_addresses_user_id ON addresses(user_id);
    
    -- Create index on is_default
    CREATE INDEX IX_addresses_is_default ON addresses(is_default);
    
    PRINT 'Addresses table created successfully';
END
ELSE
BEGIN
    PRINT 'Addresses table already exists';
END
GO

