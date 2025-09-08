# 🔥 Firebase Setup Instructions for FinSight AI

## ✅ Database Configuration Complete
Your PostgreSQL database is now configured:
- Database: `finsight_ai` 
- Username: `postgres`
- Password: `admin`

## 🔥 Firebase Configuration Steps

### Step 1: Create Firebase Project

1. **Visit Firebase Console**
   ```
   https://console.firebase.google.com
   ```

2. **Create New Project**
   - Click "Create a project" 
   - Project name: `FinSight AI` (or your preferred name)
   - Enable/disable Google Analytics (your choice)
   - Click "Create project"

### Step 2: Enable Authentication

1. **Go to Authentication**
   - In left sidebar, click "Authentication"
   - Click "Get started"

2. **Enable Email/Password Sign-in**
   - Click "Sign-in method" tab
   - Click on "Email/Password" provider
   - Toggle "Enable" switch ON
   - Click "Save"

### Step 3: Get Web App Configuration

1. **Add Web App to Project**
   - Go to Project Overview (click gear icon → "Project settings")
   - Scroll down to "Your apps" section
   - Click the web icon `</>`
   - App nickname: `FinSight AI Web`
   - Check "Set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration Object**
   You'll see something like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project-12345.firebaseapp.com",
     projectId: "your-project-12345", 
     storageBucket: "your-project-12345.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456789012"
   };
   ```

3. **Update Frontend Configuration**
   - Open: `frontend/src/firebase.js`
   - Replace the placeholder values with your actual config:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_ACTUAL_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_ACTUAL_PROJECT_ID",
     storageBucket: "YOUR_ACTUAL_PROJECT_ID.appspot.com", 
     messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
     appId: "YOUR_ACTUAL_APP_ID"
   };
   ```

### Step 4: Generate Service Account Key (Backend)

1. **Create Service Account**
   - Still in Firebase Console, go to Project Settings
   - Click "Service accounts" tab
   - Click "Generate new private key"
   - Confirm by clicking "Generate key"
   - A JSON file will download automatically

2. **Install Service Account Key**
   - Rename the downloaded file to: `firebase-service-account.json`
   - Copy this file to: `backend/src/main/resources/firebase-service-account.json`

### Step 5: Set Up Development Users (Optional)

1. **Add Test Users**
   - Go to Authentication → Users
   - Click "Add user"
   - Email: `test@finsight.com`
   - Password: `Test123!`
   - Click "Add user"

### Step 6: Configure Authorized Domains

1. **Add Local Development Domain**
   - Go to Authentication → Settings
   - Scroll to "Authorized domains"
   - Add `localhost` if not already present
   - This allows authentication from your development server

## 🚀 Testing Your Setup

### 1. Start the Backend
```bash
cd backend
mvn spring-boot:run
```

### 2. Start the Frontend  
```bash
cd frontend
npm start
```

### 3. Test Authentication
- Open http://localhost:3000
- Click "Register" to create a new account
- Try logging in with your credentials
- Check Firebase Console → Authentication → Users to see registered users

## 🔧 Configuration Files Updated

### ✅ Backend Database Configuration
File: `backend/src/main/resources/application.properties`
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/finsight_ai
spring.datasource.username=postgres  
spring.datasource.password=admin
```

### ✅ Frontend Firebase Configuration  
File: `frontend/src/firebase.js`
```javascript
// TODO: Update with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

### 📁 Required Service Account File
Location: `backend/src/main/resources/firebase-service-account.json`
(Download from Firebase Console → Project Settings → Service Accounts)

## 🐛 Troubleshooting

### Common Issues:

1. **"Firebase app not initialized"**
   - Check that you updated `frontend/src/firebase.js` with correct config

2. **"Authentication failed"** 
   - Verify service account JSON is in correct location
   - Check Firebase project has Authentication enabled

3. **"CORS errors"**
   - Ensure `http://localhost:3000` is in authorized domains
   - Check backend CORS configuration

4. **Database connection errors**
   - Verify PostgreSQL is running
   - Check database name: `finsight_ai` exists
   - Confirm username/password: `postgres`/`admin`

## ✅ Next Steps

Once Firebase is configured:

1. **Test the application**
   - Register a new user
   - Add some expenses  
   - Create budgets
   - Check AI tips functionality

2. **Explore features**
   - Dashboard analytics
   - Expense categories
   - Budget progress tracking
   - Reports and exports

3. **Mobile development** (optional)
   ```bash
   npm run cap:add:android
   npm run cap:add:ios
   ```

Your FinSight AI application will be fully functional once Firebase is configured! 🎉
