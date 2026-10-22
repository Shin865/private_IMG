@echo off
echo ===================================================
echo SETUP DAN INSTALASI PROJECT
echo ===================================================

:: Pindah ke direktori tempat file .bat ini berada
cd /d "%~dp0"

:: 1. Cek dan Install Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Python tidak ditemukan. Memulai instalasi Python...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    echo PENTING: Jika baru diinstal, Anda mungkin perlu restart komputer.
) else (
    echo [OK] Python sudah terinstal.
)

:: 2. Cek dan Install Node.js
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js tidak ditemukan. Memulai instalasi Node.js...
    winget install -e --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
    echo PENTING: Jika baru diinstal, Anda mungkin perlu restart komputer.
) else (
    echo [OK] Node.js sudah terinstal.
)

echo.
echo ===================================================
echo MENGINSTAL DEPENDENSI PROJECT
echo ===================================================

echo [1/2] Menyiapkan Backend (Virtual Environment ^& Python Dependencies)...
cd /d "%~dp0backend"
:: Membuat virtual environment bernama 'venv'
python -m venv venv
:: Mengaktifkan venv dan menginstal requirements
call venv\Scripts\activate
call pip install -r requirements.txt
:: Keluar dari venv (opsional, tapi baik untuk clean state)
deactivate

echo.
echo [2/2] Menginstal dependencies Frontend (Node.js)...
cd /d "%~dp0frontend"
call npm install

echo.
echo ===================================================
echo INSTALASI SELESAI!
echo Silakan jalankan '2_run.bat' untuk memulai aplikasi.
echo ===================================================
pause