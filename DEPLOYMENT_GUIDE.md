# 🚀 FinSight AI - Complete Deployment Guide

This guide provides step-by-step instructions for deploying FinSight AI locally and in production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automated)](#quick-start-automated)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Mobile Development](#mobile-development)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Java** | 17+ | [Adoptium](https://adoptium.net/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | 15+ | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/downloads) |
| **Maven** | 3.6+ | [maven.apache.org](https://maven.apache.org/download.cgi) |

### Optional (for Mobile Development)

| Software | Platform | Version | Download Link |
|----------|----------|---------|---------------|
| **Android Studio** | Windows/macOS/Linux | Latest | [developer.android.com](https://developer.android.com/studio) |
| **Android SDK Build-Tools** | All | 33.0.0+ | Included with Android Studio |
| **Android SDK Platform** | All | API Level 33 | Included with Android Studio |
| **Xcode** | macOS only | 14.0+ | [Mac App Store](https://apps.apple.com/us/app/xcode/id497799835) |
| **iOS SDK** | macOS only | 16.0+ | Included with Xcode |

### Mobile Dependencies (Auto-installed)

**Capacitor Plugins:**
- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/android` - Android platform support
- `@capacitor/ios` - iOS platform support
- `@capacitor/camera` - Camera access for receipt scanning
- `@capacitor/filesystem` - File system access for PDF/CSV export
- `@capacitor/local-notifications` - Local notifications
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/barcode-scanner` - Barcode/QR code scanning
- `@capacitor/haptics` - Device vibration feedback
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/splash-screen` - App launch screen
- `@capacitor/keyboard` - Keyboard behavior control

## 🚀 Quick Start (Automated)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/FinSightAI.git
cd FinSightAI
```

### 2. Run Setup Script

**Windows:**
```batch
./scripts/setup-windows.bat
```

**macOS/Linux:**
```bash
./scripts/setup-unix.sh
```

### 3. Configure APIs

**Windows:**
```batch
./scripts/configure-apis.bat
```

**macOS/Linux:**
```bash
./scripts/configure-apis.sh
```

### 4. Start Development

**Windows:**
```batch
./scripts/start-dev.bat
```

**macOS/Linux:**
```bash
./scripts/start-dev.sh
```

## 📋 Manual Setup

### Step 1: Database Setup

1. **Install PostgreSQL 15+**

2. **Create Database and User:**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Create database
   CREATE DATABASE finsight_ai;
   
   -- Create user
   CREATE USER finsight_user WITH PASSWORD 'your_secure_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE finsight_ai TO finsight_user;
   
   -- Exit
   \q
   ```

### Step 2: Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard
   - Enable Authentication with Email/Password

2. **Get Service Account Key:**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Save as `backend/src/main/resources/firebase-service-account.json`

3. **Get Web Configuration:**
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Click on web app or create one
   - Copy the configuration object

### Step 3: AI Agent Setup

1. **Sign up for Gradient AI:**
   - Go to [Gradient AI](https://gradient.ai/)
   - Create an account
   - Create a new agent
   - Copy the API URL and API Key

### Step 4: Backend Configuration

1. **Copy Configuration Template:**
   ```bash
   cd backend/src/main/resources
   cp application.properties.example application.properties
   ```

2. **Edit `application.properties`:**
   ```properties
   # Database Configuration
   spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
   spring.datasource.username=finsight_user
   spring.datasource.password=your_secure_password
   
   # AI Agent Configuration
   ai.agent.api.url=your_gradient_ai_agent_url
   ai.agent.api.key=your_gradient_ai_api_key
   
   # CORS Configuration (add your IP)
   app.cors.allowed-origins=http://localhost:3000,http://localhost:8100,http://YOUR_IP:3000
   ```

### Step 5: Frontend Configuration

1. **Copy Configuration Template:**
   ```bash
   cd frontend
   cp env.example .env
   ```

2. **Edit `.env`:**
   ```bash
   # API Configuration
   REACT_APP_API_URL=http://localhost:8081/api
   REACT_APP_API_URL_MOBILE=http://YOUR_LOCAL_IP:8081/api
   
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### Step 6: Install Dependencies

```bash
# Backend Dependencies
cd backend
mvn clean install

# Frontend Dependencies
cd frontend
npm install

# Global Capacitor CLI (for mobile)
npm install -g @capacitor/cli
```

## 🖥️ Running the Application

### Development Mode

1. **Start Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start Frontend (in new terminal):**
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application:**
   - **Web App**: http://localhost:3000
   - **API**: http://localhost:8081/api
   - **API Docs**: http://localhost:8081/api/swagger-ui.html

### Using Scripts

**Windows:**
```batch
./scripts/start-dev.bat
```

**macOS/Linux:**
```bash
./scripts/start-dev.sh
```

## 📱 Mobile Development

### Setup Mobile Environment

**Windows:**
```batch
./scripts/mobile-setup.bat
```

**macOS/Linux:**
```bash
./scripts/mobile-setup.sh
```

### Android Development

1. **Install Android Studio**
2. **Add Android Platform:**
   ```bash
   cd frontend
   npm run cap:add:android
   ```

3. **Build and Run:**
   ```bash
   npm run android
   ```

### iOS Development (macOS only)

1. **Install Xcode**
2. **Add iOS Platform:**
   ```bash
   cd frontend
   npm run cap:add:ios
   ```

3. **Build and Run:**
   ```bash
   npm run ios
   ```

## 🧪 Testing

### Run All Tests

**Windows:**
```batch
./scripts/run-tests.bat
```

**macOS/Linux:**
```bash
./scripts/run-tests.sh
```

### Individual Test Commands

```bash
# Backend Tests
cd backend
mvn test

# Frontend Tests
cd frontend
npm test

# Frontend Tests with Coverage
npm test -- --coverage --watchAll=false
```

## 🏗️ Production Build

### Build All Components

**Windows:**
```batch
./scripts/build-prod.bat
```

**macOS/Linux:**
```bash
./scripts/build-prod.sh
```

### Individual Build Commands

```bash
# Backend JAR
cd backend
mvn clean package -DskipTests

# Frontend Build
cd frontend
npm run build

# Mobile Apps
npm run build:mobile
```

## 🚢 Production Deployment

### Docker Deployment

1. **Create Docker Images:**
   ```bash
   # Backend
   cd backend
   docker build -t finsight-backend .
   
   # Frontend
   cd frontend
   docker build -t finsight-frontend .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

### Cloud Deployment Options

#### Backend Deployment

| Platform | Instructions |
|----------|-------------|
| **Heroku** | Deploy JAR file with Procfile |
| **AWS Elastic Beanstalk** | Upload JAR file |
| **Google Cloud Run** | Deploy container image |
| **Azure App Service** | Deploy JAR file |

#### Frontend Deployment

| Platform | Instructions |
|----------|-------------|
| **Netlify** | Connect GitHub repo |
| **Vercel** | Import project |
| **Firebase Hosting** | Use `firebase deploy` |
| **AWS S3 + CloudFront** | Upload build folder |

### Mobile App Deployment

#### Android (Google Play Store)

1. **Open in Android Studio:**
   ```bash
   cd frontend
   npx cap open android
   ```

2. **Generate Signed APK:**
   - Build → Generate Signed Bundle/APK
   - Follow Google Play Console guidelines

#### iOS (Apple App Store)

1. **Open in Xcode:**
   ```bash
   cd frontend
   npx cap open ios
   ```

2. **Archive and Upload:**
   - Product → Archive
   - Follow App Store Connect guidelines

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
# Windows
net start postgresql-x64-15

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### Port Already in Use
```bash
# Kill process on port 8081 (backend)
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8081 | xargs kill -9
```

#### Firebase Authentication Error
- Verify service account JSON file exists
- Check Firebase project configuration
- Ensure authentication is enabled

#### Mobile Build Fails
- Update Android SDK/Xcode
- Run `npx cap sync`
- Check platform-specific requirements

### Getting Help

1. **Check Logs:**
   - Backend: Console output or `logs/backend.log`
   - Frontend: Browser console or `logs/frontend.log`

2. **Common Commands:**
   ```bash
   # Clean and rebuild
   mvn clean install
   npm install
   
   # Reset mobile platforms
   npx cap sync --force
   ```

3. **Support Channels:**
   - Create GitHub issue with logs
   - Check documentation in `/docs`
   - Join community Discord

## 📚 Additional Resources

- [API Documentation](http://localhost:8081/api/swagger-ui.html)
- [React Documentation](https://reactjs.org/docs)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**Need help?** Create an issue on GitHub or contact support@finsight.ai
