@echo off
title OFFLINE AI - Local Server Terminal
color 0b
mode con: cols=100 lines=32

echo.
echo   ==================================================================================================
echo   *                                                                                                *
echo   *      ██████╗ ███████╗███████╗██╗     ██╗███╗   ██╗███████╗     █████╗ ██╗                      *
echo   *     ██╔═══██╗██╔════╝██╔════╝██║     ██║████╗  ██║██╔════╝    ██╔══██╗██║                      *
echo   *     ██║   ██║█████╗  █████╗  ██║     ██║██╔██╗ ██║█████╗      ███████║██║                      *
echo   *     ██║   ██║██╔══╝  ██╔══╝  ██║     ██║██║╚██╗██║██╔══╝      ██╔══██║██║                      *
echo   *     ╚██████╔╝██║     ██║     ███████╗██║██║ ╚████║███████╗    ██║  ██║██║                      *
echo   *      ╚═════╝ ╚═╝     ╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝    ╚═╝  ╚═╝╚═╝                      *
echo   *                                                                                                *
echo   *                                 A Modern Local AI Chat Experience                              *
echo   *                                                                                                *
echo   ==================================================================================================
echo   *                           Developed and Designed by: Hemanth Kumar K                           *
echo   ==================================================================================================
echo.
echo   [SYSTEM] Initializing Offline AI Server...
echo.
echo   [*] Cleaning up old server instances (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1
echo   [*] Port 3000 is clean and available.
echo.
echo   [*] Booting local backend and Vite frontend...
echo   [*] Please wait until you see "Server running at http://localhost:3000"
echo.
echo   ==================================================================================================
echo   [INFO] Keep this terminal open! It will display model loading status and generation logs.
echo   [INFO] To shut down the server, simply close this window or run "Kill All Servers.bat".
echo   ==================================================================================================
echo.

:: Start Chrome asynchronously after 4 seconds
start "" /b cmd /c "timeout /t 4 /nobreak >nul & start chrome http://localhost:3000"

:: Start the actual server and stream its logs directly into this terminal
call npm run start
