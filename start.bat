@echo off
REM Double-click to install, set up and run CampusFlow on Windows.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download v22.13 or newer from https://nodejs.org and run this again.
  pause
  exit /b 1
)
node setup.mjs %*
pause
