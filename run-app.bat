@echo off
echo ================================
echo   Starting Naukri Application
echo ================================

REM Move to the folder where the batch file is located
cd /d %~dp0

REM Check if node.exe exists
if not exist node.exe (
    echo Error: node.exe not found. Please make sure node.exe is in the same folder.
    pause
    exit /b
)

REM Check if node_modules exists, if not install
if not exist node_modules (
    echo Installing dependencies...
    node.exe node_modules/.bin/npm install
)

REM Run the app
echo Running the application...
node.exe index.js

pause
