-- ============================================================
-- Stored Procedures for Food CMS
-- ============================================================

USE elsawraDb;
GO

-- ============================================================
-- 1. Record Security Event
-- ============================================================

CREATE OR ALTER PROCEDURE sp_RecordSecurityEvent
    @event_type NVARCHAR(50),
    @user_id UNIQUEIDENTIFIER = NULL,
    @email NVARCHAR(255) = NULL,
    @ip_address NVARCHAR(50) = NULL,
    @user_agent NVARCHAR(500) = NULL,
    @location NVARCHAR(MAX) = NULL,
    @details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO security_logs (
        event_type, user_id, email, ip_address, 
        user_agent, location, details
    )
    VALUES (
        @event_type, @user_id, @email, @ip_address,
        @user_agent, @location, @details
    );
END;
GO

-- ============================================================
-- 2. Check Account Lockout
-- ============================================================

CREATE OR ALTER PROCEDURE sp_CheckAccountLockout
    @identifier NVARCHAR(255),
    @is_locked BIT OUTPUT,
    @locked_until DATETIME2 OUTPUT,
    @attempts_left INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @failed_attempts INT;
    DECLARE @lockout_time DATETIME2;
    
    SELECT 
        @failed_attempts = failed_attempts,
        @lockout_time = locked_until
    FROM account_lockouts
    WHERE identifier = @identifier;
    
    -- No record found
    IF @failed_attempts IS NULL
    BEGIN
        SET @is_locked = 0;
        SET @attempts_left = 5;
        SET @locked_until = NULL;
        RETURN;
    END
    
    -- Check if locked
    IF @lockout_time IS NOT NULL AND GETDATE() < @lockout_time
    BEGIN
        SET @is_locked = 1;
        SET @locked_until = @lockout_time;
        SET @attempts_left = 0;
    END
    ELSE
    BEGIN
        SET @is_locked = 0;
        SET @locked_until = NULL;
        SET @attempts_left = CASE 
            WHEN @failed_attempts >= 5 THEN 0 
            ELSE 5 - @failed_attempts 
        END;
    END
END;
GO

-- ============================================================
-- 3. Record Failed Attempt
-- ============================================================

CREATE OR ALTER PROCEDURE sp_RecordFailedAttempt
    @identifier NVARCHAR(255),
    @max_attempts INT = 5,
    @lockout_duration_minutes INT = 15,
    @is_locked BIT OUTPUT,
    @attempts_left INT OUTPUT,
    @locked_until DATETIME2 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @current_attempts INT;
    DECLARE @current_locked_until DATETIME2;
    
    -- Check if record exists
    SELECT 
        @current_attempts = failed_attempts,
        @current_locked_until = locked_until
    FROM account_lockouts
    WHERE identifier = @identifier;
    
    IF @current_attempts IS NULL
    BEGIN
        -- Create new record
        INSERT INTO account_lockouts (
            identifier, failed_attempts, last_attempt_at
        )
        VALUES (
            @identifier, 1, GETDATE()
        );
        
        SET @is_locked = 0;
        SET @attempts_left = @max_attempts - 1;
        SET @locked_until = NULL;
    END
    ELSE
    BEGIN
        -- Update existing record
        DECLARE @new_attempts INT;
        
        -- Reset if lockout expired
        IF @current_locked_until IS NOT NULL AND GETDATE() > @current_locked_until
        BEGIN
            SET @new_attempts = 1;
        END
        ELSE
        BEGIN
            SET @new_attempts = @current_attempts + 1;
        END
        
        -- Lock account if max attempts reached
        IF @new_attempts >= @max_attempts
        BEGIN
            SET @locked_until = DATEADD(MINUTE, @lockout_duration_minutes, GETDATE());
            SET @is_locked = 1;
            SET @attempts_left = 0;
            
            UPDATE account_lockouts
            SET 
                failed_attempts = @new_attempts,
                locked_at = GETDATE(),
                locked_until = @locked_until,
                last_attempt_at = GETDATE(),
                updated_at = GETDATE()
            WHERE identifier = @identifier;
        END
        ELSE
        BEGIN
            SET @is_locked = 0;
            SET @attempts_left = @max_attempts - @new_attempts;
            SET @locked_until = NULL;
            
            UPDATE account_lockouts
            SET 
                failed_attempts = @new_attempts,
                last_attempt_at = GETDATE(),
                updated_at = GETDATE()
            WHERE identifier = @identifier;
        END
    END
END;
GO

-- ============================================================
-- 4. Clear Failed Attempts (on successful login)
-- ============================================================

CREATE OR ALTER PROCEDURE sp_ClearFailedAttempts
    @identifier NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM account_lockouts
    WHERE identifier = @identifier;
END;
GO

-- ============================================================
-- 5. Cleanup Expired OTP Codes
-- ============================================================

CREATE OR ALTER PROCEDURE sp_CleanupExpiredOTP
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM otp_codes
    WHERE expires_at < DATEADD(DAY, -1, GETDATE());
    
    SELECT @@ROWCOUNT AS deleted_count;
END;
GO

-- ============================================================
-- 6. Cleanup Expired Sessions
-- ============================================================

CREATE OR ALTER PROCEDURE sp_CleanupExpiredSessions
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM sessions
    WHERE expires_at < GETDATE();
    
    SELECT @@ROWCOUNT AS deleted_count;
END;
GO

-- ============================================================
-- 7. Create Order
-- ============================================================

CREATE OR ALTER PROCEDURE sp_CreateOrder
    @user_id UNIQUEIDENTIFIER,
    @address_id UNIQUEIDENTIFIER = NULL,
    @delivery_type NVARCHAR(20),
    @branch_id UNIQUEIDENTIFIER = NULL,
    @items NVARCHAR(MAX),
    @subtotal DECIMAL(10, 2),
    @delivery_fee DECIMAL(10, 2),
    @total DECIMAL(10, 2),
    @notes NVARCHAR(MAX) = NULL,
    @payment_method NVARCHAR(50) = 'cash',
    @order_id UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Generate new order ID
        SET @order_id = NEWID();
        
        -- Determine initial order status based on payment method
        DECLARE @initial_status NVARCHAR(20);
        DECLARE @initial_payment_status NVARCHAR(20);
        
        -- If payment method is online payment (easykash, card, etc.), set status to pending_payment
        -- Otherwise (cash, COD), set status to pending
        IF @payment_method IN ('easykash', 'card', 'online', 'wallet')
        BEGIN
            SET @initial_status = 'pending_payment';
            SET @initial_payment_status = 'pending';
        END
        ELSE
        BEGIN
            SET @initial_status = 'pending';
            SET @initial_payment_status = 'not_required';
        END
        
        -- Insert order  
        INSERT INTO orders (
            id, user_id, address_id, delivery_type, branch_id,
            status, items, subtotal, delivery_fee, total,
            notes, payment_method, payment_status
        )
        VALUES (
            @order_id, @user_id, @address_id, @delivery_type, @branch_id,
            @initial_status, @items, @subtotal, @delivery_fee, @total,
            @notes, @payment_method, @initial_payment_status
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ============================================================
-- 8. Update Order Status
-- ============================================================

CREATE OR ALTER PROCEDURE sp_UpdateOrderStatus
    @order_id UNIQUEIDENTIFIER,
    @status NVARCHAR(20),
    @updated_by UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE orders
    SET 
        status = @status,
        updated_at = GETDATE()
    WHERE id = @order_id;
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Order not found', 16, 1);
    END
END;
GO

-- ============================================================
-- 9. Get User Orders with Details
-- ============================================================

CREATE OR ALTER PROCEDURE sp_GetUserOrders
    @user_id UNIQUEIDENTIFIER,
    @page INT = 1,
    @page_size INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@page - 1) * @page_size;
    
    -- Get orders
    SELECT 
        o.*,
        a.name AS address_name,
        a.area AS address_area,
        b.name_ar AS branch_name_ar,
        b.name_en AS branch_name_en
    FROM orders o
    LEFT JOIN addresses a ON o.address_id = a.id
    LEFT JOIN branches b ON o.branch_id = b.id
    WHERE o.user_id = @user_id
    ORDER BY o.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @page_size ROWS ONLY;
    
    -- Get total count
    SELECT COUNT(*) AS total_count
    FROM orders
    WHERE user_id = @user_id;
END;
GO

-- ============================================================
-- 10. Add Password to History
-- ============================================================

CREATE OR ALTER PROCEDURE sp_AddPasswordToHistory
    @user_id UNIQUEIDENTIFIER,
    @password_hash NVARCHAR(255),
    @max_history INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert new password
    INSERT INTO password_history (user_id, password_hash)
    VALUES (@user_id, @password_hash);
    
    -- Keep only last N passwords
    DELETE FROM password_history
    WHERE user_id = @user_id
    AND id NOT IN (
        SELECT TOP (@max_history) id
        FROM password_history
        WHERE user_id = @user_id
        ORDER BY created_at DESC
    );
END;
GO

-- ============================================================
-- 11. Check Password History
-- ============================================================

CREATE OR ALTER PROCEDURE sp_CheckPasswordHistory
    @user_id UNIQUEIDENTIFIER,
    @password_hash NVARCHAR(255),
    @history_limit INT = 5,
    @exists BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT TOP (@history_limit) 1
        FROM password_history
        WHERE user_id = @user_id
        AND password_hash = @password_hash
        ORDER BY created_at DESC
    )
    BEGIN
        SET @exists = 1;
    END
    ELSE
    BEGIN
        SET @exists = 0;
    END
END;
GO

-- ============================================================
-- 12. Get Dashboard Statistics (Admin)
-- ============================================================

CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Total orders
    SELECT COUNT(*) AS total_orders FROM orders;
    
    -- Today's orders
    SELECT COUNT(*) AS today_orders 
    FROM orders 
    WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
    
    -- Pending orders
    SELECT COUNT(*) AS pending_orders 
    FROM orders 
    WHERE status = 'pending';
    
    -- Total revenue
    SELECT ISNULL(SUM(total), 0) AS total_revenue 
    FROM orders 
    WHERE status = 'delivered';
    
    -- Today's revenue
    SELECT ISNULL(SUM(total), 0) AS today_revenue 
    FROM orders 
    WHERE status = 'delivered' 
    AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
    
    -- Total users
    SELECT COUNT(*) AS total_users FROM profiles;
    
    -- Total products
    SELECT COUNT(*) AS total_products FROM products WHERE is_active = 1;
END;
GO

-- ============================================================
-- End of Stored Procedures
-- ============================================================

PRINT 'Stored procedures created successfully!';
GO

