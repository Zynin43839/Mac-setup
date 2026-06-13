@echo off
title Meeting Summary App - Setup

cd /d "%~dp0.."
set LOG_FILE=%TEMP%\meeting-app-setup.log
echo [%DATE% %TIME%] Starting setup... > "%LOG_FILE%"

echo.
echo ============================================================
echo         Meeting Summary App - One-Click Setup
echo ============================================================
echo.

rem ============================================================
rem CHECK / INSTALL PREREQUISITES
rem ============================================================

echo [1/4] Checking prerequisites...
echo [1/4] Checks >> "%LOG_FILE%"

where node >nul 2>&1
if not errorlevel 1 goto :node_found

echo.
echo  Node.js not found. Do you want to download and install it now?
echo  (requires Administrator privileges — right-click and run as Admin)
echo.
set /p INSTALL_NODE=  Install Node.js? (y/n, default=y): 
if /i "%INSTALL_NODE%"=="n" (
    echo.
    echo  Please install Node.js manually from: https://nodejs.org/
    pause
    exit /b 1
)

rem Check admin rights
fsutil dirty query %SystemDrive% >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [FAIL] This script is not running as Administrator.
    echo  Please close this window and re-run as Administrator:
    echo    Right-click setup.bat → "Run as administrator"
    pause
    exit /b 1
)

echo       Downloading Node.js v22.14.0 LTS (~75 MB)...
echo Download Node.js >> "%LOG_FILE%"
set NODE_MSI=%TEMP%\node-installer.msi
where curl >nul 2>&1
if errorlevel 1 (
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi' -OutFile '%NODE_MSI%' -UseBasicParsing -TimeoutSec 120"
) else (
    curl.exe -L -o "%NODE_MSI%" "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
)
if errorlevel 1 (
    echo       [FAIL] Download failed. Check internet connection.
    echo.
    echo  Try installing manually: https://nodejs.org/
    pause
    exit /b 1
)

echo       Installing Node.js (this may take a minute)...
echo Install Node.js >> "%LOG_FILE%"
msiexec /i "%NODE_MSI%" /quiet /norestart
echo Node.js installer exit code: %ERRORLEVEL% >> "%LOG_FILE%"

rem Refresh PATH for this session
set "PATH=%PATH%;%ProgramFiles%\nodejs\;%ProgramFiles(x86)%\nodejs\"
del "%NODE_MSI%" 2>nul

where node >nul 2>&1
if errorlevel 1 (
    echo       [FAIL] Node.js installation failed. Please install manually.
    pause
    exit /b 1
)

:node_found
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo       [OK] Node.js %NODE_VERSION%
echo Node: %NODE_VERSION% >> "%LOG_FILE%"

where npm >nul 2>&1
if errorlevel 1 (
    echo       [FAIL] npm not found
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo       [OK] npm v%NPM_VERSION%
echo npm: %NPM_VERSION% >> "%LOG_FILE%"
echo.

rem ============================================================
rem INSTALL FRONTEND DEPENDENCIES
rem ============================================================

echo [2/4] Installing project dependencies...
echo [2/4] Frontend install >> "%LOG_FILE%"

if not exist "package.json" (
    echo       [FAIL] package.json not found
    pause
    exit /b 1
)

echo       Installing frontend dependencies...
echo       (see %LOG_FILE% for details)
echo npm install frontend... >> "%LOG_FILE%"
cd /d "%~dp0.."
call npm install >> "%LOG_FILE%" 2>&1
echo Frontend exit code: %ERRORLEVEL% >> "%LOG_FILE%"

if not exist "node_modules" (
    echo       [FAIL] Frontend npm install failed
    type "%LOG_FILE%"
    echo.
    pause
    exit /b 1
)
echo       [OK] Frontend dependencies installed

rem ============================================================
rem INSTALL BACKEND DEPENDENCIES
rem ============================================================

echo       Installing backend dependencies...
echo [2/4] Backend install >> "%LOG_FILE%"
cd /d "%~dp0..\backend"

if not exist "package.json" (
    echo       [FAIL] backend\package.json not found
    pause
    exit /b 1
)

echo npm install backend... >> "%LOG_FILE%"
call npm install >> "%LOG_FILE%" 2>&1
echo Backend exit code: %ERRORLEVEL% >> "%LOG_FILE%"

if not exist "node_modules" (
    echo.
    echo  [FAIL] Backend npm install failed.
    echo  Details saved to: %LOG_FILE%
    type "%LOG_FILE%"
    echo.
    pause
    exit /b 1
)
echo       [OK] Backend dependencies installed

cd /d "%~dp0.."
echo.

rem ============================================================
rem DOWNLOAD WHISPER BINARY
rem ============================================================

echo [3/4] Downloading Local Whisper...
echo [3/4] Whisper download >> "%LOG_FILE%"

if exist "backend\whisper-cli.exe" (
    echo       [OK] whisper-cli.exe already downloaded
    goto :download_model
)

echo       [3a] Downloading whisper-cli.exe (~30 MB)...
echo       Press Enter to download, or type s and Enter to skip.
set /p SKIP_BIN=
if /i "%SKIP_BIN%"=="s" goto :download_model

echo       Downloading (this may take a while)...
cd /d "%~dp0..\backend"
echo Download whisper binary... >> "%LOG_FILE%"
powershell -Command "$p = Invoke-WebRequest -Uri 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.8.4/whisper-bin-x64.zip' -UseBasicParsing -TimeoutSec 120; if ($?) { [IO.File]::WriteAllBytes('whisper-bin.zip', $p.Content); exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo       [FAIL] Download failed. Check internet connection.
    echo Download FAILED >> "%LOG_FILE%"
    goto :download_model
)

powershell -Command "$d='whisper-tmp'; Expand-Archive -Path 'whisper-bin.zip' -DestinationPath $d -Force; $src=Get-ChildItem -Recurse -Path $d -Filter 'whisper-cli.exe' | Select-Object -First 1 | Select-Object -ExpandProperty DirectoryName; if ($src) { Copy-Item -Path (Join-Path $src '*') -Destination '.' -Recurse; exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo       [FAIL] Extraction failed. Binary not found in zip.
) else (
    echo       [OK] whisper-cli.exe + DLLs installed
    echo whisper-cli.exe OK >> "%LOG_FILE%"
)

del whisper-bin.zip 2>nul
rmdir /s /q whisper-tmp 2>nul
cd /d "%~dp0.."

:download_model

rem ============================================================
rem DOWNLOAD WHISPER MODEL
rem ============================================================

if not exist "backend\models" mkdir backend\models

rem Check if any model already exists
set HAS_MODEL=0
if exist "backend\models\ggml-tiny.bin" set HAS_MODEL=1
if exist "backend\models\ggml-base.bin" set HAS_MODEL=1
if exist "backend\models\ggml-small.bin" set HAS_MODEL=1
if exist "backend\models\ggml-medium.bin" set HAS_MODEL=1
if exist "backend\models\ggml-large-v3.bin" set HAS_MODEL=1

if "%HAS_MODEL%"=="1" (
    echo       [OK] Model already downloaded
    goto :setup_done
)

echo.
echo       [3b] Select Whisper model to download:
echo.
echo           1) Tiny   (74 MB)   — fastest, lowest accuracy
echo           2) Base   (142 MB)  — balanced speed/accuracy
echo           3) Small  (466 MB)  — good accuracy
echo           4) Medium (1.5 GB)  — high accuracy, recommended for Thai *
echo           5) Large  (2.9 GB)  — best accuracy, slow, needs ~5GB RAM
echo           s) Skip download
echo.
set /p MODEL_CHOICE=       Choose (1-5, or s) [default: 4]: 

if "%MODEL_CHOICE%"=="s" goto :setup_done
if "%MODEL_CHOICE%"=="" set MODEL_CHOICE=4

set MODEL_NAME=base
set MODEL_FILE=ggml-base.bin
set MODEL_URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
set MODEL_SIZE=142 MB

if "%MODEL_CHOICE%"=="1" (
    set MODEL_NAME=tiny
    set MODEL_FILE=ggml-tiny.bin
    set MODEL_URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin
    set MODEL_SIZE=74 MB
)
if "%MODEL_CHOICE%"=="2" (
    set MODEL_NAME=base
    set MODEL_FILE=ggml-base.bin
    set MODEL_URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
    set MODEL_SIZE=142 MB
)
if "%MODEL_CHOICE%"=="3" (
    set MODEL_NAME=small
    set MODEL_FILE=ggml-small.bin
    set MODEL_URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
    set MODEL_SIZE=466 MB
)
if "%MODEL_CHOICE%"=="4" (
    set MODEL_NAME=medium
    set MODEL_FILE=ggml-medium.bin
    set MODEL_URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
    set MODEL_SIZE=1.5 GB
)
if "%MODEL_CHOICE%"=="5" (
    set MODEL_NAME=large
    set MODEL_FILE=ggml-large-v3.bin
    set MODEL_URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
    set MODEL_SIZE=2.9 GB
)

if exist "backend\models\%MODEL_FILE%" (
    echo       [OK] %MODEL_NAME% model already downloaded
    goto :setup_done
)

echo       Downloading %MODEL_NAME% model (%MODEL_SIZE%)...
echo       Press Enter to confirm, or type s and Enter to skip.
set /p SKIP_MODEL=
if /i "%SKIP_MODEL%"=="s" (
    echo       [SKIP] Model download skipped.
    goto :setup_done
)

echo       Downloading (this may take a while)...
echo Download model %MODEL_NAME% >> "%LOG_FILE%"
where curl >nul 2>&1
if errorlevel 1 (
    echo       curl not found, using PowerShell fallback...
    powershell -Command "Invoke-WebRequest -Uri '%MODEL_URL%' -OutFile 'backend\models\%MODEL_FILE%' -TimeoutSec 600"
) else (
    curl.exe -L -o "backend\models\%MODEL_FILE%" "%MODEL_URL%"
)
if errorlevel 1 (
    echo       [FAIL] Download failed. Check internet connection.
    echo Model %MODEL_NAME% download FAILED >> "%LOG_FILE%"
) else (
    echo       [OK] %MODEL_NAME% model downloaded to backend\models\%MODEL_FILE%
    echo Model %MODEL_NAME% download OK >> "%LOG_FILE%"
)

:setup_done
echo.

rem ============================================================
rem DONE
rem ============================================================

echo [4/4] Setup complete!
echo [4/4] Done >> "%LOG_FILE%"
echo.
echo ============================================================
echo                     SETUP COMPLETE!
echo.
echo  To start:  scripts\start_app.bat
echo  Then open  http://localhost:5174
echo.
echo  Commands:
echo    npm run dev           - Frontend only
echo    npm run build         - Build for production
echo    npm test              - Run tests
echo    cd backend ^&^& npm start - Backend only
echo.
echo  Log saved to: %LOG_FILE%
echo.
echo ============================================================
echo.

pause