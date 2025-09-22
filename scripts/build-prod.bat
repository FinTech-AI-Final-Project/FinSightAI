@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FINSIGHT AI - PRODUCTION BUILD
echo ========================================
echo.
echo Building FinSight AI for production deployment...
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

echo 🔧 Building backend...
cd backend
call mvn clean package -DskipTests
if %errorLevel% neq 0 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)
echo ✅ Backend build complete: target/finsight-ai-0.0.1-SNAPSHOT.jar
cd ..

echo.
echo 🌐 Building frontend...
cd frontend
call npm run build
if %errorLevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend build complete: build/
cd ..

echo.
echo 📱 Building mobile apps...
cd frontend

echo 🔄 Syncing Capacitor...
call npx cap sync
if %errorLevel% neq 0 (
    echo ❌ Capacitor sync failed
    pause
    exit /b 1
)

echo ✅ Mobile apps ready for deployment
cd ..

echo.
echo ✅ PRODUCTION BUILD COMPLETE!
echo.
echo 📦 BUILD ARTIFACTS:
echo.
echo 🔧 Backend JAR:
echo    backend\target\finsight-ai-0.0.1-SNAPSHOT.jar
echo.
echo 🌐 Frontend Build:
echo    frontend\build\
echo.
echo 📱 Mobile Apps:
echo    frontend\android\ (Android Studio project)
echo    frontend\ios\ (Xcode project)
echo.
echo 🚀 DEPLOYMENT OPTIONS:
echo.
echo 1. 🐳 Docker Deployment:
echo    - Backend: docker build -t finsight-backend backend/
echo    - Frontend: docker build -t finsight-frontend frontend/
echo.
echo 2. ☁️  Cloud Deployment:
echo    - Heroku: Deploy JAR file
echo    - AWS: Upload to Elastic Beanstalk
echo    - Netlify: Deploy build/ folder
echo.
echo 3. 📱 Mobile App Stores:
echo    - Android: Open frontend\android in Android Studio
echo    - iOS: Open frontend\ios in Xcode
echo.
echo 📖 For detailed deployment instructions, see README.md
echo.
pause
