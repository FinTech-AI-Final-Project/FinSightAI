#!/bin/bash

echo "========================================"
echo "FINSIGHT AI - DEVELOPMENT SERVER"
echo "========================================"
echo ""
echo "Starting FinSight AI development environment..."
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

# Check if Firebase service account exists
if [ ! -f "backend/src/main/resources/firebase-service-account.json" ]; then
    print_error "Firebase service account not found. Please run configure-apis.sh first."
    exit 1
fi

print_info "Checking services..."

# Check if PostgreSQL is running
if pgrep -x "postgres" > /dev/null; then
    print_success "PostgreSQL is running"
elif pgrep -f "postgresql" > /dev/null; then
    print_success "PostgreSQL is running"
else
    print_error "PostgreSQL is not running"
    echo "Please start PostgreSQL service and try again"
    echo ""
    echo "On macOS: brew services start postgresql"
    echo "On Ubuntu: sudo systemctl start postgresql"
    echo "On CentOS/RHEL: sudo systemctl start postgresql"
    exit 1
fi

echo ""
print_info "Starting development servers..."
echo ""

# Create log directory
mkdir -p logs

# Function to cleanup background processes
cleanup() {
    echo ""
    print_info "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend
print_info "Starting backend server..."
cd backend
mvn spring-boot:run > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend
print_info "Starting frontend server..."
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for servers to start
print_info "Waiting for servers to start..."
sleep 10

echo ""
print_success "DEVELOPMENT SERVERS STARTED!"
echo ""
echo "📱 ACCESS YOUR APPLICATION:"
echo ""
echo "🌐 Web Application:"
echo "   http://localhost:3000"
echo ""
echo "🔧 Backend API:"
echo "   http://localhost:8081/api"
echo ""
echo "📚 API Documentation:"
echo "   http://localhost:8081/api/swagger-ui.html"
echo ""
echo "📱 MOBILE DEVELOPMENT:"
echo ""
echo "To run on Android:"
echo "   cd frontend"
echo "   npm run android"
echo ""
echo "To run on iOS (macOS only):"
echo "   cd frontend"
echo "   npm run ios"
echo ""
echo "🛑 TO STOP SERVERS:"
echo "   Press Ctrl+C in this terminal"
echo ""
echo "📊 MONITORING:"
echo "   - Backend logs: tail -f logs/backend.log"
echo "   - Frontend logs: tail -f logs/frontend.log"
echo "   - Database: Use pgAdmin or psql"
echo ""
echo "🔧 USEFUL COMMANDS:"
echo ""
echo "Build for production:"
echo "   ./scripts/build-prod.sh"
echo ""
echo "Run tests:"
echo "   ./scripts/run-tests.sh"
echo ""
echo "Update mobile apps:"
echo "   cd frontend"
echo "   npm run build:mobile"
echo ""
echo "📖 For more information, see README.md"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend server stopped unexpectedly"
        print_info "Check logs/backend.log for details"
        break
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend server stopped unexpectedly"
        print_info "Check logs/frontend.log for details"
        break
    fi
    
    sleep 5
done

cleanup
