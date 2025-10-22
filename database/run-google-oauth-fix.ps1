# ============================================
# Fix Google OAuth - Allow NULL password_hash
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Fix Google OAuth Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if sqlcmd is available
$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    Write-Host "❌ Error: sqlcmd not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install SQL Server Command Line Utilities:" -ForegroundColor Yellow
    Write-Host "https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility" -ForegroundColor Yellow
    exit 1
}

# Database connection details
$Server = "localhost"
$Database = "food_cms"

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "   Server: $Server" -ForegroundColor White
Write-Host "   Database: $Database" -ForegroundColor White
Write-Host ""

# Confirm before running
$confirmation = Read-Host "Continue? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "❌ Cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Running SQL script..." -ForegroundColor Cyan

# Run the SQL script
$scriptPath = Join-Path $PSScriptRoot "fix-google-oauth-users.sql"

try {
    sqlcmd -S $Server -d $Database -i $scriptPath -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Database updated successfully!" -ForegroundColor Green
        Write-Host "  - password_hash now allows NULL" -ForegroundColor White
        Write-Host "  - Google OAuth users can now register" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 You can now test Google Sign-In!" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Error executing SQL script!" -ForegroundColor Red
        Write-Host "Check the error messages above." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

