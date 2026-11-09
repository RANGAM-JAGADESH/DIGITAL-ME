@echo off
REM Installs the updated backend packages (lighter embeddings, connection pool, rate limiter).
REM Run once from the project root: .\update_backend.bat
cd /d "%~dp0backend"
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo Install FAILED. Check your internet connection and run .\update_backend.bat again.
  exit /b 1
)
echo.
echo Backend packages updated. Next: .\verify_embeddings.bat
