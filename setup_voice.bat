@echo off
REM Run from the project root: .\setup_voice.bat
cd /d "%~dp0voice-service"
py -3.11 -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
pip install -r requirements.txt
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
