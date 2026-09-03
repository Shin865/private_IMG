@echo off
title Local Image Tool
echo.
echo  ============================================
echo   LOCAL IMAGE TOOL - Starting Application...
echo  ============================================
echo.
echo  [*] Backend : http://localhost:8000
echo  [*] Frontend: http://localhost:5173
echo.
echo  Tekan Ctrl+C untuk menghentikan aplikasi.
echo  ============================================
echo.

:: Start backend in background
cd /d "%~dp0backend"
start "ImageTool Backend" cmd /k ".\venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to be ready
timeout /t 3 /nobreak >nul

:: Start frontend in background
cd /d "%~dp0frontend"
start "ImageTool Frontend" cmd /k "npm run dev"

:: Wait then open browser
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo  [OK] Aplikasi berjalan! Browser akan terbuka otomatis.
echo  [OK] Tutup kedua jendela CMD untuk menghentikan.
echo.
pause
