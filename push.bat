@echo off
title Push to Git
cd /d "%~dp0"

echo.
echo === Dispatcher - Push to GitHub ===
echo.

if "%~1"=="" (
  set /p MSG="Commit message: "
) else (
  set "MSG=%~*"
)

if "%MSG%"=="" (
  echo No message given. Exiting.
  pause
  exit /b 1
)

echo.
echo Staging all changes...
git add -A

echo.
echo Status:
git status --short
echo.

git commit -m "%MSG%"
if errorlevel 1 (
  echo Nothing to commit or commit failed.
  pause
  exit /b 1
)

echo.
echo Pushing to origin main...
git push origin main
if errorlevel 1 (
  echo Push failed.
  pause
  exit /b 1
)

echo.
echo Done. Pushed to GitHub.
echo.
pause
