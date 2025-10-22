-- Fix Order Status Constraint to Allow pending_payment
-- This fixes the issue where orders with electronic payment don't appear in dashboard

-- Step 1: Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT CK__orders__status__[constraint_name];

-- Step 2: Add the new constraint with pending_payment included
ALTER TABLE orders ADD CONSTRAINT CK_orders_status 
CHECK (status IN (
    'pending', 
    'pending_payment', 
    'confirmed', 
    'preparing', 
    'ready', 
    'delivering', 
    'delivered', 
    'cancelled'
));

-- Step 3: Update TypeScript types to include pending_payment
-- File: backend/src/types/index.ts
-- Add 'pending_payment' to Order status type

-- Step 4: Update validators to include pending_payment
-- File: backend/src/validators/orders.validators.ts
-- Add 'pending_payment' to updateOrderStatusSchema

-- Verification query
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';
