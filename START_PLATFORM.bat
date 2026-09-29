@echo off
echo ========================================================
echo   🎙️ STARTING SYNTHETIX VOICE AI OS (AGENCY PLATFORM)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend Server on Port 5000...
start "Voice AI Server" cmd /k "cd server && node index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Dashboard on Port 3000...
start "Voice AI Client" cmd /k "cd client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Opening browser to http://localhost:3000...
start http://localhost:3000

echo.
echo Platform is LIVE! Press any key to exit this launcher window.
pause >nul
