@echo off
title Dispatcher - Stop
cd /d "%~dp0"

echo.
echo Stopping Dispatcher (API + Web)...
echo.

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
  if not errorlevel 1 echo Stopped process on port 4000 (API) - PID %%a
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3003" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
  if not errorlevel 1 echo Stopped process on port 3003 (Web) - PID %%a
)

echo.
echo Done. API (4000) and Web (3003) should be stopped.
echo.
pause
