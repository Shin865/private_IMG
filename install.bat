@echo off
:: Mengambil lokasi folder tempat file .bat ini diletakkan secara dinamis
set "BASE_DIR=%~dp0"

echo ===================================================
echo SETUP DAN INSTALASI PROJECT (UNIVERSAL)
echo Mendeteksi lokasi project di: %BASE_DIR%
echo ===================================================

cd /d "%BASE_DIR%"

:: 1. Cek dan Install Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Python tidak ditemukan. Memulai instalasi Python...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
)

:: 2. Cek dan Install Node.js
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js tidak ditemukan. Memulai instalasi Node.js...
    winget install -e --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
)

echo.
echo ===================================================
echo MENGINSTAL DEPENDENSI PROJECT
echo ===================================================

:: SETUP BACKEND
if not exist "%BASE_DIR%backend" (
    echo [ERROR] Folder 'backend' tidak ditemukan di %BASE_DIR%
    echo Pastikan file .bat ini berada sejajar dengan folder backend.
    pause
    exit /b
)

echo [1/2] Menyiapkan Backend (Virtual Environment ^& Dependencies)...
cd /d "%BASE_DIR%backend"
echo Membuat virtual environment bernama 'venv'...
python -m venv venv
echo Mengaktifkan venv...
call venv\Scripts\activate
echo Menginstal dependencies Python...
call pip install -r requirements.txt
deactivate

echo.
:: SETUP FRONTEND
if not exist "%BASE_DIR%frontend" (
    echo [ERROR] Folder 'frontend' tidak ditemukan di %BASE_DIR%
    pause
    exit /b
)

echo [2/2] Menginstal dependencies Frontend (Node.js)...
cd /d "%BASE_DIR%frontend"
echo Menginstal package dasar...
call npm install
echo Memastikan Vite terinstal...
call npm install vite --save-dev

echo.
echo ===================================================
echo INSTALASI SELESAI!
echo Silakan jalankan '2_run.bat' untuk memulai aplikasi.
echo ===================================================
pause