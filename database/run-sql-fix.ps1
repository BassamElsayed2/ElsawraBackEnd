# PowerShell script to run SQL fix for order status constraint
# This fixes the issue where orders with electronic payment don't appear in dashboard

Write-Host "🔧 Fixing Order Status Constraint..." -ForegroundColor Yellow

# SQL Server connection parameters (update these with your actual values)
$ServerInstance = "localhost"  # or your SQL Server instance
$Database = "elsawra"          # your database name

$SqlQuery = @"
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';

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

SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE TABLE_NAME = 'orders' AND CONSTRAINT_NAME LIKE '%status%';

SELECT TOP 10 
    id,
    status,
    payment_status,
    payment_method,
    total,
    created_at
FROM orders 
ORDER BY created_at DESC;

SELECT COUNT(*) as pending_payment_count
FROM orders 
WHERE status = 'pending_payment';
"@

try {
    # Import SQL Server module
    Import-Module SqlServer -ErrorAction SilentlyContinue
    
    if (Get-Module -Name SqlServer) {
        Write-Host "✅ SQL Server module loaded" -ForegroundColor Green
        
        # Execute SQL query
        Invoke-Sqlcmd -ServerInstance $ServerInstance -Database $Database -Query $SqlQuery
        
        Write-Host "✅ Order status constraint fixed successfully!" -ForegroundColor Green
        Write-Host "Orders with electronic payment should now appear in dashboard after successful payment." -ForegroundColor Cyan
    } else {
        Write-Host "❌ SQL Server module not found. Please install it:" -ForegroundColor Red
        Write-Host "Install-Module -Name SqlServer -Force" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or run the SQL script manually in SQL Server Management Studio:" -ForegroundColor Yellow
        Write-Host "File: backend/database/URGENT_FIX_ORDER_STATUS.sql" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error running SQL script: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL script manually in SQL Server Management Studio:" -ForegroundColor Yellow
    Write-Host "File: backend/database/URGENT_FIX_ORDER_STATUS.sql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart the backend server" -ForegroundColor White
Write-Host "2. Test creating a new order with electronic payment" -ForegroundColor White
Write-Host "3. Complete the payment in EasyKash" -ForegroundColor White
Write-Host "4. Check if the order appears in dashboard" -ForegroundColor White