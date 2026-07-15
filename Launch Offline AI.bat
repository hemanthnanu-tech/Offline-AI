@echo off
title Offline AI - Secure Local Environment
color 0B
mode con: cols=80 lines=22

echo.
echo    ==========================================================================
echo                            O F F L I N E   A I
echo    ==========================================================================
echo       100%% Private. Fully Local. Highly Secure AI Chat Experience.
echo    --------------------------------------------------------------------------
echo       Designed ^& Developed by: Hemanth Kumar K
echo    ==========================================================================
echo.
echo    [*] Starting local server environment...
echo.

:: -----------------------------------------------------------------------
:: Locate Node.js - prefer bundled runtime, fall back to system install
:: -----------------------------------------------------------------------
set "PROJECT_DIR=%~dp0"

if exist "%PROJECT_DIR%runtime\node.exe" (
    set "NODE_EXE=%PROJECT_DIR%runtime\node.exe"
    echo    [*] Using bundled portable Node.js runtime.
) else (
    where node >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        for /f "delims=" %%i in ('where node') do set "NODE_EXE=%%i"
        echo    [*] Using system Node.js.
    ) else (
        echo.
        echo    [ERROR] Node.js not found!
        echo    Run "Setup - Download Runtime.bat" once to fix this.
        echo.
        pause
        exit /b 1
    )
)

:: -----------------------------------------------------------------------
:: Kill any leftover processes from previous sessions
:: -----------------------------------------------------------------------
echo    [*] Cleaning up previous sessions...
taskkill /f /im llama-server.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" 2^>nul') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" 2^>nul') do taskkill /f /pid %%a >nul 2>&1

:: -----------------------------------------------------------------------
:: Write the server launcher to a SPACE-FREE path so start /min works
:: This avoids all quoting issues with "GitHub projects" in the path
:: -----------------------------------------------------------------------
echo    [*] Starting secure backend and frontend services...
set "RUNDIR=%APPDATA%\OfflineAI"
mkdir "%RUNDIR%" 2>nul

(
    echo @echo off
    echo set "NODE_ENV=production"
    echo pushd "%PROJECT_DIR%"
    echo "%NODE_EXE%" "dist\server.cjs"
    echo popd
) > "%RUNDIR%\run.bat"

:: Launch the server in a minimized background window (most reliable on Windows)
start "Offline AI Server" /min "%RUNDIR%\run.bat"

:: -----------------------------------------------------------------------
:: Wait for server to respond on port 3000 (timeout: 90 seconds)
:: -----------------------------------------------------------------------
echo    [*] Waiting for local server to become fully ready...
set /a WAIT=0

:WAIT_LOOP
set /a WAIT+=1
if %WAIT% GTR 90 (
    echo.
    echo    ==========================================================================
    echo    [ERROR] Server did not respond after 90 seconds.
    echo    ==========================================================================
    echo.
    echo    Possible causes:
    echo      - No .gguf model found in the models\ folder
    echo      - llama-server.exe was blocked by antivirus
    echo      - Port 3000 or 8080 is in use by another app
    echo.
    echo    Fix: Run "Kill All Servers.bat" then launch again.
    echo.
    pause
    exit /b 1
)

powershell -Command "$ErrorActionPreference='SilentlyContinue'; try { Invoke-WebRequest 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    timeout /t 1 /nobreak >nul
    goto WAIT_LOOP
)

echo    [*] Server is fully loaded and secure!
echo.
echo    [*] Opening interface in your browser in:
echo    3...
timeout /t 1 /nobreak >nul
echo    2...
timeout /t 1 /nobreak >nul
echo    1...
timeout /t 1 /nobreak >nul
echo    Launching!

start "" "http://127.0.0.1:3000"

exit
