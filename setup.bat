@echo off
REM Run from the project root: setup.bat
cd /d "%~dp0backend"
py -3.11 -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env copy .env.example .env
echo.
echo Setup done. Now edit backend\.env with your keys, then run:
echo   run_ingest.bat   (after applying the schema)
