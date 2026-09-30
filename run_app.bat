@echo off
title MODERN SUMMARY APP + PYTHON QPAINTER ENGINE
color 0b

echo ==============================================================
echo       MODERN SUMMARY APP - STARTING LOCAL PRINT STACK
echo ==============================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python & PyQt6 requirements...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from python.org and add to PATH.
    pause
    exit /b 1
)

python -c "import PyQt6" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] PyQt6 missing! Installing PyQt6 now...
    pip install -r requirements.txt
)

echo [2/3] Starting Python PyQt6 Native Print Engine (Port 5005)...
start /b "Python Print Engine" python server\native_print_server.py

timeout /t 2 /nobreak > nul

echo [3/3] Starting React Frontend Dev Server (Vite)...
start "Vite Dev Server" npm run dev

echo.
echo ==============================================================
echo  SYSTEM READY:
echo  - Python PyQt6 Print Engine : http://127.0.0.1:5005
echo  - Vite Web App              : http://localhost:5173
echo.
echo  Press Ctrl+C or close this window when done.
echo ==============================================================
pause
