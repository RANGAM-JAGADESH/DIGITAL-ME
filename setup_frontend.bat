@echo off
REM Run once from the project root: .\setup_frontend.bat
cd /d "%~dp0frontend"
call npm install --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo npm install FAILED. Check your internet connection ^(try without a VPN^) and run .\setup_frontend.bat again.
  exit /b 1
)
echo.
echo Frontend installed. Start the backend with .\run_api.bat and then .\run_frontend.bat
