-- Check orders by status
-- This helps debug why pending and cancelled orders don't show in dashboard

-- Check all orders with their status
SELECT 
    id,
    status,
    payment_status,
    payment_method,
    total,
    created_at,
    updated_at
FROM orders 
ORDER BY created_at DESC;

-- Count orders by status
SELECT 
    status,
    COUNT(*) as count
FROM orders 
GROUP BY status
ORDER BY count DESC;

-- Check specific statuses
SELECT COUNT(*) as pending_count
FROM orders 
WHERE status = 'pending';

SELECT COUNT(*) as cancelled_count
FROM orders 
WHERE status = 'cancelled';

SELECT COUNT(*) as pending_payment_count
FROM orders 
WHERE status = 'pending_payment';

-- Check recent orders (last 24 hours)
SELECT 
    id,
    status,
    payment_status,
    payment_method,
    total,
    created_at
FROM orders 
WHERE created_at >= DATEADD(hour, -24, GETDATE())
ORDER BY created_at DESC;

-- Check if there are any orders at all
SELECT COUNT(*) as total_orders FROM orders;
