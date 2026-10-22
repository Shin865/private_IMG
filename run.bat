@echo off
echo ===================================================
echo MENJALANKAN SERVER APLIKASI...
echo ===================================================

:: Menjalankan Backend (Terminal 1)
echo Memulai Backend di http://localhost:8000...
echo API Docs tersedia di http://localhost:8000/docs
start "Backend Server" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Menjalankan Frontend (Terminal 2)
echo Memulai Frontend di http://localhost:5173...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo Semua server sedang berjalan di jendela baru.
echo Jendela ini bisa Anda tutup.
pause