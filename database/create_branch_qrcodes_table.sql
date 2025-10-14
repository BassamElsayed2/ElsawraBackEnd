-- Create table for Branch QR Codes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'branch_qrcodes')
BEGIN
    CREATE TABLE branch_qrcodes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        branch_id UNIQUEIDENTIFIER NOT NULL,
        qr_code_url NVARCHAR(1000) NOT NULL,
        qr_code_filename NVARCHAR(255) NOT NULL,
        survey_url NVARCHAR(1000) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    PRINT '✅ Table branch_qrcodes created successfully';
END
ELSE
BEGIN
    PRINT 'ℹ️ Table branch_qrcodes already exists';
END
GO

-- Create index for faster branch lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_branch_qrcodes_branch_id')
BEGIN
    CREATE INDEX IX_branch_qrcodes_branch_id ON branch_qrcodes(branch_id);
    PRINT '✅ Index IX_branch_qrcodes_branch_id created';
END
GO

