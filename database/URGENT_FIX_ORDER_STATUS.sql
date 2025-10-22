-- URGENT: Fix Order Status Constraint
-- This fixes the issue where orders with electronic payment don't appear in dashboard

-- Step 1: Check current constraint
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';

-- Step 2: Drop the existing constraint (replace [constraint_name] with actual name from step 1)
-- ALTER TABLE orders DROP CONSTRAINT CK__orders__status__[constraint_name];

-- Step 3: Add the new constraint with pending_payment included
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

-- Step 4: Verify the constraint was added
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';

-- Step 5: Test by checking recent orders
SELECT TOP 10 
    id,
    status,
    payment_status,
    payment_method,
    total,
    created_at
FROM orders 
ORDER BY created_at DESC;

-- Step 6: Check for pending_payment orders
SELECT COUNT(*) as pending_payment_count
FROM orders 
WHERE status = 'pending_payment';

PRINT 'Order status constraint updated successfully!';
PRINT 'Orders with pending_payment status can now be created and updated.';
