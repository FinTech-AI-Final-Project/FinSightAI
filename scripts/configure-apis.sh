#!/bin/bash

echo "========================================"
echo "FINSIGHT AI - API CONFIGURATION WIZARD"
echo "========================================"
echo ""
echo "This script will help you configure Firebase and AI Agent APIs."
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

# Check if configuration files exist
if [ ! -f "backend/src/main/resources/application.properties" ]; then
    print_error "Backend configuration not found. Please run setup-unix.sh first."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    print_error "Frontend configuration not found. Please run setup-unix.sh first."
    exit 1
fi

echo "🔥 FIREBASE CONFIGURATION"
echo ""
echo "Please follow these steps:"
echo "1. Go to https://console.firebase.google.com/"
echo "2. Create a new project or select existing one"
echo "3. Enable Authentication with Email/Password"
echo "4. Go to Project Settings > Service Accounts"
echo "5. Generate new private key and download JSON file"
echo ""
read -p "Have you downloaded the Firebase service account JSON? (y/n): " firebase_done

if [[ $firebase_done == "y" || $firebase_done == "Y" ]]; then
    echo ""
    echo "📁 Please copy the downloaded JSON file to:"
    echo "   backend/src/main/resources/firebase-service-account.json"
    echo ""
    read -p "Have you copied the JSON file? (y/n): " json_copied
    
    if [[ $json_copied == "y" || $json_copied == "Y" ]]; then
        print_success "Firebase service account configured"
    else
        print_error "Please copy the JSON file and run this script again"
        exit 1
    fi
else
    print_error "Please complete Firebase setup and run this script again"
    exit 1
fi

echo ""
echo "🌐 FIREBASE WEB CONFIGURATION"
echo ""
echo "Now we need your Firebase web app configuration:"
echo "1. In Firebase Console, go to Project Settings > General"
echo "2. Scroll down to \"Your apps\" section"
echo "3. Click on web app or create one if none exists"
echo "4. Copy the configuration values"
echo ""

read -p "Enter Firebase API Key: " firebase_api_key
read -p "Enter Firebase Auth Domain (project-id.firebaseapp.com): " firebase_auth_domain
read -p "Enter Firebase Project ID: " firebase_project_id
read -p "Enter Firebase Storage Bucket (project-id.firebasestorage.app): " firebase_storage_bucket
read -p "Enter Firebase Messaging Sender ID: " firebase_sender_id
read -p "Enter Firebase App ID: " firebase_app_id

echo ""
echo "🤖 AI AGENT CONFIGURATION"
echo ""
echo "Please follow these steps:"
echo "1. Go to https://gradient.ai/"
echo "2. Sign up or log in"
echo "3. Create a new agent"
echo "4. Copy the API URL and API Key"
echo ""

read -p "Enter AI Agent API URL: " ai_api_url
read -p "Enter AI Agent API Key: " ai_api_key

echo ""
print_info "Updating configuration files..."

# Update frontend .env file
print_info "Updating frontend/.env..."
sed -i.bak "s/your-firebase-api-key/$firebase_api_key/g" frontend/.env
sed -i.bak "s/your-project.firebaseapp.com/$firebase_auth_domain/g" frontend/.env
sed -i.bak "s/your-project-id/$firebase_project_id/g" frontend/.env
sed -i.bak "s/your-project.firebasestorage.app/$firebase_storage_bucket/g" frontend/.env
sed -i.bak "s/your-sender-id/$firebase_sender_id/g" frontend/.env
sed -i.bak "s/your-app-id/$firebase_app_id/g" frontend/.env

# Update backend application.properties
print_info "Updating backend/src/main/resources/application.properties..."
sed -i.bak "s/YOUR_GRADIENT_AI_AGENT_API_KEY_HERE/$ai_api_key/g" backend/src/main/resources/application.properties
sed -i.bak "s|https://lxhcfhua6qcqp3wx7qf4jx4f.agents.do-ai.run|$ai_api_url|g" backend/src/main/resources/application.properties

echo ""
print_success "API CONFIGURATION COMPLETE!"
echo ""
echo "📋 CONFIGURED:"
echo "✅ Firebase Authentication"
echo "✅ Firebase Web Configuration"
echo "✅ AI Agent API"
echo ""
echo "🗄️  NEXT STEP: Database Configuration"
echo ""
echo "Please update the database settings in:"
echo "   backend/src/main/resources/application.properties"
echo ""
echo "Update these lines:"
echo "   spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai"
echo "   spring.datasource.username=your_database_username"
echo "   spring.datasource.password=your_database_password"
echo ""
echo "🚀 After database setup, run: ./scripts/start-dev.sh"
echo ""
