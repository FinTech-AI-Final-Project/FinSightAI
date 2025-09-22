#!/bin/bash

echo "========================================"
echo "FINSIGHT AI - MOBILE SETUP"
echo "========================================"
echo ""
echo "Setting up mobile development environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}🔍 $1${NC}"
}

# Check if frontend exists
if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found. Please run setup-unix.sh first."
    exit 1
fi

cd frontend

print_info "Checking mobile development prerequisites..."

# Check if Android development environment is available
if command -v android &> /dev/null || [ -d "$HOME/Android/Sdk" ] || [ -d "/opt/android-sdk" ]; then
    print_success "Android development environment detected"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    print_warning "Android Studio not detected"
    echo "Please install Android Studio from: https://developer.android.com/studio"
    echo ""
    echo "📋 ANDROID REQUIREMENTS:"
    echo "- Android Studio with Android SDK"
    echo "- Android SDK Build-Tools 33.0.0+"
    echo "- Android SDK Platform 33 (API Level 33)"
    echo "- Android SDK Platform-Tools"
    echo "- Android Emulator (optional)"
    echo "- Java 17+ (already checked)"
else
    print_warning "Android development environment not detected"
    echo "Please install Android Studio from: https://developer.android.com/studio"
    echo ""
    echo "📋 ANDROID REQUIREMENTS:"
    echo "- Android Studio with Android SDK"
    echo "- Android SDK Build-Tools 33.0.0+"
    echo "- Android SDK Platform 33 (API Level 33)"
    echo "- Android SDK Platform-Tools"
    echo "- Android Emulator (optional)"
    echo "- Java 17+ (already checked)"
fi

# Check if Xcode is available (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcodebuild &> /dev/null; then
        print_success "Xcode is installed"
        # Check Xcode version
        xcode_version=$(xcodebuild -version | head -n1 | awk '{print $2}')
        echo "   Xcode version: $xcode_version"
    else
        print_warning "Xcode not detected"
        echo "Please install Xcode from the Mac App Store"
        echo ""
        echo "📋 iOS REQUIREMENTS:"
        echo "- Xcode 14.0+ (latest recommended)"
        echo "- iOS SDK 16.0+ (included with Xcode)"
        echo "- Command Line Tools for Xcode"
        echo "- Apple Developer Account (for device testing)"
        echo "- iOS Simulator (included with Xcode)"
    fi
else
    print_info "iOS development requires macOS and Xcode"
fi

# Check if Gradle is available (for Android builds)
if command -v gradle &> /dev/null; then
    print_success "Gradle is available"
    gradle_version=$(gradle --version | grep "Gradle" | head -n1 | awk '{print $2}')
    echo "   Gradle version: $gradle_version"
else
    print_warning "Gradle not found - will use Gradle wrapper"
    echo "Android Studio includes Gradle wrapper for builds"
fi

# Check if Capacitor CLI is installed
if npx cap --version &> /dev/null; then
    print_success "Capacitor CLI is available"
else
    print_info "Installing Capacitor CLI..."
    npm install -g @capacitor/cli
fi

echo ""
print_info "Setting up mobile platforms..."

# Check if Android platform exists
if [ -d "android" ]; then
    print_success "Android platform already exists"
else
    print_info "Adding Android platform..."
    npx cap add android
    if [ $? -ne 0 ]; then
        print_error "Failed to add Android platform"
        exit 1
    fi
    print_success "Android platform added"
fi

# Check if iOS platform exists
if [ -d "ios" ]; then
    print_success "iOS platform already exists"
else
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Adding iOS platform..."
        npx cap add ios
        if [ $? -ne 0 ]; then
            print_error "Failed to add iOS platform"
            exit 1
        fi
        print_success "iOS platform added"
    else
        print_info "Skipping iOS platform (requires macOS)"
    fi
fi

echo ""
print_info "Building and syncing mobile apps..."

# Build the web app first
print_info "Building web app..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Web app build failed"
    exit 1
fi

# Sync with Capacitor
print_info "Syncing with Capacitor..."
npx cap sync
if [ $? -ne 0 ]; then
    print_error "Capacitor sync failed"
    exit 1
fi

echo ""
print_success "MOBILE SETUP COMPLETE!"
echo ""
echo "📱 MOBILE DEVELOPMENT COMMANDS:"
echo ""
echo "🤖 Android Development:"
echo "   npm run android          - Build and run on Android"
echo "   npx cap open android     - Open in Android Studio"
echo "   npx cap run android      - Run on connected device"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 iOS Development:"
    echo "   npm run ios              - Build and run on iOS"
    echo "   npx cap open ios         - Open in Xcode"
    echo "   npx cap run ios          - Run on connected device"
    echo ""
fi

echo "🔄 Update Mobile Apps:"
echo "   npm run build:mobile     - Build web app and sync"
echo "   npx cap sync             - Sync web assets only"
echo "   npx cap copy             - Copy web assets only"
echo ""
echo "📱 TESTING ON DEVICE:"
echo ""
echo "Android:"
echo "1. Connect your Android device via USB"
echo "2. Enable Developer Options and USB Debugging"
echo "3. Run: npm run android"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "iOS:"
    echo "1. Connect your iOS device via USB"
    echo "2. Trust the computer on your device"
    echo "3. Run: npm run ios"
    echo ""
fi

echo "🔧 TROUBLESHOOTING:"
echo ""
echo "If Android build fails:"
echo "- Open Android Studio"
echo "- Install required SDK components"
echo "- Accept license agreements"
echo "- Update Gradle if prompted"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "If iOS build fails:"
    echo "- Open Xcode"
    echo "- Install required components"
    echo "- Sign in with Apple ID for device testing"
    echo ""
fi

echo "📖 For detailed mobile development guide, see README.md"
echo ""

cd ..
