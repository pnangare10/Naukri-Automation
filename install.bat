@echo off
cd /d %~dp0
echo Installing dependencies...
nodejs\node.exe nodejs\npm\bin\npm-cli.js install
pause
