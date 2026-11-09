@echo off
cd /d "%~dp0voice-service"
call .venv\Scripts\activate
python -m scripts.speak %*
