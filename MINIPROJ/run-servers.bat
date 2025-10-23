@echo off
REM Start backend and frontend in separate command windows.
REM Double-click this file to run both servers without typing commands.

SET ROOT=%~dp0
REM Start backend in a new window
start "Backend" cmd /k "cd /d "%ROOT%Backend" && echo Installing backend deps (if needed)... && npm install --silent && set PORT=3001 && echo Starting backend on port %PORT% && node index.js"

REM Give backend a moment to start
ping -n 2 127.0.0.1 >nul

REM Start frontend in a new window
start "Frontend" cmd /k "cd /d "%ROOT%Frontend" && echo Installing frontend deps (if needed)... && npm install --silent && echo Starting Vite dev server... && npm run dev -- --host"

echo Started backend and frontend. Close these windows to stop the servers.
pause
