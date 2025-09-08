@echo off
echo Setting up FinSight AI Development Environment...
echo.

echo Step 1: Installing Frontend Dependencies
cd frontend
echo Installing npm packages...
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo Step 2: Installing Capacitor CLI (if not already installed)
call npm install -g @capacitor/cli
echo.

echo Step 3: Setting up Backend
cd ..\backend
echo Compiling Maven project...
call mvn compile
if %errorlevel% neq 0 (
    echo Error compiling backend!
    pause
    exit /b 1
)
echo Backend compiled successfully!
echo.

echo Step 4: Database Setup Instructions
echo ============================================
echo Please complete these manual steps:
echo.
echo 1. Install PostgreSQL if not already installed
echo 2. Create database named 'finsight_ai'
echo 3. Update backend/src/main/resources/application.properties with your database credentials
echo.
echo Example:
echo spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
echo spring.datasource.username=your_username
echo spring.datasource.password=your_password
echo.

echo Step 5: Firebase Setup Instructions
echo ============================================
echo 1. Create a Firebase project at https://console.firebase.google.com
echo 2. Enable Authentication with Email/Password
echo 3. Generate a service account key
echo 4. Place the key file in backend/src/main/resources/ as 'firebase-service-account.json'
echo 5. Update frontend/src/services/firebase.js with your Firebase config
echo.

echo Step 6: Development Commands
echo ============================================
echo To start development:
echo.
echo Backend:
echo   cd backend
echo   mvn spring-boot:run
echo.
echo Frontend:
echo   cd frontend
echo   npm start
echo.
echo Mobile development:
echo   npm run cap:add:android    (Add Android platform)
echo   npm run cap:add:ios        (Add iOS platform)
echo   npm run android            (Run on Android)
echo   npm run ios                (Run on iOS)
echo.

echo ============================================
echo Development Environment Setup Complete!
echo ============================================
echo.
echo Next Steps:
echo 1. Complete database and Firebase setup (see instructions above)
echo 2. Start the backend server
echo 3. Start the frontend development server
echo 4. Open http://localhost:3000 in your browser
echo.
pause
