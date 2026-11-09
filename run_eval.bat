@echo off
REM Safety and quality check. Examples:  .\run_eval.bat   or   .\run_eval.bat --only salary
cd /d "%~dp0backend"
call .venv\Scripts\activate
python -m scripts.eval_questions %*
