@echo off
title Offline AI - Stop
color 0F
mode con: cols=65 lines=15

echo.
echo   [Offline AI] Stopping all services...
echo.

echo   ^> Terminating Node.js and Llama backend processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im llama-server.exe >nul 2>&1
taskkill /f /im llama-cli.exe >nul 2>&1

echo   ^> Cleaning up Port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo   [Offline AI] Successfully shut down all processes.
echo   Closing terminal in 3 seconds...
timeout /t 3 /nobreak >nul
exit
