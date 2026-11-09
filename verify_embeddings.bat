@echo off
cd /d "%~dp0backend"
call .venv\Scripts\activate
python -m scripts.verify_embeddings
