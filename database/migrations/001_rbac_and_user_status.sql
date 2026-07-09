-- RBAC & user status migration
-- Run once against your SQL Server database

-- 1. User active status
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('users') AND name = 'is_active'
)
BEGIN
  ALTER TABLE users ADD is_active BIT NOT NULL DEFAULT 1;
END
GO

-- 2. Roles table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'roles')
BEGIN
  CREATE TABLE roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    slug NVARCHAR(50) NOT NULL UNIQUE,
    name_ar NVARCHAR(100) NOT NULL,
    name_en NVARCHAR(100) NULL,
    description NVARCHAR(500) NULL,
    is_system BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

-- 3. Role permissions junction
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'role_permissions')
BEGIN
  CREATE TABLE role_permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    role_id UNIQUEIDENTIFIER NOT NULL,
    permission NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT UQ_role_permission UNIQUE (role_id, permission)
  );
  CREATE INDEX IX_role_permissions_role_id ON role_permissions(role_id);
END
GO

-- 4. Seed system roles
IF NOT EXISTS (SELECT 1 FROM roles WHERE slug = 'super_admin')
BEGIN
  DECLARE @superAdminId UNIQUEIDENTIFIER = NEWID();
  INSERT INTO roles (id, slug, name_ar, name_en, description, is_system)
  VALUES (@superAdminId, 'super_admin', N'مدير عام', 'Super Admin', N'صلاحيات كاملة على النظام', 1);

  INSERT INTO role_permissions (role_id, permission) VALUES
    (@superAdminId, 'users:read'), (@superAdminId, 'users:manage'),
    (@superAdminId, 'roles:read'), (@superAdminId, 'roles:manage'),
    (@superAdminId, 'products:read'), (@superAdminId, 'products:manage'),
    (@superAdminId, 'orders:read'), (@superAdminId, 'orders:manage'),
    (@superAdminId, 'branches:read'), (@superAdminId, 'branches:manage'),
    (@superAdminId, 'ads:read'), (@superAdminId, 'ads:manage'),
    (@superAdminId, 'feedback:read'), (@superAdminId, 'feedback:manage'),
    (@superAdminId, 'delivery:read'), (@superAdminId, 'delivery:manage'),
    (@superAdminId, 'settings:read'), (@superAdminId, 'settings:manage');
END
GO

IF NOT EXISTS (SELECT 1 FROM roles WHERE slug = 'admin')
BEGIN
  DECLARE @adminId UNIQUEIDENTIFIER = NEWID();
  INSERT INTO roles (id, slug, name_ar, name_en, description, is_system)
  VALUES (@adminId, 'admin', N'مدير', 'Admin', N'مدير بصلاحيات واسعة', 1);

  INSERT INTO role_permissions (role_id, permission) VALUES
    (@adminId, 'users:read'), (@adminId, 'users:manage'),
    (@adminId, 'roles:read'),
    (@adminId, 'products:read'), (@adminId, 'products:manage'),
    (@adminId, 'orders:read'), (@adminId, 'orders:manage'),
    (@adminId, 'branches:read'), (@adminId, 'branches:manage'),
    (@adminId, 'ads:read'), (@adminId, 'ads:manage'),
    (@adminId, 'feedback:read'), (@adminId, 'feedback:manage'),
    (@adminId, 'delivery:read'), (@adminId, 'delivery:manage'),
    (@adminId, 'settings:read'), (@adminId, 'settings:manage');
END
GO

IF NOT EXISTS (SELECT 1 FROM roles WHERE slug = 'manager')
BEGIN
  DECLARE @managerId UNIQUEIDENTIFIER = NEWID();
  INSERT INTO roles (id, slug, name_ar, name_en, description, is_system)
  VALUES (@managerId, 'manager', N'مشرف', 'Manager', N'مشرف بصلاحيات محدودة', 1);

  INSERT INTO role_permissions (role_id, permission) VALUES
    (@managerId, 'products:read'),
    (@managerId, 'orders:read'), (@managerId, 'orders:manage'),
    (@managerId, 'branches:read'),
    (@managerId, 'feedback:read'),
    (@managerId, 'delivery:read');
END
GO
