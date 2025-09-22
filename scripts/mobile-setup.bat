@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FINSIGHT AI - MOBILE SETUP
echo ========================================
echo.
echo Setting up mobile development environment...
echo.

:: Check if frontend exists
if not exist "frontend" (
    echo ❌ Frontend directory not found. Please run setup-windows.bat first.
    pause
    exit /b 1
)

cd frontend

echo 🔍 Checking mobile development prerequisites...

:: Check if Android Studio is installed (check common paths)
set android_studio_found=0
if exist "C:\Program Files\Android\Android Studio" set android_studio_found=1
if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" set android_studio_found=1

if %android_studio_found%==1 (
    echo ✅ Android development environment detected
) else (
    echo ⚠️  Android Studio not detected
    echo Please install Android Studio from: https://developer.android.com/studio
    echo.
    echo 📋 ANDROID REQUIREMENTS:
    echo - Android Studio with Android SDK
    echo - Android SDK Build-Tools 33.0.0+
    echo - Android SDK Platform 33 (API Level 33)
    echo - Android SDK Platform-Tools
    echo - Android Emulator (optional)
    echo - Java 17+ (already checked)
)

:: Check if Capacitor CLI is installed
call npx cap --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Capacitor CLI is available
) else (
    echo 🔧 Installing Capacitor CLI...
    call npm install -g @capacitor/cli
)

:: Check if Gradle is available (for Android builds)
call gradle --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Gradle is available
) else (
    echo ⚠️  Gradle not found - will use Gradle wrapper
    echo Android Studio includes Gradle wrapper for builds
)

echo.
echo 📱 Setting up mobile platforms...

:: Check if Android platform exists
if exist "android" (
    echo ✅ Android platform already exists
) else (
    echo 🤖 Adding Android platform...
    call npx cap add android
    if %errorLevel% neq 0 (
        echo ❌ Failed to add Android platform
        pause
        exit /b 1
    )
    echo ✅ Android platform added
)

:: Check if iOS platform exists (Windows can't build iOS but can add platform)
if exist "ios" (
    echo ✅ iOS platform already exists
) else (
    echo 🍎 Adding iOS platform...
    call npx cap add ios
    if %errorLevel% neq 0 (
        echo ❌ Failed to add iOS platform
        pause
        exit /b 1
    )
    echo ✅ iOS platform added (requires macOS to build)
)

echo.
echo 🔄 Building and syncing mobile apps...

:: Build the web app first
echo 🌐 Building web app...
call npm run build
if %errorLevel% neq 0 (
    echo ❌ Web app build failed
    pause
    exit /b 1
)

:: Sync with Capacitor
echo 🔄 Syncing with Capacitor...
call npx cap sync
if %errorLevel% neq 0 (
    echo ❌ Capacitor sync failed
    pause
    exit /b 1
)

echo.
echo ✅ MOBILE SETUP COMPLETE!
echo.
echo 📱 MOBILE DEVELOPMENT COMMANDS:
echo.
echo 🤖 Android Development:
echo    npm run android          - Build and run on Android
echo    npx cap open android     - Open in Android Studio
echo    npx cap run android      - Run on connected device
echo.
echo 🍎 iOS Development (macOS only):
echo    npm run ios              - Build and run on iOS
echo    npx cap open ios         - Open in Xcode
echo    npx cap run ios          - Run on connected device
echo.
echo 🔄 Update Mobile Apps:
echo    npm run build:mobile     - Build web app and sync
echo    npx cap sync             - Sync web assets only
echo    npx cap copy             - Copy web assets only
echo.
echo 📱 TESTING ON DEVICE:
echo.
echo 1. Connect your Android device via USB
echo 2. Enable Developer Options and USB Debugging
echo 3. Run: npm run android
echo.
echo 🔧 TROUBLESHOOTING:
echo.
echo If Android build fails:
echo - Open Android Studio
echo - Install required SDK components
echo - Accept license agreements
echo - Update Gradle if prompted
echo.
echo 📖 For detailed mobile development guide, see README.md
echo.
cd ..
pause
