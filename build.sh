#!/bin/bash

echo "Building FinSight AI Complete Project..."
echo

echo "Step 1: Building Backend (Spring Boot)"
cd backend
echo "Cleaning and building Maven project..."
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "Error building backend!"
    exit 1
fi
echo "Backend build successful!"
echo

echo "Step 2: Building Frontend (React)"
cd ../frontend
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies!"
    exit 1
fi

echo "Building React application..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error building frontend!"
    exit 1
fi
echo "Frontend build successful!"
echo

echo "Step 3: Syncing with Capacitor for mobile"
echo "Syncing web assets with mobile platforms..."
npx cap sync
if [ $? -ne 0 ]; then
    echo "Warning: Capacitor sync failed (mobile platforms may not be added yet)"
fi
echo

echo "============================================"
echo "FinSight AI Build Complete!"
echo "============================================"
echo
echo "Backend JAR: backend/target/finsight-ai-backend-1.0.0.jar"
echo "Frontend Build: frontend/build/"
echo
echo "To run the application:"
echo "1. Backend: java -jar backend/target/finsight-ai-backend-1.0.0.jar"
echo "2. Frontend: serve frontend/build (or deploy to web server)"
echo
echo "To build mobile apps:"
echo "1. npm run android (for Android)"
echo "2. npm run ios (for iOS)"
echo
