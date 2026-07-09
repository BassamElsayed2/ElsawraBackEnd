-- Separate dashboard accounts from customer accounts
-- Run once: npm run migrate-dashboard-users

-- 1. Dashboard users table (standalone admin/staff accounts)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'dashboard_users')
BEGIN
  CREATE TABLE dashboard_users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email_verified BIT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    full_name NVARCHAR(200) NOT NULL,
    phone NVARCHAR(20) NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'admin',
    image_url NVARCHAR(500) NULL,
    job_title NVARCHAR(200) NULL,
    address NVARCHAR(500) NULL,
    about NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
  CREATE INDEX IX_dashboard_users_email ON dashboard_users(email);
  CREATE INDEX IX_dashboard_users_role ON dashboard_users(role);
END
GO

-- 2. Dashboard sessions table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'dashboard_sessions')
BEGIN
  CREATE TABLE dashboard_sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    dashboard_user_id UNIQUEIDENTIFIER NOT NULL,
    token NVARCHAR(500) NOT NULL,
    device_name NVARCHAR(200) NULL,
    ip_address NVARCHAR(45) NULL,
    is_current BIT NOT NULL DEFAULT 1,
    last_activity DATETIME2 NOT NULL DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_dashboard_sessions_user FOREIGN KEY (dashboard_user_id)
      REFERENCES dashboard_users(id) ON DELETE CASCADE
  );
  CREATE INDEX IX_dashboard_sessions_token ON dashboard_sessions(token);
  CREATE INDEX IX_dashboard_sessions_user_id ON dashboard_sessions(dashboard_user_id);
END
GO
