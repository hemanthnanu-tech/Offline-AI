@echo off
title OFFLINE AI - Server Shutdown
color 0C
mode con: cols=65 lines=15

echo.
echo   ===============================================================
echo   *                                                             *
echo   *              O F F L I N E   A I   -   S T O P              *
echo   *                                                             *
echo   ===============================================================
echo.
echo   [SYSTEM] Terminating all running Offline AI server instances...
echo.

echo   [*] Force closing Node.js and Llama.cpp instances...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im llama-server.exe >nul 2>&1
taskkill /f /im llama-cli.exe >nul 2>&1

echo   [*] Cleaning up Port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo   [SUCCESS] All Offline AI background processes have been killed.
echo   [EXIT] This window will close automatically...
timeout /t 3 /nobreak >nul
exit
