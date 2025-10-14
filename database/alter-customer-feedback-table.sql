-- Alter customer_feedback table to support branch feedback survey
-- Date: October 13, 2025
-- NOTE: This migration has been applied successfully using Node.js script

USE elsawraDb;
GO

-- First, make order_id and user_id nullable since branch survey doesn't require them
ALTER TABLE customer_feedback
ALTER COLUMN order_id UNIQUEIDENTIFIER NULL;
GO

ALTER TABLE customer_feedback
ALTER COLUMN user_id UNIQUEIDENTIFIER NULL;
GO

-- Add new columns for customer feedback survey
ALTER TABLE customer_feedback
ADD 
    branch_id UNIQUEIDENTIFIER NULL,
    customer_name NVARCHAR(255) NULL,
    phone_number NVARCHAR(20) NULL,
    email NVARCHAR(255) NULL,
    reception_rating INT NULL CHECK (reception_rating BETWEEN 1 AND 4),
    cleanliness_rating INT NULL CHECK (cleanliness_rating BETWEEN 1 AND 4),
    catering_rating INT NULL CHECK (catering_rating BETWEEN 1 AND 4),
    opinion NVARCHAR(MAX) NULL;
GO

-- Add foreign key constraint for branch_id
ALTER TABLE customer_feedback
ADD CONSTRAINT FK_customer_feedback_branch_id 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
GO

-- Add index for branch_id
CREATE INDEX idx_customer_feedback_branch_id ON customer_feedback(branch_id);
GO

PRINT 'Customer feedback table altered successfully for branch feedback survey!';
PRINT '';
PRINT 'IMPORTANT NOTES:';
PRINT '- The column "rating" will be used as "overall_rating" (1-4 scale)';
PRINT '- The column "comment" will be used as additional notes';
PRINT '- The column "food_quality" will be used as "quality_rating"';
PRINT '- The column "service_quality" remains the same';
PRINT '- The column "delivery_speed" will be used as "service_speed_rating"';
PRINT '';

