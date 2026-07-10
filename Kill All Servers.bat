@echo off
title Offline AI - Secure Shutdown
color 0C
mode con: cols=80 lines=20

echo.
echo    ==========================================================================
echo                        O F F L I N E   A I  -  S T O P
echo    ==========================================================================
echo       Securely terminating all local AI components and freeing memory.
echo    --------------------------------------------------------------------------
echo       Designed ^& Developed by: Hemanth Kumar K
echo    ==========================================================================
echo.
echo    [*] Stopping all local background services...
echo.

echo    [*] Terminating Node.js and Llama backend processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im llama-server.exe >nul 2>&1
taskkill /f /im llama-cli.exe >nul 2>&1

echo    [*] Cleaning up local networking ports...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo    [*] Successfully shut down all processes. Your environment is secure.
echo    [*] Closing terminal in 3 seconds...
timeout /t 3 /nobreak >nul
exit
