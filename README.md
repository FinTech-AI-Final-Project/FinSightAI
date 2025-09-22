# 🚀 FinSight AI - Complete Deployment Guide

[![Java](https://img.shields.io/badge/Java-17-orange)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.15.1-blue)](https://mui.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange)](https://firebase.google.com/)

An AI-powered personal finance management application with intelligent insights, expense tracking, budget management, and cross-platform mobile support.

## 🌟 Features

### 💰 Core Financial Management
- **Expense Tracking**: Log and categorize expenses with receipt scanning
- **Budget Management**: Set monthly budgets with progress tracking
- **Financial Reports**: Generate PDF/CSV reports with analytics
- **Multi-Currency Support**: Handle multiple currencies with real-time conversion

### 🤖 AI-Powered Insights
- **Smart Tips**: AI-generated financial advice (Default, Crypto, Cash Flow)
- **Intelligent Chatbot**: Context-aware financial assistant
- **Market Analysis**: Real-time cryptocurrency data integration
- **Personalized Recommendations**: Based on spending patterns

### 📱 Cross-Platform Experience
- **Web Application**: Responsive React interface
- **Mobile Apps**: Native iOS/Android via Capacitor
- **Progressive Web App**: Installable with offline capabilities
- **Smart Routing**: Desktop users see dashboard, mobile users see home screen

### 🔐 Security & Authentication
- **Firebase Authentication**: Secure user management
- **Data Encryption**: Protected financial information
- **Role-Based Access**: User-specific data isolation

## 🏗️ Architecture

```
FinSightAI/
├── backend/                 # Spring Boot API Server
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── pom.xml            # Maven dependencies
├── frontend/               # React Web Application
│   ├── src/               # React source code
│   ├── android/           # Android Capacitor project
│   ├── ios/              # iOS Capacitor project
│   └── package.json      # Node.js dependencies
└── scripts/              # Deployment automation scripts
```

## 🚀 Quick Start (Automated)

### Prerequisites

#### Core Requirements
- **Java 17+** ([Download](https://adoptium.net/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 15+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Maven 3.6+** ([Download](https://maven.apache.org/download.cgi))

#### Mobile Development (Optional)
**Android Development:**
- **Android Studio** ([Download](https://developer.android.com/studio))
- **Android SDK Build-Tools 33.0.0+**
- **Android SDK Platform 33 (API Level 33)**
- **Android SDK Platform-Tools**
- **Android Emulator** (optional, for testing)

**iOS Development (macOS only):**
- **Xcode 14.0+** ([Mac App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **iOS SDK 16.0+** (included with Xcode)
- **Command Line Tools for Xcode**
- **Apple Developer Account** (for device testing)
- **iOS Simulator** (included with Xcode)

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/FinSightAI.git
cd FinSightAI

# Windows
./scripts/setup-windows.bat

# macOS/Linux
./scripts/setup-unix.sh
```

### 2. Configure APIs
```bash
# Windows
./scripts/configure-apis.bat

# macOS/Linux
./scripts/configure-apis.sh
```

### 3. Start Development
```bash
# Windows
./scripts/start-dev.bat

# macOS/Linux
./scripts/start-dev.sh
```

## 📜 Available Scripts

| Script | Windows | macOS/Linux | Description |
|--------|---------|-------------|-------------|
| **Setup** | `setup-windows.bat` | `setup-unix.sh` | Complete project setup |
| **Configure APIs** | `configure-apis.bat` | `configure-apis.sh` | Firebase & AI agent setup |
| **Start Development** | `start-dev.bat` | `start-dev.sh` | Start both servers |
| **Run Tests** | `run-tests.bat` | `run-tests.sh` | Run all tests |
| **Build Production** | `build-prod.bat` | `build-prod.sh` | Build for deployment |
| **Mobile Setup** | `mobile-setup.bat` | `mobile-setup.sh` | Setup mobile development |

## 📋 Manual Setup (Step by Step)

### Step 1: Database Setup

1. **Install PostgreSQL 15+**
2. **Create Database**:
   ```sql
   CREATE DATABASE finsight_ai;
   CREATE USER finsight_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE finsight_ai TO finsight_user;
   ```

### Step 2: Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Authentication (Email/Password)

2. **Get Configuration**:
   - **Web Config**: Project Settings → General → Web apps
   - **Service Account**: Project Settings → Service Accounts → Generate Key

3. **Download Files**:
   - Save service account JSON as `backend/src/main/resources/firebase-service-account.json`
   - Note down web config for frontend

### Step 3: AI Agent Setup

1. **Get Gradient AI API Key**:
   - Sign up at [Gradient AI](https://gradient.ai/)
   - Create an agent
   - Copy API URL and Key

### Step 4: Backend Configuration

1. **Copy Configuration**:
   ```bash
   cd backend/src/main/resources
   cp application.properties.example application.properties
   ```

2. **Edit `application.properties`**:
   ```properties
   # Database
   spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
   spring.datasource.username=finsight_user
   spring.datasource.password=your_secure_password
   
   # AI Agent
   ai.agent.api.url=your_gradient_ai_agent_url
   ai.agent.api.key=your_gradient_ai_api_key
   ```

### Step 5: Frontend Configuration

1. **Copy Configuration**:
   ```bash
   cd frontend
   cp env.example .env
   ```

2. **Edit `.env`**:
   ```bash
   # API URLs
   REACT_APP_API_URL=http://localhost:8081/api
   REACT_APP_API_URL_MOBILE=http://YOUR_LOCAL_IP:8081/api
   
   # Firebase Config
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### Step 6: Install Dependencies

```bash
# Backend
cd backend
mvn clean install

# Frontend
cd frontend
npm install
```

## 🖥️ Running the Application

### Development Mode

1. **Start Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application**:
   - **Web**: http://localhost:3000
   - **API**: http://localhost:8081/api
   - **API Docs**: http://localhost:8081/api/swagger-ui.html

### Production Build

```bash
# Build Backend
cd backend
mvn clean package -DskipTests

# Build Frontend
cd frontend
npm run build
```

## 📱 Mobile Development

### Quick Mobile Setup
```bash
# Windows
./scripts/mobile-setup.bat

# macOS/Linux
./scripts/mobile-setup.sh
```

### Android Setup

1. **Install Android Studio**
2. **Add Android Platform**:
   ```bash
   cd frontend
   npm run cap:add:android
   ```

3. **Build and Run**:
   ```bash
   npm run android
   ```

### iOS Setup

1. **Install Xcode** (macOS only)
2. **Add iOS Platform**:
   ```bash
   cd frontend
   npm run cap:add:ios
   ```

3. **Build and Run**:
   ```bash
   npm run ios
   ```

### 📋 Complete Mobile Requirements

For detailed mobile development requirements including:
- **All Capacitor plugins and versions**
- **Android SDK requirements and versions**
- **iOS/Xcode requirements and versions**
- **Native permissions and configurations**
- **Platform-specific setup instructions**
- **Troubleshooting guides**

See: **[MOBILE_REQUIREMENTS.md](MOBILE_REQUIREMENTS.md)**

## 🔧 Configuration Details

### Environment Variables

#### Backend (`application.properties`)
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
spring.datasource.username=your_username
spring.datasource.password=your_password

# Server Configuration
server.port=8081
server.address=0.0.0.0

# Firebase Configuration
firebase.service-account-key=classpath:firebase-service-account.json

# AI Agent Configuration
ai.agent.api.url=your_ai_agent_url
ai.agent.api.key=your_ai_api_key

# CORS Configuration
app.cors.allowed-origins=http://localhost:3000,http://localhost:8100
```

#### Frontend (`.env`)
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8081/api
REACT_APP_API_URL_MOBILE=http://YOUR_LOCAL_IP:8081/api

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Optional: Crypto API
REACT_APP_BLOCKCHAIR_API_KEY=your_blockchair_key
```

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
# Start both backend and frontend, then:
cd frontend
npm run test:e2e
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8081/api/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8081/api/v3/api-docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses` | Get user expenses |
| POST | `/api/budgets` | Create budget |
| GET | `/api/budgets` | Get user budgets |
| GET | `/api/ai-tips/multiple` | Get AI tips |
| POST | `/api/ai-chatbot` | Chat with AI assistant |

## 🚢 Production Deployment

### Docker Deployment

1. **Build Images**:
   ```bash
   # Backend
   cd backend
   mvn clean package -DskipTests
   docker build -t finsight-backend .
   
   # Frontend
   cd frontend
   npm run build
   docker build -t finsight-frontend .
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

### Cloud Deployment

#### Backend (Spring Boot)
- **Heroku**: Use `Procfile` and environment variables
- **AWS**: Deploy to Elastic Beanstalk or ECS
- **Google Cloud**: Deploy to App Engine or Cloud Run

#### Frontend (React)
- **Netlify**: Connect GitHub repo for auto-deployment
- **Vercel**: Import project and configure build settings
- **Firebase Hosting**: Use `firebase deploy`

### Production Checklist

- [ ] Update database credentials
- [ ] Configure production Firebase settings
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Update CORS origins
- [ ] Set up CI/CD pipeline

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in `application.properties`
   - Ensure database exists

2. **Firebase Authentication Error**
   - Verify service account JSON file exists
   - Check Firebase project configuration
   - Ensure authentication is enabled

3. **Mobile Build Fails**
   - Update Android SDK/Xcode
   - Run `npx cap sync`
   - Check platform-specific requirements

4. **AI Agent Not Responding**
   - Verify API key and URL
   - Check network connectivity
   - Review backend logs

### Getting Help

- **Issues**: Create GitHub issue with logs
- **Documentation**: Check `/docs` folder
- **Community**: Join our Discord server

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow Java naming conventions for backend
- Use functional components and hooks for React
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure mobile compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spring Boot** for robust backend framework
- **React** for modern frontend library
- **Material-UI** for beautiful UI components
- **Firebase** for authentication and hosting
- **Capacitor** for cross-platform mobile development
- **Chart.js** for data visualization
- **Gradient AI** for intelligent insights

---

**Made with ❤️ by the FinSight AI Team**

For support, create an issue or contact us at support@finsight.ai
