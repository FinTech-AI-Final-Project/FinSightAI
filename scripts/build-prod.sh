#!/bin/bash

echo "========================================"
echo "FINSIGHT AI - PRODUCTION BUILD"
echo "========================================"
echo ""
echo "Building FinSight AI for production deployment..."
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
    echo -e "${BLUE}🔧 $1${NC}"
}

# Check if configuration files exist
if [ ! -f "backend/src/main/resources/application.properties" ]; then
    print_error "Backend configuration not found. Please run setup-unix.sh first."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    print_error "Frontend configuration not found. Please run setup-unix.sh first."
    exit 1
fi

print_info "Building backend..."
cd backend
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    print_error "Backend build failed"
    exit 1
fi
print_success "Backend build complete: target/finsight-ai-0.0.1-SNAPSHOT.jar"
cd ..

echo ""
print_info "Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi
print_success "Frontend build complete: build/"
cd ..

echo ""
print_info "Building mobile apps..."
cd frontend

print_info "Syncing Capacitor..."
npx cap sync
if [ $? -ne 0 ]; then
    print_error "Capacitor sync failed"
    exit 1
fi

print_success "Mobile apps ready for deployment"
cd ..

echo ""
print_success "PRODUCTION BUILD COMPLETE!"
echo ""
echo "📦 BUILD ARTIFACTS:"
echo ""
echo "🔧 Backend JAR:"
echo "   backend/target/finsight-ai-0.0.1-SNAPSHOT.jar"
echo ""
echo "🌐 Frontend Build:"
echo "   frontend/build/"
echo ""
echo "📱 Mobile Apps:"
echo "   frontend/android/ (Android Studio project)"
echo "   frontend/ios/ (Xcode project)"
echo ""
echo "🚀 DEPLOYMENT OPTIONS:"
echo ""
echo "1. 🐳 Docker Deployment:"
echo "   - Backend: docker build -t finsight-backend backend/"
echo "   - Frontend: docker build -t finsight-frontend frontend/"
echo ""
echo "2. ☁️  Cloud Deployment:"
echo "   - Heroku: Deploy JAR file"
echo "   - AWS: Upload to Elastic Beanstalk"
echo "   - Netlify: Deploy build/ folder"
echo ""
echo "3. 📱 Mobile App Stores:"
echo "   - Android: Open frontend/android in Android Studio"
echo "   - iOS: Open frontend/ios in Xcode"
echo ""
echo "📖 For detailed deployment instructions, see README.md"
echo ""
