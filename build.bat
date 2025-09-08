@echo off
echo Building FinSight AI Complete Project...
echo.

echo Step 1: Building Backend (Spring Boot)
cd backend
echo Cleaning and building Maven project...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo Error building backend!
    pause
    exit /b 1
)
echo Backend build successful!
echo.

echo Step 2: Building Frontend (React)
cd ..\frontend
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo Error building frontend!
    pause
    exit /b 1
)
echo Frontend build successful!
echo.

echo Step 3: Syncing with Capacitor for mobile
echo Syncing web assets with mobile platforms...
call npx cap sync
if %errorlevel% neq 0 (
    echo Warning: Capacitor sync failed (mobile platforms may not be added yet)
)
echo.

echo ============================================
echo FinSight AI Build Complete!
echo ============================================
echo.
echo Backend JAR: backend\target\finsight-ai-backend-1.0.0.jar
echo Frontend Build: frontend\build\
echo.
echo To run the application:
echo 1. Backend: java -jar backend\target\finsight-ai-backend-1.0.0.jar
echo 2. Frontend: serve frontend\build (or deploy to web server)
echo.
echo To build mobile apps:
echo 1. npm run android (for Android)
echo 2. npm run ios (for iOS)
echo.
pause
