@echo off
title KI Content Fabrik - Server beenden
color 0C
setlocal enabledelayedexpansion

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║    KI Content Fabrik — Server beenden                 ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

set "PROJEKT=KI_Content_Fabrik_Social_Media_Creator"

echo  [*] Suche nach laufendem Next.js Server fuer: %PROJEKT%
echo.

set "GEFUNDEN_PID="
for /f "skip=1 tokens=1,2 delims=," %%A in (
    'wmic process where "name='node.exe'" get processid^,commandline /format:csv 2^>nul'
) do (
    echo %%A | findstr /i "%PROJEKT%" >nul 2>&1
    if !errorlevel!==0 (
        set "GEFUNDEN_PID=%%B"
    )
)

if not defined GEFUNDEN_PID (
    echo  [!] Kein laufender Server gefunden.
    goto ENDE
)

set "GEFUNDEN_PID=%GEFUNDEN_PID: =%"
echo  [*] Server gefunden — PID: %GEFUNDEN_PID%

echo  [*] Beende Prozess PID %GEFUNDEN_PID%...
taskkill /PID %GEFUNDEN_PID% /F >nul 2>&1

if %errorlevel%==0 (
    echo  [OK] Server erfolgreich beendet!
) else (
    echo  [!] Fehler — Prozess evtl. bereits gestoppt.
)

:ENDE
echo.
echo  ═══════════════════════════════════════════════════════
echo   Fertig. Fenster schliesst in 4 Sekunden...
echo  ═══════════════════════════════════════════════════════
echo.
timeout /t 4 /nobreak >nul
