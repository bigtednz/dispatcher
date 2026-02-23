@echo off
title Dispatcher - API + Web
cd /d "%~dp0"

echo.
echo Starting Dispatcher (API + Web)...
echo API:  http://localhost:4000/api
echo Web:  http://localhost:3003
echo.
echo Press Ctrl+C to stop both.
echo.

pnpm dev

pause
