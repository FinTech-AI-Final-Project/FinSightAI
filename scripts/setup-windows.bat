@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FINSIGHT AI - WINDOWS SETUP SCRIPT
echo ========================================
echo.
echo This script will set up FinSight AI for local development.
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as Administrator
) else (
    echo ❌ Please run this script as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo 🔍 Checking prerequisites...
echo.

:: Check Java
java -version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Java is installed
    java -version
) else (
    echo ❌ Java 17+ is required
    echo Please download from: https://adoptium.net/
    pause
    exit /b 1
)

:: Check Node.js
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js is installed
    node --version
) else (
    echo ❌ Node.js 18+ is required
    echo Please download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check PostgreSQL
psql --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ PostgreSQL is installed
    psql --version
) else (
    echo ❌ PostgreSQL 15+ is required
    echo Please download from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

:: Check Maven
mvn --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Maven is installed
    mvn --version | findstr "Apache Maven"
) else (
    echo ❌ Maven is required
    echo Please download from: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

echo.
echo 📁 Setting up project structure...

:: Create scripts directory if it doesn't exist
if not exist "scripts" mkdir scripts

:: Copy configuration files
echo 📋 Copying configuration templates...

:: Backend configuration
if not exist "backend\src\main\resources\application.properties" (
    if exist "backend\src\main\resources\application.properties.example" (
        copy "backend\src\main\resources\application.properties.example" "backend\src\main\resources\application.properties"
        echo ✅ Created backend/src/main/resources/application.properties
    ) else (
        echo ❌ Backend configuration template not found
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend configuration already exists
)

:: Frontend configuration
if not exist "frontend\.env" (
    if exist "frontend\env.example" (
        copy "frontend\env.example" "frontend\.env"
        echo ✅ Created frontend/.env
    ) else (
        echo ❌ Frontend configuration template not found
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend configuration already exists
)

echo.
echo 📦 Installing dependencies...

:: Install backend dependencies
echo 🔧 Installing backend dependencies...
cd backend
call mvn clean install -DskipTests
if %errorLevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
cd ..

:: Install frontend dependencies
echo 🔧 Installing frontend dependencies...
cd frontend
call npm install
if %errorLevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)

:: Install Capacitor CLI globally
echo 🔧 Installing Capacitor CLI...
call npm install -g @capacitor/cli
cd ..

echo.
echo 🎯 Detecting local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    if not "!ip!"=="" (
        if not "!ip!"=="127.0.0.1" (
            echo ✅ Detected IP: !ip!
            goto :ip_found
        )
    )
)

:ip_found
if defined ip (
    echo 🔄 Updating mobile API URL in frontend/.env...
    powershell -Command "(Get-Content 'frontend\.env') -replace 'YOUR_LOCAL_IP', '!ip!' | Set-Content 'frontend\.env'"
    echo ✅ Updated REACT_APP_API_URL_MOBILE=http://!ip!:8081/api
) else (
    echo ⚠️  Could not detect IP address. Please manually update frontend/.env
)

echo.
echo ✅ SETUP COMPLETE!
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. 🔥 Configure Firebase:
echo    - Create project at https://console.firebase.google.com/
echo    - Download service account JSON to backend/src/main/resources/firebase-service-account.json
echo    - Update Firebase config in frontend/.env
echo.
echo 2. 🤖 Configure AI Agent:
echo    - Get API key from https://gradient.ai/
echo    - Update ai.agent.api.url and ai.agent.api.key in backend/src/main/resources/application.properties
echo.
echo 3. 🗄️  Set up Database:
echo    - Create PostgreSQL database 'finsight_ai'
echo    - Update database credentials in backend/src/main/resources/application.properties
echo.
echo 4. 🚀 Start Development:
echo    - Run: scripts\start-dev.bat
echo.
echo 📖 For detailed instructions, see README.md
echo.
pause
