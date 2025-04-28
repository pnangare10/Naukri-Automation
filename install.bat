@echo off
cd /d %~dp0
echo Installing dependencies...
nodejs\node.exe nodejs\node_modules\npm\bin\npm-cli.js install
pause
