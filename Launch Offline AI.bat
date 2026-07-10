@echo off
title Offline AI
color 0F
mode con: cols=70 lines=20

echo.
echo   [Offline AI] Starting local server environment...
echo.

echo   ^> Cleaning up previous sessions...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo   ^> Starting backend and frontend services...
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\hidden_start.vbs"
echo WshShell.Run "cmd.exe /c npm run start", 0, False >> "%temp%\hidden_start.vbs"
wscript "%temp%\hidden_start.vbs"

echo   ^> Waiting for server to become ready (this may take a few seconds)...
:WAIT_LOOP
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -ErrorAction Stop; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 1 /nobreak >nul
    goto WAIT_LOOP
)

echo   ^> Server is fully loaded and ready!
echo.
echo   Opening interface in browser in...
echo   3
timeout /t 1 /nobreak >nul
echo   2
timeout /t 1 /nobreak >nul
echo   1
timeout /t 1 /nobreak >nul

echo   Launching!
start chrome http://localhost:3000

:: Let the terminal close automatically so it's clean and simple
exit
