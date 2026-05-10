@echo off
:: fix_reported_images.bat
:: Fetches all faulty-image reports from the What's Cooking API
:: and re-extracts a thumbnail for each recipe using hero_shot.py
::
:: Usage:
::   fix_reported_images.bat
::   fix_reported_images.bat --dry-run
::   fix_reported_images.bat --cookies path\to\instagram_cookies.txt

echo.
echo ============================================
echo  What's Cooking — Fix Reported Images
echo ============================================
echo.

:: Change to the project root (same folder as this bat file)
cd /d "%~dp0"

:: Check Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from python.org or run:
    echo   winget install Python.Python.3.12
    pause
    exit /b 1
)

:: Make sure the dev server is running
echo NOTE: The Next.js dev server must be running on localhost:3002
echo       Start it with: npm run dev
echo.

:: Run the fixer, passing through any arguments (e.g. --dry-run, --cookies)
python scripts\ingestion\fix_reported_images.py %*

echo.
echo Done. Check logs\image-fix.log for details.
pause
