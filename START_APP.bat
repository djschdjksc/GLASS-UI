@echo off
title Modern Summary App — Ultra Fast Accounting
color 0b
echo ========================================================
echo    MODERN SUMMARY APP — ULTRA FAST PORTABLE USB EDITION
echo ========================================================
echo.
echo [1/3] Starting Native Print Server (PyQt6)...
start /b "" python server\native_print_server.py

echo [2/3] Starting SQLite High-Speed Database Engine...
start /b "" python server\db_server.py

echo [3/3] Starting Modern Web Interface...
echo.
echo Opening app at http://localhost:5173 ...
echo Press Ctrl+C in this window anytime to stop the app.
echo.
call npm run dev

pause
