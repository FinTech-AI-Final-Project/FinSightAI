#!/bin/bash

echo "========================================"
echo "FINSIGHT AI - TEST RUNNER"
echo "========================================"
echo ""
echo "Running all tests for FinSight AI..."
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
    echo -e "${BLUE}🧪 $1${NC}"
}

# Create test results directory
mkdir -p test-results

print_info "Running backend tests..."
cd backend
mvn test
backend_result=$?
if [ $backend_result -ne 0 ]; then
    print_error "Backend tests failed"
else
    print_success "Backend tests passed"
fi

# Copy test results
if [ -d "target/surefire-reports" ]; then
    cp -r target/surefire-reports/* ../test-results/backend/ 2>/dev/null || mkdir -p ../test-results/backend
fi
cd ..

echo ""
print_info "Running frontend tests..."
cd frontend
npm test -- --coverage --watchAll=false
frontend_result=$?
if [ $frontend_result -ne 0 ]; then
    print_error "Frontend tests failed"
else
    print_success "Frontend tests passed"
fi

# Copy test results
if [ -d "coverage" ]; then
    cp -r coverage/* ../test-results/frontend/ 2>/dev/null || mkdir -p ../test-results/frontend
fi
cd ..

echo ""
echo "📊 TEST RESULTS SUMMARY:"
echo ""

if [ $backend_result -eq 0 ]; then
    print_success "Backend Tests: PASSED"
else
    print_error "Backend Tests: FAILED"
fi

if [ $frontend_result -eq 0 ]; then
    print_success "Frontend Tests: PASSED"
else
    print_error "Frontend Tests: FAILED"
fi

echo ""
echo "📁 Test reports saved to: test-results/"
echo ""

if [ $backend_result -ne 0 ]; then
    echo "🔍 Backend test details: test-results/backend/"
fi

if [ $frontend_result -ne 0 ]; then
    echo "🔍 Frontend test details: test-results/frontend/"
fi

echo ""
if [ $backend_result -eq 0 ] && [ $frontend_result -eq 0 ]; then
    print_success "ALL TESTS PASSED!"
    echo "Your application is ready for deployment."
else
    print_error "SOME TESTS FAILED!"
    echo "Please fix failing tests before deployment."
fi

echo ""
