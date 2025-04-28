@echo off
cd /d %~dp0

REM Check if node_modules folder exists
if not exist "node_modules" (
    echo node_modules not found. Running install.bat...
    call install.bat
)

echo Starting the application...
nodejs\node.exe index.js

pause
