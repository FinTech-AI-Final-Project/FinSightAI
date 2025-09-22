@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FINSIGHT AI - DEVELOPMENT SERVER
echo ========================================
echo.
echo Starting FinSight AI development environment...
echo.

:: Check if configuration files exist
if not exist "backend\src\main\resources\application.properties" (
    echo ❌ Backend configuration not found. Please run setup-windows.bat first.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo ❌ Frontend configuration not found. Please run setup-windows.bat first.
    pause
    exit /b 1
)

:: Check if Firebase service account exists
if not exist "backend\src\main\resources\firebase-service-account.json" (
    echo ❌ Firebase service account not found. Please run configure-apis.bat first.
    pause
    exit /b 1
)

echo 🔍 Checking services...

:: Check if PostgreSQL is running
tasklist /FI "IMAGENAME eq postgres.exe" 2>NUL | find /I /N "postgres.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ PostgreSQL is running
) else (
    echo ❌ PostgreSQL is not running
    echo Please start PostgreSQL service and try again
    pause
    exit /b 1
)

echo.
echo 🚀 Starting development servers...
echo.

:: Create log directory
if not exist "logs" mkdir logs

:: Start backend in new window
echo 🔧 Starting backend server...
start "FinSight AI Backend" cmd /k "cd /d %CD%\backend && echo Starting Spring Boot backend... && mvn spring-boot:run"

:: Wait a moment for backend to start
timeout /t 5 /nobreak >nul

:: Start frontend in new window
echo 🌐 Starting frontend server...
start "FinSight AI Frontend" cmd /k "cd /d %CD%\frontend && echo Starting React frontend... && npm start"

:: Wait for servers to start
echo ⏳ Waiting for servers to start...
timeout /t 10 /nobreak >nul

echo.
echo ✅ DEVELOPMENT SERVERS STARTED!
echo.
echo 📱 ACCESS YOUR APPLICATION:
echo.
echo 🌐 Web Application:
echo    http://localhost:3000
echo.
echo 🔧 Backend API:
echo    http://localhost:8081/api
echo.
echo 📚 API Documentation:
echo    http://localhost:8081/api/swagger-ui.html
echo.
echo 📱 MOBILE DEVELOPMENT:
echo.
echo To run on Android:
echo    cd frontend
echo    npm run android
echo.
echo To run on iOS (macOS only):
echo    cd frontend  
echo    npm run ios
echo.
echo 🛑 TO STOP SERVERS:
echo    Close the backend and frontend command windows
echo    Or press Ctrl+C in each window
echo.
echo 📊 MONITORING:
echo    - Backend logs: Check backend command window
echo    - Frontend logs: Check frontend command window
echo    - Database: Use pgAdmin or psql
echo.
echo 🔧 USEFUL COMMANDS:
echo.
echo Build for production:
echo    scripts\build-prod.bat
echo.
echo Run tests:
echo    scripts\run-tests.bat
echo.
echo Update mobile apps:
echo    cd frontend
echo    npm run build:mobile
echo.
echo 📖 For more information, see README.md
echo.
pause
