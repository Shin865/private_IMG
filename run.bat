@echo off
:: Mengambil lokasi folder tempat file .bat ini diletakkan secara dinamis
set "BASE_DIR=%~dp0"

echo ===================================================
echo MENJALANKAN SERVER APLIKASI (UNIVERSAL)
echo Menjalankan dari lokasi: %BASE_DIR%
echo ===================================================

:: Menjalankan Backend (Terminal 1)
if exist "%BASE_DIR%backend" (
    echo Memulai Backend di http://localhost:8000...
    start "Backend Server" cmd /k "cd /d "%BASE_DIR%backend" && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
) else (
    echo [ERROR] Folder backend tidak ditemukan!
)

:: Menjalankan Frontend (Terminal 2)
if exist "%BASE_DIR%frontend" (
    echo Memulai Frontend di http://localhost:5173...
    start "Frontend Server" cmd /k "cd /d "%BASE_DIR%frontend" && npm run dev"
) else (
    echo [ERROR] Folder frontend tidak ditemukan!
)

:: Buka Browser
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo Proses selesai. Jika berhasil, dua jendela terminal baru akan terbuka.
echo Jendela ini bisa Anda tutup.
pause