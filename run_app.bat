@echo off
title MODERN SUMMARY APP + PYTHON QPAINTER ENGINE
color 0b

echo ==============================================================
echo       MODERN SUMMARY APP - STARTING LOCAL PRINT STACK
echo ==============================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python PyQt6 Native Print Engine (Port 5005)...
start /b "Python Print Engine" python server\native_print_server.py

timeout /t 2 /nobreak > nul

echo [2/2] Starting React Frontend Dev Server (Vite)...
start "Vite Dev Server" npm run dev

echo.
echo ==============================================================
echo  SYSTEM READY:
echo  - Python PyQt6 Service : http://127.0.0.1:5005
echo  - Vite Web App         : http://localhost:5173
echo.
echo  Press Ctrl+C or close this window when done.
echo ==============================================================
pause
