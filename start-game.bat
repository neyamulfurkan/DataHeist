@echo off
echo Starting DataHeist game server...
echo.
echo Killing any existing server on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /F /PID %%a >nul 2>&1
echo.
echo Serving from project root
echo Access game at: http://127.0.0.1:8080/public/
echo.
live-server --port=8080 --entry-file=public/index.html --no-browser --ignore=node_modules
timeout /t 2
start http://127.0.0.1:8080/public/