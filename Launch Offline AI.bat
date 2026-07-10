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

echo    [*] Cleaning up previous sessions...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo    [*] Starting secure backend and frontend services...
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\hidden_start.vbs"
echo WshShell.Run "cmd.exe /c npm run start", 0, False >> "%temp%\hidden_start.vbs"
wscript "%temp%\hidden_start.vbs"

echo    [*] Waiting for local server to become fully ready...
:WAIT_LOOP
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -ErrorAction Stop; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 1 /nobreak >nul
    goto WAIT_LOOP
)

echo    [*] Server is fully loaded and secure!
echo.
echo    [*] Opening interface in your secure browser environment in:
echo    3...
timeout /t 1 /nobreak >nul
echo    2...
timeout /t 1 /nobreak >nul
echo    1...
timeout /t 1 /nobreak >nul

echo    Launching!
start chrome http://localhost:3000

exit
