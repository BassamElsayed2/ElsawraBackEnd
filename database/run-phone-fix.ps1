# ============================================
# PowerShell Script to Fix Phone Column
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📱 Fixing Phone Column for Orders" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SQL file exists
if (-not (Test-Path "fix-phone-with-index.sql")) {
    Write-Host "❌ Error: fix-phone-with-index.sql not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the correct directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 SQL File: fix-phone-with-index.sql" -ForegroundColor Green
Write-Host ""

# Prompt for connection details
Write-Host "Enter SQL Server connection details:" -ForegroundColor Yellow
Write-Host "(Press Enter to use defaults)" -ForegroundColor Gray
Write-Host ""

$serverName = Read-Host "Server name (default: localhost)"
if ([string]::IsNullOrWhiteSpace($serverName)) {
    $serverName = "localhost"
}

$databaseName = Read-Host "Database name (default: food_cms)"
if ([string]::IsNullOrWhiteSpace($databaseName)) {
    $databaseName = "food_cms"
}

Write-Host ""
Write-Host "🔌 Connecting to: $serverName" -ForegroundColor Cyan
Write-Host "🗄️  Database: $databaseName" -ForegroundColor Cyan
Write-Host ""

# Try to run with sqlcmd
Write-Host "🚀 Executing SQL script..." -ForegroundColor Yellow
Write-Host ""

try {
    # Try using sqlcmd
    $output = sqlcmd -S $serverName -d $databaseName -i "fix-phone-with-index.sql" -b 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host $output -ForegroundColor White
        Write-Host ""
        Write-Host "✅ phone column now allows NULL" -ForegroundColor Green
        Write-Host "✅ Backend will validate phone before orders" -ForegroundColor Green
        Write-Host "✅ Frontend modal will collect phone if missing" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Restart backend: cd backend && npm start" -ForegroundColor White
        Write-Host "  2. Test Google Sign-In" -ForegroundColor White
        Write-Host "  3. Try to place an order (phone modal should appear)" -ForegroundColor White
        Write-Host ""
    } else {
        throw "sqlcmd failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "⚠️  sqlcmd not found or failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please use one of these alternatives:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: SQL Server Management Studio (SSMS)" -ForegroundColor White
    Write-Host "  1. Open SSMS" -ForegroundColor Gray
    Write-Host "  2. Connect to: $serverName" -ForegroundColor Gray
    Write-Host "  3. Open file: fix-phone-with-index.sql" -ForegroundColor Gray
    Write-Host "  4. Press F5 to execute" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Copy and Paste" -ForegroundColor White
    Write-Host "  1. Open fix-phone-with-index.sql in any text editor" -ForegroundColor Gray
    Write-Host "  2. Copy all contents" -ForegroundColor Gray
    Write-Host "  3. Paste in SSMS query window" -ForegroundColor Gray
    Write-Host "  4. Execute" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

