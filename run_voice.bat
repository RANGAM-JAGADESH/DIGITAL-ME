@echo off
cd /d "%~dp0voice-service"
call .venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8001
