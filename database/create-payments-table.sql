-- Create payments table for tracking payment transactions

-- Check if table exists and drop if needed
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing payments table...';
    DROP TABLE dbo.payments;
END
GO

-- Create payments table
CREATE TABLE dbo.payments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency NVARCHAR(10) NOT NULL DEFAULT 'EGP',
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    provider NVARCHAR(50) NOT NULL DEFAULT 'easykash',
    transaction_id NVARCHAR(255) NULL,
    reference_number NVARCHAR(255) NULL,
    callback_data NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    -- Foreign key constraints
    CONSTRAINT FK_payments_order FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE,
    
    CONSTRAINT FK_payments_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE NO ACTION,
    
    -- Check constraints
    CONSTRAINT CHK_payment_status CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')
    ),
    
    CONSTRAINT CHK_payment_amount CHECK (amount > 0)
);
GO

-- Create indexes for better query performance
CREATE INDEX IX_payments_order_id ON dbo.payments(order_id);
CREATE INDEX IX_payments_user_id ON dbo.payments(user_id);
CREATE INDEX IX_payments_status ON dbo.payments(status);
CREATE INDEX IX_payments_transaction_id ON dbo.payments(transaction_id);
CREATE INDEX IX_payments_created_at ON dbo.payments(created_at DESC);
GO

-- Add payment_status and payment_method columns to orders table if they don't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.orders') 
    AND name = 'payment_status'
)
BEGIN
    PRINT 'Adding payment_status column to orders table...';
    ALTER TABLE dbo.orders 
    ADD payment_status NVARCHAR(50) NULL DEFAULT 'pending';
    
    ALTER TABLE dbo.orders
    ADD CONSTRAINT CHK_payment_status CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    );
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.orders') 
    AND name = 'payment_method'
)
BEGIN
    PRINT 'Adding payment_method column to orders table...';
    ALTER TABLE dbo.orders 
    ADD payment_method NVARCHAR(50) NULL DEFAULT 'cash';
END
GO

-- Update existing orders to have default payment status
UPDATE dbo.orders 
SET payment_status = 'pending'
WHERE payment_status IS NULL;
GO

UPDATE dbo.orders 
SET payment_method = 'cash'
WHERE payment_method IS NULL;
GO

-- Create a trigger to update payment updated_at timestamp
CREATE OR ALTER TRIGGER trg_payments_update_timestamp
ON dbo.payments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.payments
    SET updated_at = GETDATE()
    FROM dbo.payments p
    INNER JOIN inserted i ON p.id = i.id;
END;
GO

PRINT 'Payments table created successfully!';
PRINT 'Indexes created successfully!';
PRINT 'Orders table updated with payment columns!';
PRINT 'Trigger created successfully!';



