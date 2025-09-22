# ⚡ FinSight AI - Quick Start Guide

Get FinSight AI running in 5 minutes!

## 🚀 Super Quick Setup

### 1. Prerequisites Check
- ✅ Java 17+ installed
- ✅ Node.js 18+ installed  
- ✅ PostgreSQL 15+ installed
- ✅ Git installed

### 2. Clone & Setup
```bash
git clone https://github.com/your-username/FinSightAI.git
cd FinSightAI

# Windows
./scripts/setup-windows.bat

# macOS/Linux
./scripts/setup-unix.sh
```

### 3. Configure APIs
```bash
# Windows
./scripts/configure-apis.bat

# macOS/Linux
./scripts/configure-apis.sh
```

### 4. Start Development
```bash
# Windows
./scripts/start-dev.bat

# macOS/Linux
./scripts/start-dev.sh
```

### 5. Access Your App
- 🌐 **Web**: http://localhost:3000
- 🔧 **API**: http://localhost:8081/api
- 📚 **Docs**: http://localhost:8081/api/swagger-ui.html

## 📱 Mobile Setup (Optional)

```bash
# Windows
./scripts/mobile-setup.bat

# macOS/Linux
./scripts/mobile-setup.sh

# Run on Android
cd frontend && npm run android

# Run on iOS (macOS only)
cd frontend && npm run ios
```

## 🔧 Essential Commands

| Task | Windows | macOS/Linux |
|------|---------|-------------|
| **Setup** | `./scripts/setup-windows.bat` | `./scripts/setup-unix.sh` |
| **Configure APIs** | `./scripts/configure-apis.bat` | `./scripts/configure-apis.sh` |
| **Start Dev** | `./scripts/start-dev.bat` | `./scripts/start-dev.sh` |
| **Run Tests** | `./scripts/run-tests.bat` | `./scripts/run-tests.sh` |
| **Build Prod** | `./scripts/build-prod.bat` | `./scripts/build-prod.sh` |
| **Mobile Setup** | `./scripts/mobile-setup.bat` | `./scripts/mobile-setup.sh` |

## 🗄️ Database Quick Setup

```sql
-- Connect as postgres user
psql -U postgres

-- Create database and user
CREATE DATABASE finsight_ai;
CREATE USER finsight_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finsight_ai TO finsight_user;
\q
```

## 🔥 Firebase Quick Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project → Enable Authentication
3. Download service account JSON → Save to `backend/src/main/resources/firebase-service-account.json`
4. Get web config → Update `frontend/.env`

## 🤖 AI Agent Quick Setup

1. Sign up at [Gradient AI](https://gradient.ai/)
2. Create agent → Copy API URL and Key
3. Update `backend/src/main/resources/application.properties`

## 🛠️ Troubleshooting

### Port Issues
```bash
# Kill process on port 8081
# Windows: netstat -ano | findstr :8081 → taskkill /PID <PID> /F
# macOS/Linux: lsof -ti:8081 | xargs kill -9
```

### Database Issues
```bash
# Start PostgreSQL
# Windows: net start postgresql-x64-15
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Clean Install
```bash
# Backend
cd backend && mvn clean install

# Frontend  
cd frontend && npm install

# Mobile
cd frontend && npx cap sync
```

## 📊 Project Structure

```
FinSightAI/
├── backend/                 # Spring Boot API
├── frontend/               # React Web App
├── scripts/               # Automation Scripts
├── README.md             # Full Documentation
├── DEPLOYMENT_GUIDE.md   # Detailed Setup Guide
└── QUICK_START.md        # This File
```

## 🎯 What You Get

- 💰 **Expense Tracking** with receipt scanning
- 📊 **Budget Management** with progress tracking  
- 🤖 **AI-Powered Tips** and financial insights
- 💬 **Intelligent Chatbot** for financial queries
- 📱 **Mobile Apps** for iOS and Android
- 📈 **Analytics & Reports** with PDF/CSV export
- 🔐 **Secure Authentication** via Firebase

## 🆘 Need Help?

- 📖 **Full Guide**: See `README.md`
- 🔧 **Detailed Setup**: See `DEPLOYMENT_GUIDE.md`
- 🐛 **Issues**: Create GitHub issue
- 💬 **Support**: support@finsight.ai

---

**Happy coding! 🚀**
