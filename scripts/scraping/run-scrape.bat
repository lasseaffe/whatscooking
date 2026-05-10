@echo off
:: run-scrape.bat — Run the full Instagram scraper (Llama 3.1:8B, local Ollama)
:: Make sure Ollama is running: ollama serve
:: Make sure model is pulled:  ollama pull llama3.1:8b

cd /d "%~dp0..\.."

echo [scrape] Starting Instagram scraper (llama3.1:8b)...
node scripts\scraping\scrape_instagram.mjs %*

if %errorlevel% neq 0 (
    echo [ERROR] Scraper failed - check output above
    pause
    exit /b %errorlevel%
)

echo.
echo [scrape] Done! Check recipes-local\ for backup JSON files.
pause
