-- Password reset tokens for forgot-password flow
-- Run once against the app database (e.g. elsawraDb):
--   npm run migrate-password-reset
-- Or in SSMS: select the correct database first, then execute.

-- USE [elsawraDb];
-- GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
  RAISERROR(
    N'dbo.users was not found. Switch to the Food CMS database (e.g. elsawraDb) and run again.',
    16,
    1
  );
  RETURN;
END
GO

IF OBJECT_ID(N'dbo.password_reset_tokens', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.password_reset_tokens (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_password_reset_tokens PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_password_reset_tokens_created_at DEFAULT GETDATE(),
    CONSTRAINT FK_password_reset_tokens_user
      FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IX_password_reset_tokens_token_hash
    ON dbo.password_reset_tokens(token_hash);

  CREATE INDEX IX_password_reset_tokens_user_id
    ON dbo.password_reset_tokens(user_id);

  CREATE INDEX IX_password_reset_tokens_expires_at
    ON dbo.password_reset_tokens(expires_at);
END
GO
