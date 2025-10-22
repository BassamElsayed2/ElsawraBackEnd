# ============================================
# Complete Google OAuth Fix
# ============================================
# Fixes both password_hash and phone columns

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Google OAuth - Complete Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if sqlcmd is available
$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    Write-Host "❌ Error: sqlcmd not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install SQL Server Command Line Utilities:" -ForegroundColor Yellow
    Write-Host "https://aka.ms/sqlcmd" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OR run the SQL manually in SSMS:" -ForegroundColor Yellow
    Write-Host "  1. Open SQL Server Management Studio" -ForegroundColor White
    Write-Host "  2. Open: fix-google-oauth-complete.sql" -ForegroundColor White
    Write-Host "  3. Press F5" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Database connection details
$Server = "localhost"
$Database = "food_cms"

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "   Server: $Server" -ForegroundColor White
Write-Host "   Database: $Database" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Will fix:" -ForegroundColor Yellow
Write-Host "   ✓ password_hash → Allow NULL (Google users)" -ForegroundColor White
Write-Host "   ✓ phone → Allow NULL (add later)" -ForegroundColor White
Write-Host ""

# Confirm before running
$confirmation = Read-Host "Continue? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "❌ Cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Running SQL script..." -ForegroundColor Cyan
Write-Host ""

# Run the SQL script
$scriptPath = Join-Path $PSScriptRoot "fix-google-oauth-complete.sql"

try {
    sqlcmd -S $Server -d $Database -i $scriptPath -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Database updated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Changes applied:" -ForegroundColor Cyan
        Write-Host "  ✓ password_hash now allows NULL" -ForegroundColor White
        Write-Host "  ✓ phone now allows NULL" -ForegroundColor White
        Write-Host "  ✓ Security constraints added" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Google OAuth is ready!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Test Google Sign-In" -ForegroundColor White
        Write-Host "  2. User can add phone from profile later" -ForegroundColor White
        Write-Host ""
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

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

