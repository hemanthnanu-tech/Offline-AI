@echo off
title Offline AI - Initializing...
color 0B
mode con: cols=80 lines=25

echo.
echo    ======================================================================
echo    *                                                                    *
echo    *                     O F F L I N E   A I                            *
echo    *                                                                    *
echo    *               A Modern Local AI Chat Experience                    *
echo    *                                                                    *
echo    ======================================================================
echo    *                                                                    *
echo    *     Developed and Designed by: Hemanth Kumar K                     *
echo    *                                                                    *
echo    ======================================================================
echo.
echo    [*] Cleaning up background tasks...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo    [*] Booting up local AI Inference Engine...
:: Start the server silently via VBScript
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\hidden_start.vbs"
echo WshShell.Run "cmd.exe /c npm run start", 0, False >> "%temp%\hidden_start.vbs"
wscript "%temp%\hidden_start.vbs"

echo    [*] Server started successfully!
echo    [*] Preparing modern user interface...
timeout /t 3 /nobreak >nul

echo    [*] Launching Offline AI in your browser...
start chrome http://localhost:3000

echo    [*] Handing off process... terminal will now close automatically.
timeout /t 2 /nobreak >nul
exit
