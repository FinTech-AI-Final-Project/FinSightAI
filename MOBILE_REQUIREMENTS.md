# 📱 FinSight AI - Mobile Development Requirements

This document provides comprehensive information about all mobile development requirements, dependencies, and setup procedures.

## 📋 Complete Mobile Dependencies

### 🔧 Core Capacitor Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `@capacitor/core` | ^5.6.0 | Core Capacitor functionality |
| `@capacitor/cli` | ^5.6.0 | Command-line interface |
| `@capacitor/android` | ^5.6.0 | Android platform support |
| `@capacitor/ios` | ^5.6.0 | iOS platform support |

### 📱 Native Plugins

| Plugin | Version | Features | Permissions |
|--------|---------|----------|-------------|
| `@capacitor/camera` | ^5.0.7 | Receipt scanning, photo capture | Camera, Photo Library |
| `@capacitor/filesystem` | ^5.1.4 | PDF/CSV export, file management | Storage access |
| `@capacitor-community/barcode-scanner` | ^4.0.1 | QR/Barcode scanning | Camera |
| `@capacitor/local-notifications` | ^5.0.6 | Budget alerts, reminders | Notifications |
| `@capacitor/push-notifications` | ^5.1.0 | Server notifications | Push notifications |
| `@capacitor/haptics` | ^5.0.6 | Tactile feedback | Vibration |
| `@capacitor/status-bar` | ^5.0.6 | Status bar styling | System UI |
| `@capacitor/splash-screen` | ^5.0.6 | App launch screen | None |
| `@capacitor/keyboard` | ^5.0.6 | Keyboard behavior | None |
| `@capacitor/app` | ^5.0.6 | App lifecycle events | None |

## 🤖 Android Requirements

### Development Environment

| Component | Version | Required | Notes |
|-----------|---------|----------|-------|
| **Android Studio** | Latest | ✅ Yes | IDE and SDK manager |
| **Android SDK** | API 33+ | ✅ Yes | Target SDK version |
| **Android SDK Build-Tools** | 33.0.0+ | ✅ Yes | Build system |
| **Android SDK Platform-Tools** | Latest | ✅ Yes | ADB and other tools |
| **Android Emulator** | Latest | ⚠️ Optional | For testing without device |
| **Java JDK** | 17+ | ✅ Yes | Already required for backend |
| **Gradle** | 7.0+ | ⚠️ Optional | Wrapper included |

### SDK Configuration

```gradle
// variables.gradle
ext {
    minSdkVersion = 22          // Android 5.1+
    compileSdkVersion = 33      // Android 13
    targetSdkVersion = 33       // Android 13
    androidxActivityVersion = '1.7.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoreVersion = '1.10.0'
    androidxFragmentVersion = '1.5.6'
    androidxWebkitVersion = '1.6.1'
}
```

### Android Permissions

```xml
<!-- Required Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Hardware Features -->
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-feature android:name="android.hardware.camera.flash" android:required="false" />
```

## 🍎 iOS Requirements

### Development Environment (macOS only)

| Component | Version | Required | Notes |
|-----------|---------|----------|-------|
| **Xcode** | 14.0+ | ✅ Yes | IDE and iOS SDK |
| **iOS SDK** | 16.0+ | ✅ Yes | Included with Xcode |
| **Command Line Tools** | Latest | ✅ Yes | Build tools |
| **iOS Simulator** | Latest | ⚠️ Optional | Included with Xcode |
| **Apple Developer Account** | N/A | ⚠️ Optional | For device testing |
| **macOS** | 12.0+ | ✅ Yes | Host operating system |

### iOS Configuration

```json
// Info.plist permissions
{
  "NSCameraUsageDescription": "This app uses the camera to scan receipts and capture financial documents.",
  "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to scan receipts and import financial documents.",
  "NSLocalNetworkUsageDescription": "This app needs access to local network for development server connection."
}
```

### iOS Deployment Target

```
iOS Deployment Target: 13.0+
Supported Devices: iPhone, iPad
Supported Orientations: Portrait (primary)
```

## 🔧 Installation Commands

### Automatic Setup (Recommended)

```bash
# Windows
./scripts/mobile-setup.bat

# macOS/Linux
./scripts/mobile-setup.sh
```

### Manual Installation

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Install project dependencies
cd frontend
npm install

# Add mobile platforms
npx cap add android    # Android
npx cap add ios        # iOS (macOS only)

# Build and sync
npm run build
npx cap sync
```

## 📱 Platform-Specific Setup

### Android Setup

1. **Install Android Studio**
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install with default settings
   - Accept all license agreements

2. **Configure SDK**
   ```bash
   # Open Android Studio
   # Go to Tools > SDK Manager
   # Install:
   # - Android SDK Platform 33
   # - Android SDK Build-Tools 33.0.0
   # - Android SDK Platform-Tools
   # - Android Emulator (optional)
   ```

3. **Set Environment Variables**
   ```bash
   # Windows
   set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools

   # macOS/Linux
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

### iOS Setup (macOS only)

1. **Install Xcode**
   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`

2. **Configure Development Team**
   - Open Xcode
   - Sign in with Apple ID
   - Configure development team in project settings

3. **iOS Simulator**
   - Included with Xcode
   - No additional setup required

## 🚀 Build and Run Commands

### Development

```bash
# Build web app and sync to mobile
npm run build:mobile

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Open in IDE
npx cap open android    # Android Studio
npx cap open ios        # Xcode
```

### Production

```bash
# Build for production
npm run build

# Sync to mobile platforms
npx cap sync

# Open for release build
npx cap open android    # Generate signed APK
npx cap open ios        # Archive for App Store
```

## 🔍 Verification Commands

### Check Prerequisites

```bash
# Java version
java -version

# Node.js version
node --version

# Android SDK
android --version
adb version

# iOS tools (macOS only)
xcodebuild -version
xcrun simctl list devices
```

### Check Capacitor Setup

```bash
# Capacitor info
npx cap doctor

# List available platforms
npx cap ls

# Check plugin status
npx cap ls plugins
```

## 🛠️ Troubleshooting

### Common Android Issues

1. **SDK License Not Accepted**
   ```bash
   # Accept all licenses
   %ANDROID_HOME%\tools\bin\sdkmanager --licenses
   ```

2. **Gradle Build Failed**
   ```bash
   # Clean and rebuild
   cd frontend/android
   ./gradlew clean
   ./gradlew build
   ```

3. **Device Not Detected**
   ```bash
   # Enable USB Debugging on device
   # Check device connection
   adb devices
   ```

### Common iOS Issues

1. **Code Signing Error**
   - Configure development team in Xcode
   - Ensure Apple ID is signed in

2. **Simulator Not Found**
   ```bash
   # List available simulators
   xcrun simctl list devices
   ```

3. **Build Failed**
   ```bash
   # Clean build folder
   # In Xcode: Product > Clean Build Folder
   ```

## 📊 Mobile App Features

### Native Capabilities

- ✅ **Camera Access** - Receipt scanning and photo capture
- ✅ **File System** - PDF/CSV export to device storage
- ✅ **Barcode Scanner** - QR code and barcode recognition
- ✅ **Push Notifications** - Budget alerts and reminders
- ✅ **Local Notifications** - Scheduled reminders
- ✅ **Haptic Feedback** - Touch feedback for interactions
- ✅ **Status Bar Control** - App-specific styling
- ✅ **Splash Screen** - Branded app launch experience
- ✅ **Keyboard Management** - Optimized input handling
- ✅ **App Lifecycle** - Background/foreground state management

### Web Technologies

- ✅ **React 18** - Modern UI framework
- ✅ **Material-UI** - Native-like components
- ✅ **Progressive Web App** - Offline capabilities
- ✅ **Responsive Design** - Adaptive layouts
- ✅ **Touch Gestures** - Swipe and tap interactions

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [React Native vs Capacitor](https://capacitorjs.com/docs/getting-started/vs-react-native)

---

**All mobile dependencies and requirements are automatically handled by the setup scripts!** 🚀
