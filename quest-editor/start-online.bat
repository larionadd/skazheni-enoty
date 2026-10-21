@echo off
chcp 65001 > nul
echo ========================================================
echo   Квестопис — Запуск онлайн-доступу для телефону
echo ========================================================
echo.
echo 1. Запуск локального вебсервера (порт 8765)...
start "Quest Editor Server" /B node serve.mjs
timeout /t 2 /nobreak > nul
echo 2. Запуск захищеного публічного тунелю Cloudflare...
echo.
echo Відкрийте згенероване посилання https://*.trycloudflare.com на телефоні!
echo.
..\scripts\cloudflared.exe tunnel --url http://localhost:8765
pause
