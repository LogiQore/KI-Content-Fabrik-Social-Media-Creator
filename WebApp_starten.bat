@echo off
title KI Content Fabrik - Social Media Creator
color 0A
setlocal enabledelayedexpansion

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║    KI Content Fabrik — Social Media Creator           ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

cd /d "E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator"

if not exist "node_modules" (
    echo  [!] node_modules nicht gefunden — fuehre npm install aus...
    npm install
    echo.
)

set "KI_LOGFILE=%TEMP%\ki_social_media_creator_nextjs.log"
if exist "%KI_LOGFILE%" del /f /q "%KI_LOGFILE%"

echo  [*] Starte Next.js Server...
echo  [*] Warte auf Port-Zuweisung...
echo.

start "KI Social Media Creator - Server" powershell -NoExit -ExecutionPolicy Bypass -File "E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator\start_server.ps1"

set "PORT="
set "TRIES=0"

:WARTE
timeout /t 1 /nobreak >nul
set /a TRIES+=1

if not exist "%KI_LOGFILE%" goto WEITER

for /f "usebackq tokens=*" %%L in (`findstr /i "localhost:" "%KI_LOGFILE%" 2^>nul`) do (
    set "LINE=%%L"
    for /f "tokens=2 delims=:" %%A in ("!LINE!") do (
        for /f "tokens=1 delims=/ " %%B in ("%%A") do (
            set "CANDIDATE=%%B"
            echo(!CANDIDATE!| findstr /r "^3[0-9][0-9][0-9]$" >nul 2>&1
            if !errorlevel!==0 set "PORT=!CANDIDATE!"
        )
    )
)

:WEITER
if defined PORT goto PORT_GEFUNDEN
if !TRIES! LSS 60 goto WARTE

echo  [!] Timeout — Fallback auf 3000
set "PORT=3000"

:PORT_GEFUNDEN
echo  [OK] Server laeuft auf Port: %PORT%
echo  [*] Oeffne Browser: http://localhost:%PORT%
echo.
start http://localhost:%PORT%

echo  ═══════════════════════════════════════════════════════
echo   App laeuft unter: http://localhost:%PORT%
echo   PowerShell-Fenster offen lassen!
echo  ═══════════════════════════════════════════════════════
echo.
pause
