@echo off
cd /d "%~dp0"
start "" "http://localhost:3001"
node src/server/index.ts
pause
