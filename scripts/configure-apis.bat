@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FINSIGHT AI - API CONFIGURATION WIZARD
echo ========================================
echo.
echo This script will help you configure Firebase and AI Agent APIs.
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

echo 🔥 FIREBASE CONFIGURATION
echo.
echo Please follow these steps:
echo 1. Go to https://console.firebase.google.com/
echo 2. Create a new project or select existing one
echo 3. Enable Authentication with Email/Password
echo 4. Go to Project Settings ^> Service Accounts
echo 5. Generate new private key and download JSON file
echo.
set /p firebase_done="Have you downloaded the Firebase service account JSON? (y/n): "

if /i "%firebase_done%"=="y" (
    echo.
    echo 📁 Please copy the downloaded JSON file to:
    echo    backend\src\main\resources\firebase-service-account.json
    echo.
    set /p json_copied="Have you copied the JSON file? (y/n): "
    
    if /i "%json_copied%"=="y" (
        echo ✅ Firebase service account configured
    ) else (
        echo ❌ Please copy the JSON file and run this script again
        pause
        exit /b 1
    )
) else (
    echo ❌ Please complete Firebase setup and run this script again
    pause
    exit /b 1
)

echo.
echo 🌐 FIREBASE WEB CONFIGURATION
echo.
echo Now we need your Firebase web app configuration:
echo 1. In Firebase Console, go to Project Settings ^> General
echo 2. Scroll down to "Your apps" section
echo 3. Click on web app or create one if none exists
echo 4. Copy the configuration values
echo.

set /p firebase_api_key="Enter Firebase API Key: "
set /p firebase_auth_domain="Enter Firebase Auth Domain (project-id.firebaseapp.com): "
set /p firebase_project_id="Enter Firebase Project ID: "
set /p firebase_storage_bucket="Enter Firebase Storage Bucket (project-id.firebasestorage.app): "
set /p firebase_sender_id="Enter Firebase Messaging Sender ID: "
set /p firebase_app_id="Enter Firebase App ID: "

echo.
echo 🤖 AI AGENT CONFIGURATION
echo.
echo Please follow these steps:
echo 1. Go to https://gradient.ai/
echo 2. Sign up or log in
echo 3. Create a new agent
echo 4. Copy the API URL and API Key
echo.

set /p ai_api_url="Enter AI Agent API URL: "
set /p ai_api_key="Enter AI Agent API Key: "

echo.
echo 🔄 Updating configuration files...

:: Update frontend .env file
echo 📝 Updating frontend/.env...
powershell -Command "(Get-Content 'frontend\.env') -replace 'your-firebase-api-key', '%firebase_api_key%' | Set-Content 'frontend\.env'"
powershell -Command "(Get-Content 'frontend\.env') -replace 'your-project.firebaseapp.com', '%firebase_auth_domain%' | Set-Content 'frontend\.env'"
powershell -Command "(Get-Content 'frontend\.env') -replace 'your-project-id', '%firebase_project_id%' | Set-Content 'frontend\.env'"
powershell -Command "(Get-Content 'frontend\.env') -replace 'your-project.firebasestorage.app', '%firebase_storage_bucket%' | Set-Content 'frontend\.env'"
powershell -Command "(Get-Content 'frontend\.env') -replace 'your-sender-id', '%firebase_sender_id%' | Set-Content 'frontend\.env'"
powershell -Command "(Get-Content 'frontend\.env') -replace 'your-app-id', '%firebase_app_id%' | Set-Content 'frontend\.env'"

:: Update backend application.properties
echo 📝 Updating backend/src/main/resources/application.properties...
powershell -Command "(Get-Content 'backend\src\main\resources\application.properties') -replace 'YOUR_GRADIENT_AI_AGENT_API_KEY_HERE', '%ai_api_key%' | Set-Content 'backend\src\main\resources\application.properties'"
powershell -Command "(Get-Content 'backend\src\main\resources\application.properties') -replace 'https://lxhcfhua6qcqp3wx7qf4jx4f.agents.do-ai.run', '%ai_api_url%' | Set-Content 'backend\src\main\resources\application.properties'"

echo.
echo ✅ API CONFIGURATION COMPLETE!
echo.
echo 📋 CONFIGURED:
echo ✅ Firebase Authentication
echo ✅ Firebase Web Configuration  
echo ✅ AI Agent API
echo.
echo 🗄️  NEXT STEP: Database Configuration
echo.
echo Please update the database settings in:
echo    backend\src\main\resources\application.properties
echo.
echo Update these lines:
echo    spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
echo    spring.datasource.username=your_database_username
echo    spring.datasource.password=your_database_password
echo.
echo 🚀 After database setup, run: scripts\start-dev.bat
echo.
pause
