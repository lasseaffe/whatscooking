@echo off
cd /d "%~dp0"

set RECIPE_BACKUP_DIR=C:\Users\lasse\Desktop\recipes-local

if not exist scripts\ingestion\.env (
    echo [ERROR] Missing scripts\ingestion\.env - add your SUPABASE_SERVICE_KEY first
    pause
    exit /b 1
)

echo [scrape] Starting recipe ingestion...
py -m scripts.ingestion.main

if %errorlevel% neq 0 (
    echo [ERROR] Scrape failed - check output above
    pause
    exit /b %errorlevel%
)

echo.
echo [scrape] Done! Check C:\Users\lasse\Desktop\recipes-local for backup files.
pause
