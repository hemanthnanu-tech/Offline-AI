@echo off
title Offline AI - One-Time Runtime Setup
color 0B
mode con: cols=80 lines=30

echo.
echo    ==========================================================================
echo                       O F F L I N E   A I
echo    ==========================================================================
echo       One-Time Setup: Downloading Portable Node.js Runtime
echo    --------------------------------------------------------------------------
echo       This only runs ONCE. After this, launch normally with:
echo       "Launch Offline AI.bat"
echo    ==========================================================================
echo.

:: Check if runtime already exists
if exist "runtime\node.exe" (
    echo    [OK] Runtime already installed! You are good to go.
    echo.
    echo    Run "Launch Offline AI.bat" to start the app.
    echo.
    pause
    exit /b 0
)

echo    [*] Creating runtime directory...
mkdir runtime 2>nul

echo    [*] Downloading portable Node.js v20 LTS (this may take a minute)...
echo       (No installation required - downloads directly into this folder)
echo.

:: Download Node.js portable zip using PowerShell
powershell -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "Write-Host '   Connecting to nodejs.org...'; " ^
  "try { " ^
  "  Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.19.4/node-v20.19.4-win-x64.zip' -OutFile 'runtime\node.zip' -UseBasicParsing; " ^
  "  Write-Host '   Download complete. Extracting...'; " ^
  "  Expand-Archive -Path 'runtime\node.zip' -DestinationPath 'runtime\extracted' -Force; " ^
  "  Copy-Item 'runtime\extracted\node-v20.19.4-win-x64\*' 'runtime\' -Recurse -Force; " ^
  "  Remove-Item 'runtime\node.zip' -Force; " ^
  "  Remove-Item 'runtime\extracted' -Recurse -Force; " ^
  "  Write-Host '   Extraction complete!'; " ^
  "} catch { " ^
  "  Write-Host ('   ERROR: ' + $_.Exception.Message); " ^
  "  exit 1 " ^
  "}"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo    [ERROR] Download failed. Please check your internet connection and try again.
    echo    This is a ONE-TIME setup. After this the app works fully offline.
    echo.
    pause
    exit /b 1
)

if not exist "runtime\node.exe" (
    echo.
    echo    [ERROR] node.exe not found after extraction. Setup failed.
    pause
    exit /b 1
)

echo.
echo    ==========================================================================
echo    [SUCCESS] Runtime installed successfully!
echo    ==========================================================================
echo.
echo    Node.js is now bundled locally in the "runtime" folder.
echo    The app will NEVER need internet or any installation again.
echo.
echo    Run "Launch Offline AI.bat" to start the app now.
echo.
pause
