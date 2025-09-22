# 📜 FinSight AI - Scripts Overview

This document provides an overview of all automation scripts available in the FinSight AI project.

## 📁 Scripts Directory Structure

```
scripts/
├── setup-windows.bat          # Windows setup automation
├── setup-unix.sh             # macOS/Linux setup automation
├── configure-apis.bat         # Windows API configuration wizard
├── configure-apis.sh          # macOS/Linux API configuration wizard
├── start-dev.bat             # Windows development server starter
├── start-dev.sh              # macOS/Linux development server starter
├── build-prod.bat            # Windows production build
├── build-prod.sh             # macOS/Linux production build
├── run-tests.bat             # Windows test runner
├── run-tests.sh              # macOS/Linux test runner
├── mobile-setup.bat          # Windows mobile development setup
└── mobile-setup.sh           # macOS/Linux mobile development setup
```

## 🚀 Script Descriptions

### 1. Setup Scripts

#### `setup-windows.bat` / `setup-unix.sh`
**Purpose**: Complete project setup and dependency installation

**What it does**:
- ✅ Checks prerequisites (Java, Node.js, PostgreSQL, Maven)
- 📁 Creates project structure
- 📋 Copies configuration templates
- 📦 Installs backend dependencies (Maven)
- 📦 Installs frontend dependencies (npm)
- 🌐 Detects local IP address for mobile development
- 🔄 Updates mobile API URL automatically

**Usage**:
```bash
# Windows
./scripts/setup-windows.bat

# macOS/Linux
./scripts/setup-unix.sh
```

### 2. API Configuration Scripts

#### `configure-apis.bat` / `configure-apis.sh`
**Purpose**: Interactive wizard for Firebase and AI Agent configuration

**What it does**:
- 🔥 Guides through Firebase setup
- 📱 Configures Firebase web app settings
- 🤖 Sets up AI Agent API credentials
- 📝 Updates configuration files automatically
- ✅ Validates configuration completeness

**Usage**:
```bash
# Windows
./scripts/configure-apis.bat

# macOS/Linux
./scripts/configure-apis.sh
```

### 3. Development Server Scripts

#### `start-dev.bat` / `start-dev.sh`
**Purpose**: Start development environment with both backend and frontend

**What it does**:
- 🔍 Validates configuration files
- 🗄️ Checks PostgreSQL service status
- 🔧 Starts Spring Boot backend server
- 🌐 Starts React development server
- 📊 Provides access URLs and monitoring info
- 🛑 Handles graceful shutdown

**Usage**:
```bash
# Windows
./scripts/start-dev.bat

# macOS/Linux
./scripts/start-dev.sh
```

**Access Points**:
- Web App: http://localhost:3000
- Backend API: http://localhost:8081/api
- API Documentation: http://localhost:8081/api/swagger-ui.html

### 4. Production Build Scripts

#### `build-prod.bat` / `build-prod.sh`
**Purpose**: Build application for production deployment

**What it does**:
- 🔧 Builds backend JAR file
- 🌐 Creates optimized frontend build
- 📱 Syncs mobile app platforms
- 📦 Prepares deployment artifacts
- 🚀 Provides deployment guidance

**Usage**:
```bash
# Windows
./scripts/build-prod.bat

# macOS/Linux
./scripts/build-prod.sh
```

**Output**:
- Backend: `backend/target/finsight-ai-0.0.1-SNAPSHOT.jar`
- Frontend: `frontend/build/`
- Mobile: `frontend/android/` and `frontend/ios/`

### 5. Test Runner Scripts

#### `run-tests.bat` / `run-tests.sh`
**Purpose**: Execute all project tests with reporting

**What it does**:
- 🧪 Runs backend unit tests (Maven)
- 🧪 Runs frontend tests with coverage (Jest)
- 📊 Generates test reports
- 📁 Saves results to `test-results/` directory
- ✅ Provides pass/fail summary

**Usage**:
```bash
# Windows
./scripts/run-tests.bat

# macOS/Linux
./scripts/run-tests.sh
```

### 6. Mobile Development Scripts

#### `mobile-setup.bat` / `mobile-setup.sh`
**Purpose**: Set up mobile development environment

**What it does**:
- 🔍 Checks mobile development prerequisites
- 📱 Adds Android/iOS platforms
- 🔧 Installs Capacitor CLI
- 🔄 Builds and syncs mobile apps
- 📖 Provides mobile development guidance

**Usage**:
```bash
# Windows
./scripts/mobile-setup.bat

# macOS/Linux
./scripts/mobile-setup.sh
```

## 🔄 Typical Workflow

### First Time Setup
```bash
# 1. Clone repository
git clone https://github.com/your-username/FinSightAI.git
cd FinSightAI

# 2. Run setup script
./scripts/setup-windows.bat    # Windows
./scripts/setup-unix.sh        # macOS/Linux

# 3. Configure APIs
./scripts/configure-apis.bat   # Windows
./scripts/configure-apis.sh    # macOS/Linux

# 4. Start development
./scripts/start-dev.bat        # Windows
./scripts/start-dev.sh         # macOS/Linux
```

### Daily Development
```bash
# Start development servers
./scripts/start-dev.bat        # Windows
./scripts/start-dev.sh         # macOS/Linux

# Run tests before committing
./scripts/run-tests.bat        # Windows
./scripts/run-tests.sh         # macOS/Linux
```

### Mobile Development
```bash
# Setup mobile environment (one time)
./scripts/mobile-setup.bat     # Windows
./scripts/mobile-setup.sh      # macOS/Linux

# Run on mobile devices
cd frontend
npm run android                # Android
npm run ios                    # iOS (macOS only)
```

### Production Deployment
```bash
# Build for production
./scripts/build-prod.bat       # Windows
./scripts/build-prod.sh        # macOS/Linux

# Deploy using Docker
docker-compose up -d
```

## 🛠️ Script Features

### Error Handling
- ✅ Prerequisite validation
- ❌ Graceful error messages
- 🔄 Automatic retry mechanisms
- 📝 Detailed logging

### User Experience
- 🎨 Colored output (Unix scripts)
- 📊 Progress indicators
- ✅ Success confirmations
- 📖 Clear instructions

### Cross-Platform Support
- 🪟 Windows batch scripts
- 🐧 Unix shell scripts
- 🔄 Consistent functionality
- 📱 Platform-specific optimizations

## 🔧 Customization

### Environment Variables
Scripts respect these environment variables:
- `JAVA_HOME` - Java installation path
- `NODE_ENV` - Node.js environment
- `POSTGRES_HOST` - PostgreSQL host
- `POSTGRES_PORT` - PostgreSQL port

### Configuration Files
Scripts automatically update:
- `backend/src/main/resources/application.properties`
- `frontend/.env`
- `frontend/capacitor.config.json`

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied (Unix)**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Script Not Found (Windows)**
   - Ensure you're in the project root directory
   - Use `./scripts/script-name.bat`

3. **Prerequisites Missing**
   - Scripts will check and report missing software
   - Follow the provided download links

4. **Port Conflicts**
   - Scripts check for port availability
   - Kill conflicting processes automatically

### Getting Help

- 📖 Check `README.md` for detailed documentation
- 🔧 See `DEPLOYMENT_GUIDE.md` for step-by-step instructions
- ⚡ Use `QUICK_START.md` for rapid setup
- 🐛 Create GitHub issue for script problems

## 📚 Additional Resources

- [Main README](README.md) - Complete project documentation
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed setup instructions
- [Quick Start](QUICK_START.md) - Rapid setup guide
- [Docker Compose](docker-compose.yml) - Container deployment

---

**All scripts are designed to be idempotent - safe to run multiple times!** 🔄
