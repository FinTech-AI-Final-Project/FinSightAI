#!/bin/bash

echo "========================================"
echo "FINSIGHT AI - UNIX SETUP SCRIPT"
echo "========================================"
echo ""
echo "This script will set up FinSight AI for local development."
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

# Check if script is run with sudo for package installations
if [[ $EUID -eq 0 ]]; then
   print_warning "This script should not be run as root/sudo"
   print_info "Please run as regular user. The script will prompt for sudo when needed."
   exit 1
fi

print_info "Checking prerequisites..."
echo ""

# Check Java
if command -v java &> /dev/null; then
    print_success "Java is installed"
    java -version
else
    print_error "Java 17+ is required"
    echo "Please install Java 17+ from: https://adoptium.net/"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    print_success "Node.js is installed"
    node --version
else
    print_error "Node.js 18+ is required"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    print_success "PostgreSQL is installed"
    psql --version
else
    print_error "PostgreSQL 15+ is required"
    echo "Please install PostgreSQL from: https://www.postgresql.org/download/"
    exit 1
fi

# Check Maven
if command -v mvn &> /dev/null; then
    print_success "Maven is installed"
    mvn --version | grep "Apache Maven"
else
    print_error "Maven is required"
    echo "Please install Maven from: https://maven.apache.org/download.cgi"
    exit 1
fi

echo ""
print_info "Setting up project structure..."

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Copy configuration files
print_info "Copying configuration templates..."

# Backend configuration
if [ ! -f "backend/src/main/resources/application.properties" ]; then
    if [ -f "backend/src/main/resources/application.properties.example" ]; then
        cp "backend/src/main/resources/application.properties.example" "backend/src/main/resources/application.properties"
        print_success "Created backend/src/main/resources/application.properties"
    else
        print_error "Backend configuration template not found"
        exit 1
    fi
else
    print_success "Backend configuration already exists"
fi

# Frontend configuration
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/env.example" ]; then
        cp "frontend/env.example" "frontend/.env"
        print_success "Created frontend/.env"
    else
        print_error "Frontend configuration template not found"
        exit 1
    fi
else
    print_success "Frontend configuration already exists"
fi

echo ""
print_info "Installing dependencies..."

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
mvn clean install -DskipTests
if [ $? -ne 0 ]; then
    print_error "Backend dependency installation failed"
    exit 1
fi
cd ..

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    print_error "Frontend dependency installation failed"
    exit 1
fi

# Install Capacitor CLI globally
print_info "Installing Capacitor CLI..."
npm install -g @capacitor/cli
cd ..

echo ""
print_info "Detecting local IP address..."

# Detect IP address (works on most Unix systems)
if command -v ip &> /dev/null; then
    # Linux with ip command
    LOCAL_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+')
elif command -v ifconfig &> /dev/null; then
    # macOS/BSD with ifconfig
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
    print_warning "Could not detect IP address automatically"
    LOCAL_IP=""
fi

if [ ! -z "$LOCAL_IP" ]; then
    print_success "Detected IP: $LOCAL_IP"
    print_info "Updating mobile API URL in frontend/.env..."
    sed -i.bak "s/YOUR_LOCAL_IP/$LOCAL_IP/g" frontend/.env
    print_success "Updated REACT_APP_API_URL_MOBILE=http://$LOCAL_IP:8081/api"
else
    print_warning "Could not detect IP address. Please manually update frontend/.env"
fi

echo ""
print_success "SETUP COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. 🔥 Configure Firebase:"
echo "   - Create project at https://console.firebase.google.com/"
echo "   - Download service account JSON to backend/src/main/resources/firebase-service-account.json"
echo "   - Update Firebase config in frontend/.env"
echo ""
echo "2. 🤖 Configure AI Agent:"
echo "   - Get API key from https://gradient.ai/"
echo "   - Update ai.agent.api.url and ai.agent.api.key in backend/src/main/resources/application.properties"
echo ""
echo "3. 🗄️  Set up Database:"
echo "   - Create PostgreSQL database 'finsight_ai'"
echo "   - Update database credentials in backend/src/main/resources/application.properties"
echo ""
echo "4. 🚀 Start Development:"
echo "   - Run: ./scripts/start-dev.sh"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
