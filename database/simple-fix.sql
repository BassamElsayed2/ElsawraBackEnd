-- Simple fix for order status constraint
-- Run this in SQL Server Management Studio

-- Step 1: Check current constraints
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';

-- Step 2: Drop existing constraints (replace with actual constraint name from step 1)
-- ALTER TABLE orders DROP CONSTRAINT CK__orders__status__[actual_constraint_name];

-- Step 3: Add new constraint with pending_payment
ALTER TABLE orders DROP CONSTRAINT IF EXISTS CK__orders__status__[constraint_name];
ALTER TABLE orders DROP CONSTRAINT IF EXISTS CK_orders_status;

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

-- Step 4: Verify
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';

-- Step 5: Check recent orders
SELECT TOP 10 
    id,
    status,
    payment_status,
    payment_method,
    total,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- Step 6: Count pending_payment orders
SELECT COUNT(*) as pending_payment_count
FROM orders 
WHERE status = 'pending_payment';
