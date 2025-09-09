# 💰 FinSight AI - Personal Finance Management with AI

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-5.6.0-purple.svg)](https://capacitorjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication-orange.svg)](https://firebase.google.com/)

A comprehensive personal finance management application with AI-powered insights, expense tracking, budgeting, and mobile support. Built with Spring Boot backend, React frontend, and Capacitor for cross-platform mobile deployment.

## 🌟 Features

- **💡 AI-Powered Financial Tips** - Personalized advice using Google Gemini AI
- **📊 Expense Tracking** - Categorized expense management with receipt scanning
- **💰 Budget Management** - Create and monitor budgets with progress tracking
- **📈 Analytics Dashboard** - Visual insights with charts and spending patterns
- **📱 Mobile Apps** - Native Android and iOS applications
- **🔐 Secure Authentication** - Firebase-powered user management
- **🌍 Multi-language Support** - Built for South African market with ZAR currency
- **📄 Report Generation** - PDF exports and detailed financial reports
- **🔔 Push Notifications** - Budget alerts and spending reminders

## 🏗️ Technology Stack

### Backend

- **Spring Boot 3.2.0** - Java REST API
- **PostgreSQL** - Primary database
- **Firebase Admin SDK** - Authentication and user management
- **Google Gemini AI** - Intelligent financial advice
- **Maven** - Dependency management

### Frontend

- **React 18.2** - Modern UI framework
- **Material-UI 5.15.1** - Component library
- **Chart.js** - Data visualization
- **Framer Motion** - Smooth animations
- **React Router** - Navigation

### Mobile

- **Capacitor 5.6.0** - Cross-platform mobile development
- **Android SDK** - Native Android features
- **iOS Development** - Native iOS features
- **Push Notifications** - Firebase Cloud Messaging

### AI Integration

- **Google Gemini AI** - Intelligent financial advice and personalized tips
- **Tesseract.js** - OCR technology for receipt text extraction
- **AI-Powered Analytics** - Smart spending pattern analysis

## 🚀 Quick Start

### Prerequisites

- **Java 17+** ([Download](https://adoptium.net/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 15+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **Android Studio** (for mobile development)
- **Xcode** (for iOS development - macOS only)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/FinSightAI.git
cd FinSightAI
```

### 2. Database Setup

```bash
# Install PostgreSQL and create database
psql -U postgres
CREATE DATABASE finsight_ai;
\q
```

### 3. Backend Configuration

```bash
# Copy example configuration
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties

# Edit with your database credentials
nano backend/src/main/resources/application.properties
```

**Update the following values:**

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
spring.datasource.username=your_db_username
spring.datasource.password=your_db_password
gemini.api.key=your_gemini_api_key
```

### 4. Firebase Setup

**🔥 [Detailed Firebase Setup Guide](FIREBASE_SETUP.md)**

#### Quick Firebase Configuration:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project: "FinSight AI"
   - Enable Authentication with Email/Password

2. **Get Web Configuration**

   ```bash
   # Copy example file
   cp frontend/src/firebase.js.example frontend/src/firebase.js
   ```
   
3. **Update firebase.js with your config:**

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "your-app-id"
   };
   ```

4. **Service Account for Backend**

   ```bash
   # Download service account JSON from Firebase Console
   # Copy to: backend/src/main/resources/firebase-service-account.json
   cp path/to/downloaded/service-account.json backend/src/main/resources/firebase-service-account.json
   ```

### 5. Google Gemini AI Setup

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Copy the key

2. **Update Backend Configuration**

   ```properties
   # In application.properties
   gemini.api.key=your_actual_gemini_api_key
   gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
   ```

### 6. Start Development Servers

#### Backend:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

*Backend runs on http://localhost:8081*

#### Frontend:

```bash
cd frontend
npm install
npm start
```

*Frontend runs on http://localhost:3000*

### 7. Initial Testing

1. **Open browser**: http://localhost:3000
2. **Register new user**: Click "Register" and create account
3. **Test features**:
   - Add expenses
   - Create budgets
   - View AI tips
   - Check dashboard analytics

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
**Problem**: `Connection refused` or `database does not exist`
```
Solution:
1. Ensure PostgreSQL is running:
   - Windows: Check Services for "postgresql-x64"
   - macOS: brew services start postgresql
   - Linux: sudo systemctl start postgresql

2. Verify database exists:
   psql -U postgres -l

3. Check credentials in application.properties
```

#### Firebase Authentication Issues
**Problem**: Firebase auth not working or configuration errors
```
Solution:
1. Verify Firebase config in frontend/src/config/firebase.js
2. Check that Authentication is enabled in Firebase Console
3. Ensure Email/Password provider is enabled
4. Verify service account key is in backend/src/main/resources/
```

#### Backend Won't Start
**Problem**: Spring Boot application fails to start
```
Solution:
1. Check Java version: java -version (should be 17+)
2. Verify Maven is installed: mvn -version
3. Check database connection in application.properties
4. Look for port conflicts (8081 already in use)
5. Run: mvn clean compile to check for compilation errors
```

#### Frontend Won't Start  
**Problem**: React development server fails to start
```
Solution:
1. Check Node.js version: node -v (should be 16+)
2. Clear npm cache: npm cache clean --force
3. Delete node_modules and reinstall:
   rm -rf node_modules package-lock.json
   npm install
4. Check for port conflicts (3000 already in use)
```

#### Profile Picture Upload Issues
**Problem**: Profile pictures not uploading or displaying
```
Solution:
1. Ensure database schema has TEXT field for profile_picture_url
2. Check file size (should be reasonable for base64 encoding)
3. Verify Firebase authentication is working
4. Check browser console for JavaScript errors
```

#### Currency Not Updating
**Problem**: Currency changes not reflected across pages
```
Solution:
1. Check that UserContext is properly configured
2. Verify currency change events are dispatched
3. Ensure all components use formatCurrency utility
4. Check browser console for errors
```

#### AI Tips Not Loading
**Problem**: Daily tips or personalized tips not appearing
```
Solution:
1. Check that backend is running and accessible
2. Verify API endpoints are responding: http://localhost:8081/api/ai-tips/daily
3. Check browser network tab for failed requests
4. Ensure user is properly authenticated
```

### Error Messages and Solutions

#### "Failed to update profile picture"
- **Cause**: Database field too small or invalid data
- **Solution**: Ensure profile_picture_url is TEXT type in database

#### "Firebase configuration error"
- **Cause**: Missing or incorrect Firebase config
- **Solution**: Double-check Firebase configuration values

#### "CORS policy error"
- **Cause**: Backend not allowing frontend origin
- **Solution**: Verify CORS configuration in Spring Boot

#### "Port already in use"
- **Cause**: Port 8081 or 3000 already occupied
- **Solution**: Stop other applications or change ports in configuration

### Development Tips

#### Hot Reloading Issues
```bash
# Restart frontend dev server
Ctrl+C
npm start

# Restart backend (in IDE or terminal)
Ctrl+C
mvn spring-boot:run
```

#### Database Schema Issues
```bash
# Reset database schema (WARNING: loses data)
# In application.properties, temporarily change:
spring.jpa.hibernate.ddl-auto=create-drop
# Then change back to: update
```

#### Clearing Application Data
```bash
# Clear browser data for localhost:3000
# Or use incognito/private browsing mode

# Reset database (if needed)
DROP DATABASE finsight_ai;
CREATE DATABASE finsight_ai;
```

## 📚 Additional Resources

### Useful Commands
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Check what's running on port 8081
netstat -tulpn | grep 8081  # Linux/macOS
netstat -ano | findstr :8081  # Windows

# View Spring Boot logs
mvn spring-boot:run -Dspring-boot.run.arguments="--logging.level.com.finsight.ai=DEBUG"

# Build frontend for production
npm run build
```

### Development Environment Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Install Java 17 (Ubuntu/Debian)
sudo apt install openjdk-17-jdk

# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## 📱 Mobile Development

### Android Setup

#### Prerequisites:

- **Android Studio** with Android SDK
- **Java Development Kit (JDK) 17**
- **Android SDK API Level 33+**

#### Setup Steps:

1. **Environment Configuration**

   ```bash
   # Set ANDROID_HOME environment variable
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

2. **Add Android Platform**

   ```bash
   cd frontend
   npm install @capacitor/android
   npm run cap:add:android
   ```

3. **Configure App**

   ```bash
   # Update capacitor.config.json
   {
     "appId": "com.finsight.ai",
     "appName": "FinSight AI",
     "webDir": "build",
     "bundledWebRuntime": false,
     "plugins": {
       "PushNotifications": {
         "presentationOptions": ["badge", "sound", "alert"]
       }
     }
   }
   ```

4. **Build and Run**

   ```bash
   # Build React app
   npm run build

   # Sync with Capacitor
   npm run cap:sync:android

   # Open in Android Studio
   npm run cap:open:android
   ```

5. **Google Services Configuration**

   ```bash
   # Download google-services.json from Firebase Console
   # Copy to: frontend/android/app/google-services.json
   ```

#### Testing on Device:

- Connect Android device via USB
- Enable Developer Options and USB Debugging
- Run app from Android Studio

### iOS Setup (macOS Only)

#### Prerequisites:

- **Xcode 14+**
- **iOS 16+ SDK**
- **Apple Developer Account** (for device testing)

#### Setup Steps:

1. **Add iOS Platform**

   ```bash
   cd frontend
   npm install @capacitor/ios
   npm run cap:add:ios
   ```

2. **Configure App**

   ```bash
   # Update ios-info.plist with bundle identifier
   npm run cap:sync:ios
   ```

3. **Open in Xcode**

   ```bash
   npm run cap:open:ios
   ```

4. **Configure Signing**
   - In Xcode, select project
   - Go to Signing & Capabilities
   - Set your Team and Bundle Identifier

#### Testing on Device:

- Connect iPhone/iPad via USB
- Select device in Xcode
- Build and run (⌘+R)

## 🔧 Configuration

### Environment Variables

#### Backend (.env or application.properties)

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
spring.datasource.username=postgres
spring.datasource.password=admin
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Firebase Configuration
firebase.service.account.path=firebase-service-account.json

# Gemini AI Configuration
gemini.api.key=your_gemini_api_key
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Server Configuration
server.port=8081
logging.level.com.finsight=INFO

# CORS Configuration
app.cors.allowed-origins=http://localhost:3000,http://192.168.1.100:3000
app.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
app.cors.allowed-headers=*
app.cors.allow-credentials=true
```

#### Frontend (.env)

```env
REACT_APP_API_BASE_URL=http://localhost:8081/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_ENVIRONMENT=development
```

### Security Configuration

**🔐 [Complete Security Setup Guide](SECURITY_SETUP.md)**

#### Key Security Features:

- Environment-based configuration
- API key protection
- Firebase authentication
- Input validation and sanitization
- CORS configuration
- SQL injection protection

## 🧪 Testing

### Backend Tests

```bash
cd backend
mvn test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### End-to-End Testing

```bash
cd frontend
npm run test:e2e
```

### Mobile Testing

```bash
# Android
npm run cap:run:android

# iOS  
npm run cap:run:ios
```

## 🏗️ Build for Production

### Web Application

#### Backend

```bash
cd backend
mvn clean package -DskipTests
# Output: target/finsight-ai-backend-1.0.0.jar
```

#### Frontend

```bash
cd frontend
npm run build
# Output: build/ directory
```

### Mobile Applications

#### Android APK/AAB

```bash
cd frontend
npm run build:mobile
npm run cap:build:android

# In Android Studio:
# Build → Generate Signed Bundle/APK
# Choose Android App Bundle (.aab) for Play Store
```

#### iOS App

```bash
cd frontend
npm run build:mobile
npm run cap:build:ios

# In Xcode:
# Product → Archive
# Distribute to App Store
```

## 🚀 Deployment

**📚 [Complete Deployment Guide](DEPLOYMENT.md)**

### Quick Deployment Options

#### Web Hosting

- **Frontend**: Netlify, Vercel, Firebase Hosting
- **Backend**: Heroku, AWS Elastic Beanstalk, Google Cloud Platform
- **Database**: AWS RDS, Google Cloud SQL, Heroku Postgres

#### Mobile App Stores

- **Android**: Google Play Store
- **iOS**: Apple App Store

#### Container Deployment

```bash
# Docker deployment
docker-compose up -d

# Kubernetes deployment
kubectl apply -f k8s/
```

## 📊 Project Structure

```
FinSightAI/
├── README.md                    # This file
├── FIREBASE_SETUP.md           # Firebase configuration guide
├── SECURITY_SETUP.md           # Security configuration guide
├── DEPLOYMENT.md               # Deployment instructions
├── .gitignore                  # Git ignore rules
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/finsight/
│   │   ├── controller/         # REST Controllers
│   │   ├── entity/            # JPA Entities
│   │   ├── service/           # Business Logic
│   │   ├── repository/        # Data Access Layer
│   │   └── config/            # Configuration Classes
│   ├── src/main/resources/
│   │   ├── application.properties.example
│   │   └── firebase-service-account.json.example
│   └── pom.xml                # Maven dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React Components
│   │   ├── pages/            # Page Components
│   │   ├── services/         # API Services
│   │   ├── contexts/         # React Contexts
│   │   └── utils/            # Utility Functions
│   ├── public/               # Static Assets
│   ├── android/              # Android Capacitor platform
│   ├── ios/                  # iOS Capacitor platform
│   ├── capacitor.config.json # Capacitor configuration
│   └── package.json          # NPM dependencies
└── docs/                     # Additional documentation
```

## 🎯 Key Features Deep Dive

### AI-Powered Financial Tips

- **Smart Analysis**: Analyzes spending patterns and provides personalized advice
- **Regional Context**: Tailored for South African market (ZAR currency, local insights)
- **Randomized Content**: Tips are shuffled to provide variety on each visit
- **Fallback System**: Graceful fallback when AI service is unavailable

### Expense Management

- **Category System**: Pre-defined and custom expense categories
- **Receipt Scanning**: OCR text extraction using Tesseract.js
- **Bulk Import**: CSV import functionality
- **Search & Filter**: Advanced filtering by date, category, amount

### Budget Tracking

- **Visual Progress**: Real-time budget vs actual spending
- **Smart Alerts**: Notifications when approaching budget limits
- **Monthly/Weekly**: Flexible budget periods
- **Category Budgets**: Individual category budget allocation

### Mobile Features

- **Native Performance**: Capacitor provides native app experience
- **Offline Support**: Core features work without internet
- **Push Notifications**: Budget alerts and reminders
- **Camera Integration**: Receipt photo capture
- **Biometric Auth**: Fingerprint/Face ID support

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: `Connection refused` or `database does not exist`

**Solution**:

1. Ensure PostgreSQL is running:
   - Windows: Check Services for "postgresql-x64"
   - macOS: brew services start postgresql
   - Linux: sudo systemctl start postgresql

2. Verify database exists:
   psql -U postgres -l

3. Check credentials in application.properties

#### Firebase Authentication Issues

**Problem**: Firebase auth not working or configuration errors

**Solution**:

1. Verify Firebase config in frontend/src/firebase.js
2. Check that Authentication is enabled in Firebase Console
3. Ensure Email/Password provider is enabled
4. Verify service account key is in backend/src/main/resources/

#### Backend Won't Start

**Problem**: Spring Boot application fails to start

**Solution**:

1. Check Java version: java -version (should be 17+)
2. Verify Maven is installed: mvn -version
3. Check database connection in application.properties
4. Look for port conflicts (8081 already in use)
5. Run: mvn clean compile to check for compilation errors

#### Frontend Won't Start  

**Problem**: React development server fails to start

**Solution**:

1. Check Node.js version: node -v (should be 18+)
2. Clear npm cache: npm cache clean --force
3. Delete node_modules and reinstall:
   rm -rf node_modules package-lock.json
   npm install
4. Check for port conflicts (3000 already in use)

### Getting Help

1. **Check Logs**: Backend logs in console, frontend in browser DevTools
2. **Verify Configuration**: Double-check all environment variables
3. **Database State**: Ensure PostgreSQL is running and accessible
4. **Network Issues**: Check if all services are reachable
5. **Version Compatibility**: Verify all dependencies are compatible

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Check security implications
- Test on multiple devices/browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent financial insights
- **Firebase** for authentication and hosting services
- **Material-UI** for beautiful React components
- **Capacitor** for seamless mobile development
- **Spring Boot** for robust backend framework
- **PostgreSQL** for reliable data storage

## 📞 Support

- **Documentation**: Check our detailed guides in `/docs`
- **Issues**: Create GitHub issue for bugs/feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: [support@finsight-ai.com](mailto:support@finsight-ai.com)

---

**🚀 Start building your financial future with FinSight AI!** 

*Made with ❤️ for smarter personal finance management*
